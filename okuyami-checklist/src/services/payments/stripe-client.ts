import Stripe from "stripe";
import type { WorkerEnv } from "../../lib/env";

export const PAID_PDF_PRICE_JPY = 1480;

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      metadata?: Record<string, string>;
    };
  };
}

export interface PaymentGateway {
  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams
  ): Promise<CheckoutSessionResult>;
  verifyWebhookEvent(
    rawBody: string,
    signature: string,
    secret: string
  ): Promise<PaymentWebhookEvent>;
}

export function buildPdfLineItem(
  amountJpy: number = PAID_PDF_PRICE_JPY
): Stripe.Checkout.SessionCreateParams.LineItem {
  return {
    price_data: {
      currency: "jpy",
      product_data: {
        name: "おくやみ手続きナビ 有料版"
      },
      unit_amount: amountJpy
    },
    quantity: 1
  };
}

export function createPaymentGateway(env: WorkerEnv): PaymentGateway {
  if (env.PAYMENT_MODE === "test") {
    return createTestPaymentGateway();
  }

  return createStripePaymentGateway(readStripeSecretKey(env));
}

export function createTestPaymentGateway(): PaymentGateway {
  return {
    async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
      const id = `cs_test_${crypto.randomUUID().replace(/-/gu, "").slice(0, 24)}`;
      return {
        id,
        url: `https://checkout.stripe.com/c/pay/${id}`
      };
    },

    async verifyWebhookEvent(rawBody: string, signature: string, secret: string) {
      const expectedSignature = await signTestWebhookPayload(rawBody, secret);
      if (signature !== expectedSignature) {
        throw new Error("Invalid Stripe webhook signature");
      }

      return parseWebhookEvent(rawBody);
    }
  };
}

export function createStripePaymentGateway(stripeSecretKey: string): PaymentGateway {
  const stripe = new Stripe(stripeSecretKey);

  return {
    async createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
      const session = await stripe.checkout.sessions.create(params);
      if (!session.url) {
        throw new Error("Stripe checkout session did not return a redirect URL");
      }

      return {
        id: session.id,
        url: session.url
      };
    },

    async verifyWebhookEvent(rawBody: string, signature: string, secret: string) {
      const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      return normalizeStripeEvent(event);
    }
  };
}

export async function signTestWebhookPayload(
  rawBody: string,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return `v1.${toHex(new Uint8Array(signature))}`;
}

function readStripeSecretKey(env: WorkerEnv): string {
  const value = env.STRIPE_SECRET_KEY;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
  }

  return value;
}

function normalizeStripeEvent(event: Stripe.Event): PaymentWebhookEvent {
  const object = event.data.object as Stripe.Event.Data.Object & {
    id: string;
    metadata?: Record<string, string>;
  };

  return {
    id: event.id,
    type: event.type,
    data: {
      object: {
        id: object.id,
        metadata: object.metadata
      }
    }
  };
}

function parseWebhookEvent(rawBody: string): PaymentWebhookEvent {
  const parsed = JSON.parse(rawBody) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid Stripe webhook payload");
  }

  const event = parsed as Record<string, unknown>;
  const data = event.data as Record<string, unknown> | undefined;
  const object = data?.object as Record<string, unknown> | undefined;
  const metadata = object?.metadata as Record<string, unknown> | undefined;

  if (
    typeof event.id !== "string" ||
    typeof event.type !== "string" ||
    !object ||
    typeof object.id !== "string"
  ) {
    throw new Error("Invalid Stripe webhook payload");
  }

  return {
    id: event.id,
    type: event.type,
    data: {
      object: {
        id: object.id,
        metadata: normalizeMetadata(metadata)
      }
    }
  };
}

function normalizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, string> | undefined {
  if (!metadata) {
    return undefined;
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
