import type { Context } from "hono";
import {
  getExecutionCtxOrUndefined,
  trackAnalyticsInBackground
} from "../../lib/analytics";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import { type AppContextEnv } from "../../lib/env";
import { createEmailService } from "../../services/email/email-service";
import {
  createPaymentGateway,
  type PaymentWebhookEvent
} from "../../services/payments/stripe-client";

export async function handleStripeWebhook(c: Context<AppContextEnv>) {
  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.text("Missing Stripe signature.", 400);
  }

  const rawBody = await c.req.text();
  const paymentGateway = createPaymentGateway(c.env);
  let event;

  try {
    event = await paymentGateway.verifyWebhookEvent(
      rawBody,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return c.text("Invalid Stripe webhook signature.", 400);
  }

  const result = await processStripeWebhookEvent(
    c.env,
    getExecutionCtxOrUndefined(c),
    event
  );
  return c.text(result.message, result.status);
}

interface WebhookProcessResult {
  status: 200 | 500;
  message: string;
  purchaseId?: string;
}

export async function processStripeWebhookEvent(
  env: AppContextEnv["Bindings"],
  executionCtx: Pick<ExecutionContext, "waitUntil"> | undefined,
  event: PaymentWebhookEvent
): Promise<WebhookProcessResult> {
  const purchaseRepository = createD1PurchaseRepository(env.DB);
  const emailService = createEmailService(env);
  const claimToken = crypto.randomUUID();
  const claimed = await purchaseRepository.claimWebhookEventProcessing(
    event.id,
    claimToken
  );
  if (!claimed) {
    return { status: 200, message: "ok" };
  }

  let senderCompleted = false;
  try {
    if (event.type !== "checkout.session.completed") {
      await purchaseRepository.recordProcessedWebhookEvent(event.id);
      await releaseWebhookClaim(purchaseRepository, event.id, claimToken);
      return { status: 200, message: "ok" };
    }

    const sessionId = event.data.object.id;
    const purchase =
      (await purchaseRepository.findByStripeSessionId(sessionId)) ??
      (event.data.object.metadata?.purchaseId
        ? await purchaseRepository.findById(event.data.object.metadata.purchaseId)
        : null);
    if (!purchase) {
      throw new Error("Purchase not found for Stripe webhook");
    }

    await purchaseRepository.markPaid({
      id: purchase.id,
      stripeSessionId: sessionId,
      paidAt: new Date().toISOString()
    });

    if (!purchase.deliveryEmailSentAt) {
      await emailService.sendPaidDownloadEmail(purchase);
      senderCompleted = true;
      await purchaseRepository.markDeliveryEmailSent(purchase.id);
    }

    trackAnalyticsInBackground(executionCtx, env, "purchase_completed", {
      purchaseId: purchase.id,
      stripeSessionId: sessionId
    });
    await purchaseRepository.recordProcessedWebhookEvent(event.id);
    await releaseWebhookClaim(purchaseRepository, event.id, claimToken);
    return {
      status: 200,
      message: "ok",
      purchaseId: purchase.id
    };
  } catch {
    if (!senderCompleted) {
      await releaseWebhookClaim(purchaseRepository, event.id, claimToken);
    }
    return {
      status: 500,
      message: "Stripe webhook processing failed."
    };
  }
}

async function releaseWebhookClaim(
  purchaseRepository: ReturnType<typeof createD1PurchaseRepository>,
  stripeEventId: string,
  claimToken: string
): Promise<void> {
  try {
    await purchaseRepository.releaseWebhookEventProcessingClaim(stripeEventId, claimToken);
  } catch {
    // Best-effort cleanup; processed state is the durable source of truth.
  }
}
