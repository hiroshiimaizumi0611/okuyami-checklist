import type { WorkerEnv } from "../../lib/env";
import {
  createDownloadTokenPayload,
  signDownloadToken
} from "../../lib/download-token";
import type { PurchaseRecord } from "../../repositories/purchase-repository";
import { readRequiredEnv } from "../../lib/env";
import { createResendEmailService } from "./resend-email-service";

const DOWNLOAD_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export interface PaidDownloadDelivery {
  downloadUrl: string;
  expiresAt: string;
  pdfFileName: string;
}

export interface PaidDownloadEmailInput {
  purchase: PurchaseRecord;
  delivery: PaidDownloadDelivery;
}

export interface DeliveryEmailSender {
  sendPaidDownloadEmail(input: PaidDownloadEmailInput): Promise<void>;
}

export interface EmailService {
  sendPaidDownloadEmail(purchase: PurchaseRecord): Promise<PaidDownloadDelivery>;
}

export function createEmailService(env: WorkerEnv): EmailService {
  const sender: DeliveryEmailSender = env.PURCHASE_DELIVERY_EMAIL_SENDER
    ? createHookBackedSender(env.PURCHASE_DELIVERY_EMAIL_SENDER)
    : env.PAYMENT_MODE === "test"
      ? createTestEmailService()
    : createResendEmailService({
        apiKey: readRequiredEnv(env, "RESEND_API_KEY")
      });

  return {
    async sendPaidDownloadEmail(purchase: PurchaseRecord): Promise<PaidDownloadDelivery> {
      if (!purchase.email) {
        throw new Error("Purchase email is required");
      }

      const delivery = await createPaidDownloadDelivery(env, purchase.id);
      await sender.sendPaidDownloadEmail({ purchase, delivery });
      return delivery;
    }
  };
}

async function createPaidDownloadDelivery(
  env: WorkerEnv,
  purchaseId: string
): Promise<PaidDownloadDelivery> {
  const appUrl = readRequiredEnv(env, "APP_URL");
  const tokenSecret = readRequiredEnv(env, "DOWNLOAD_TOKEN_SECRET");
  const expiresAt = new Date(Date.now() + DOWNLOAD_TOKEN_TTL_MS);
  const token = await signDownloadToken(
    createDownloadTokenPayload(purchaseId, expiresAt),
    tokenSecret
  );
  const downloadUrl = new URL("/download", appUrl);
  downloadUrl.searchParams.set("token", token);

  return {
    downloadUrl: downloadUrl.toString(),
    expiresAt: expiresAt.toISOString(),
    pdfFileName: `okuyami-checklist-${purchaseId}.pdf`
  };
}

function createHookBackedSender(
  sender: NonNullable<WorkerEnv["PURCHASE_DELIVERY_EMAIL_SENDER"]>
): DeliveryEmailSender {
  return {
    async sendPaidDownloadEmail({ purchase, delivery }: PaidDownloadEmailInput): Promise<void> {
      await sender(purchase, delivery);
    }
  };
}

function createTestEmailService(): DeliveryEmailSender {
  return {
    async sendPaidDownloadEmail(_input: PaidDownloadEmailInput): Promise<void> {
      return undefined;
    }
  };
}
