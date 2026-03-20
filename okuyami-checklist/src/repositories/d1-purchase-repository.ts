import type {
  CreatePendingPurchaseInput,
  MarkPurchasePaidInput,
  PurchaseRecord,
  PurchaseRepository
} from "./purchase-repository";

interface D1PurchaseRepositoryOptions {
  now?: () => Date;
  createId?: () => string;
}

interface PurchaseRow {
  id: string;
  email: string | null;
  stripe_session_id: string | null;
  status: string;
  snapshot_json: string;
  created_at: string;
  paid_at: string | null;
  delivery_email_sent_at: string | null;
}

interface WebhookEventRow {
  stripe_event_id: string;
}

interface WebhookEventClaimRow {
  stripe_event_id: string;
  claim_token: string;
  claimed_at: string;
  claim_expires_at: string;
}

const WEBHOOK_CLAIM_LEASE_MS = 15 * 60 * 1000;

export function createD1PurchaseRepository(
  db: D1Database,
  options: D1PurchaseRepositoryOptions = {}
): PurchaseRepository {
  const now = options.now ?? (() => new Date());
  const createId = options.createId ?? (() => createRecordId("pur", now()));

  return {
    async createPending(input: CreatePendingPurchaseInput): Promise<string> {
      const id = createId();
      const createdAt = now().toISOString();
      await db
        .prepare(
          `
            insert into purchases (
              id,
              email,
              stripe_session_id,
              status,
              snapshot_json,
              created_at,
              paid_at,
              delivery_email_sent_at
            ) values (?1, ?2, ?3, 'pending', ?4, ?5, null, null)
          `
        )
        .bind(id, input.email, input.stripeSessionId ?? null, input.snapshotJson, createdAt)
        .run();
      return id;
    },

    async findById(id: string): Promise<PurchaseRecord | null> {
      const row = await db
        .prepare(
          `
            select
              id,
              email,
              stripe_session_id,
              status,
              snapshot_json,
              created_at,
              paid_at,
              delivery_email_sent_at
            from purchases
            where id = ?1
          `
        )
        .bind(id)
        .first<PurchaseRow>();
      return row ? mapPurchaseRow(row) : null;
    },

    async findByStripeSessionId(stripeSessionId: string): Promise<PurchaseRecord | null> {
      const row = await db
        .prepare(
          `
            select
              id,
              email,
              stripe_session_id,
              status,
              snapshot_json,
              created_at,
              paid_at,
              delivery_email_sent_at
            from purchases
            where stripe_session_id = ?1
          `
        )
        .bind(stripeSessionId)
        .first<PurchaseRow>();
      return row ? mapPurchaseRow(row) : null;
    },

    async setStripeSessionId(purchaseId: string, stripeSessionId: string): Promise<void> {
      await db
        .prepare(
          `
            update purchases
            set stripe_session_id = ?1
            where id = ?2
          `
        )
        .bind(stripeSessionId, purchaseId)
        .run();
    },

    async markPaid(input: MarkPurchasePaidInput): Promise<void> {
      const paidAt = input.paidAt ?? now().toISOString();
      if (input.stripeSessionId) {
        await db
          .prepare(
            `
              update purchases
              set status = 'paid',
                  paid_at = ?1,
                  stripe_session_id = ?2
              where id = ?3
            `
          )
          .bind(paidAt, input.stripeSessionId, input.id)
          .run();
        return;
      }

      await db
        .prepare(
          `
            update purchases
            set status = 'paid',
                paid_at = ?1
            where id = ?2
          `
        )
        .bind(paidAt, input.id)
        .run();
    },

    async markDeliveryEmailSent(purchaseId: string, sentAt?: string): Promise<void> {
      await db
        .prepare(
          `
            update purchases
            set delivery_email_sent_at = ?1
            where id = ?2
          `
        )
        .bind(sentAt ?? now().toISOString(), purchaseId)
        .run();
    },

    async claimDeliveryEmail(purchaseId: string, sentAt?: string): Promise<boolean> {
      const result = await db
        .prepare(
          `
            update purchases
            set delivery_email_sent_at = ?1
            where id = ?2 and delivery_email_sent_at is null
          `
        )
        .bind(sentAt ?? now().toISOString(), purchaseId)
        .run();

      return result.meta.changes > 0;
    },

    async claimWebhookEventProcessing(
      stripeEventId: string,
      claimToken: string
    ): Promise<boolean> {
      const claimedAt = now().toISOString();
      const claimExpiresAt = new Date(
        Date.parse(claimedAt) + WEBHOOK_CLAIM_LEASE_MS
      ).toISOString();
      const result = await db
        .prepare(
          `
            insert into webhook_event_claims (
              stripe_event_id,
              claim_token,
              claimed_at,
              claim_expires_at
            )
            select ?1, ?2, ?3, ?4
            where not exists (
              select 1
              from processed_webhook_events
              where stripe_event_id = ?1
            )
            on conflict(stripe_event_id) do update set
              claim_token = excluded.claim_token,
              claimed_at = excluded.claimed_at,
              claim_expires_at = excluded.claim_expires_at
            where not exists (
              select 1
              from processed_webhook_events
              where stripe_event_id = excluded.stripe_event_id
            )
            and (
              webhook_event_claims.claim_expires_at < excluded.claimed_at
            )
          `
        )
        .bind(stripeEventId, claimToken, claimedAt, claimExpiresAt)
        .run();

      return result.meta.changes > 0;
    },

    async releaseWebhookEventProcessingClaim(
      stripeEventId: string,
      claimToken: string
    ): Promise<boolean> {
      const result = await db
        .prepare(
          `
            delete from webhook_event_claims
            where stripe_event_id = ?1 and claim_token = ?2
          `
        )
        .bind(stripeEventId, claimToken)
        .run();

      return result.meta.changes > 0;
    },

    async hasProcessedWebhookEvent(stripeEventId: string): Promise<boolean> {
      const row = await db
        .prepare(
          `
            select stripe_event_id
            from processed_webhook_events
            where stripe_event_id = ?1
          `
        )
        .bind(stripeEventId)
        .first<WebhookEventRow>();
      return row !== null;
    },

    async recordProcessedWebhookEvent(
      stripeEventId: string,
      processedAt?: string
    ): Promise<boolean> {
      const result = await db
        .prepare(
          `
            insert into processed_webhook_events (stripe_event_id, processed_at)
            values (?1, ?2)
            on conflict(stripe_event_id) do nothing
          `
        )
        .bind(stripeEventId, processedAt ?? now().toISOString())
        .run();
      return result.meta.changes > 0;
    }
  };
}

function mapPurchaseRow(row: PurchaseRow): PurchaseRecord {
  return {
    id: row.id,
    email: row.email,
    stripeSessionId: row.stripe_session_id,
    status: row.status === "paid" ? "paid" : "pending",
    snapshotJson: row.snapshot_json,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    deliveryEmailSentAt: row.delivery_email_sent_at
  };
}

function createRecordId(prefix: string, date: Date): string {
  const entropy = crypto.randomUUID().replace(/-/gu, "").slice(0, 10);
  return `${prefix}_${date.getTime().toString(36)}${entropy}`;
}
