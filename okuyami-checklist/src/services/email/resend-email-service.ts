import { Resend } from "resend";
import type {
  DeliveryEmailSender,
  PaidDownloadEmailInput
} from "./email-service";

const DEFAULT_FROM = "おくやみ手続きナビ <onboarding@resend.dev>";

export function createResendEmailService(options: {
  apiKey: string;
  from?: string;
}): DeliveryEmailSender {
  const resend = new Resend(options.apiKey);
  const from = options.from ?? DEFAULT_FROM;

  return {
    async sendPaidDownloadEmail({ purchase, delivery }: PaidDownloadEmailInput): Promise<void> {
      if (!purchase.email) {
        throw new Error("Purchase email is required");
      }

      const text = [
        "お支払いを確認しました。",
        "",
        `ダウンロード: ${delivery.downloadUrl}`,
        `有効期限: ${delivery.expiresAt}`,
        `PDF: ${delivery.pdfFileName}`
      ].join("\n");

      const html = [
        "<p>お支払いを確認しました。</p>",
        `<p><a href="${escapeHtml(delivery.downloadUrl)}">有料版PDFをダウンロードする</a></p>`,
        `<p>有効期限: ${escapeHtml(delivery.expiresAt)}</p>`,
        `<p>PDF: ${escapeHtml(delivery.pdfFileName)}</p>`
      ].join("");

      const response = await resend.emails.send({
        from,
        to: purchase.email,
        subject: "おくやみ手続きナビ 有料版PDFのご案内",
        text,
        html
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    }
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}
