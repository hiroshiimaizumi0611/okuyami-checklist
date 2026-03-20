export type PurchaseStatus = "pending" | "paid";

export interface PurchaseRecord {
  id: string;
  email: string | null;
  stripeSessionId: string | null;
  status: PurchaseStatus;
  snapshotJson: string;
  createdAt: string;
  paidAt: string | null;
  deliveryEmailSentAt: string | null;
}

export interface CreatePendingPurchaseInput {
  email: string;
  snapshotJson: string;
  stripeSessionId?: string | null;
}

export interface MarkPurchasePaidInput {
  id: string;
  paidAt?: string;
  stripeSessionId?: string | null;
}

export interface PurchaseRepository {
  createPending(input: CreatePendingPurchaseInput): Promise<string>;
  findById(id: string): Promise<PurchaseRecord | null>;
  findByStripeSessionId(stripeSessionId: string): Promise<PurchaseRecord | null>;
  setStripeSessionId(purchaseId: string, stripeSessionId: string): Promise<void>;
  markPaid(input: MarkPurchasePaidInput): Promise<void>;
  markDeliveryEmailSent(purchaseId: string, sentAt?: string): Promise<void>;
  claimDeliveryEmail(purchaseId: string, sentAt?: string): Promise<boolean>;
  claimWebhookEventProcessing(stripeEventId: string, claimToken: string): Promise<boolean>;
  releaseWebhookEventProcessingClaim(
    stripeEventId: string,
    claimToken: string
  ): Promise<boolean>;
  hasProcessedWebhookEvent(stripeEventId: string): Promise<boolean>;
  recordProcessedWebhookEvent(stripeEventId: string, processedAt?: string): Promise<boolean>;
}
