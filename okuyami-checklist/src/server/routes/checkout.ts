import type { Context } from "hono";
import { parseResultSnapshot } from "../../domain/result-snapshot";
import {
  getExecutionCtxOrUndefined,
  trackAnalyticsInBackground
} from "../../lib/analytics";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import { readRequiredEnv, type AppContextEnv } from "../../lib/env";
import { verifySnapshotToken } from "../../lib/snapshot-token";
import {
  buildPdfLineItem,
  createPaymentGateway,
  PAID_PDF_PRICE_JPY
} from "../../services/payments/stripe-client";

export async function submitCheckout(c: Context<AppContextEnv>) {
  const formData = await c.req.formData();
  const email = getFormValue(formData, "email");
  const snapshotToken = getFormValue(formData, "snapshot_token");

  if (email === null || snapshotToken === null || !isValidEmail(email)) {
    return c.text("Invalid checkout submission.", 400);
  }

  const env = c.env;
  const snapshotSecret = readRequiredEnv(env, "SNAPSHOT_TOKEN_SECRET");
  const appUrl = readRequiredEnv(env, "APP_URL");
  let snapshot;
  try {
    snapshot = await verifySnapshotToken(snapshotToken, snapshotSecret);
  } catch {
    return c.text("Invalid checkout submission.", 400);
  }
  const purchaseRepository = createD1PurchaseRepository(env.DB);
  const purchaseId = await purchaseRepository.createPending({
    email,
    snapshotJson: JSON.stringify(snapshot)
  });

  const paymentGateway = createPaymentGateway(env);
  const session = await paymentGateway.createCheckoutSession({
    mode: "payment",
    line_items: [buildPdfLineItem(PAID_PDF_PRICE_JPY)],
    success_url: `${appUrl}/purchase/success?purchaseId=${purchaseId}`,
    cancel_url: `${appUrl}/results?canceled=1`,
    metadata: {
      purchaseId
    },
    customer_email: email
  });

  await purchaseRepository.setStripeSessionId(purchaseId, session.id);
  const parsedSnapshot = parseResultSnapshot(snapshot);
  trackAnalyticsInBackground(getExecutionCtxOrUndefined(c), env, "checkout_started", {
    purchaseId,
    resultCount: parsedSnapshot.procedures.length
  });

  if (env.PAYMENT_MODE === "test") {
    const redirectUrl = new URL("/purchase/success", appUrl);
    redirectUrl.searchParams.set("purchaseId", purchaseId);
    redirectUrl.searchParams.set("testSessionId", session.id);
    return c.redirect(`${redirectUrl.pathname}${redirectUrl.search}`, 303);
  }

  return c.redirect(session.url, 303);
}

function getFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}
