import type { Context } from "hono";
import type { AppContextEnv } from "../../lib/env";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import { createEmailService } from "../../services/email/email-service";

interface ResendRequestBody {
  purchaseId: string;
  email: string;
}

export async function resendPaidDownloadEmail(c: Context<AppContextEnv>) {
  const body = await parseResendBody(c);
  if (!body) {
    return c.text("Invalid resend request.", 400);
  }

  const purchaseRepository = createD1PurchaseRepository(c.env.DB);
  const purchase = await purchaseRepository.findById(body.purchaseId);

  if (!purchase || !purchase.email || !emailsMatch(purchase.email, body.email)) {
    return c.text("Purchase not found.", 404);
  }

  if (purchase.status !== "paid") {
    return c.text("Purchase is not paid.", 403);
  }

  const emailService = createEmailService(c.env);
  await emailService.sendPaidDownloadEmail(purchase);

  if (c.req.query("redirect") === "1") {
    return c.redirect(`/purchase/success?purchaseId=${purchase.id}&resent=1`, 303);
  }

  return c.json({ ok: true });
}

async function parseResendBody(c: Context<AppContextEnv>): Promise<ResendRequestBody | null> {
  const contentType = c.req.header("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    try {
      const formData = await c.req.formData();
      return normalizeResendBody({
        purchaseId: formData.get("purchaseId"),
        email: formData.get("email")
      });
    } catch {
      return null;
    }
  }

  try {
    return normalizeResendBody(await c.req.json());
  } catch {
    return null;
  }
}

function normalizeResendBody(parsed: unknown): ResendRequestBody | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const node = parsed as Record<string, unknown>;
  const purchaseId = typeof node.purchaseId === "string" ? node.purchaseId.trim() : "";
  const email = typeof node.email === "string" ? node.email.trim() : "";

  if (purchaseId.length === 0 || email.length === 0) {
    return null;
  }

  return { purchaseId, email };
}

function emailsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}
