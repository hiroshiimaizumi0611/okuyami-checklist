export interface WorkerEnv {
  DB: D1Database;
  APP_URL: string;
  SNAPSHOT_TOKEN_SECRET: string;
  DOWNLOAD_TOKEN_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  PAYMENT_MODE?: "live" | "test";
  PURCHASE_DELIVERY_EMAIL_SENDER?: (
    purchase: import("../repositories/purchase-repository").PurchaseRecord,
    delivery: import("../services/email/email-service").PaidDownloadDelivery
  ) => Promise<void>;
  ANALYTICS_EVENT_REPOSITORY?: import("../repositories/event-repository").EventRepository;
}

export interface AppContextEnv {
  Bindings: WorkerEnv;
}

export type RequiredStringEnvKey =
  | "APP_URL"
  | "SNAPSHOT_TOKEN_SECRET"
  | "DOWNLOAD_TOKEN_SECRET"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "RESEND_API_KEY";

export function readRequiredEnv(env: WorkerEnv, key: RequiredStringEnvKey): string {
  const value = env[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }
  return value;
}
