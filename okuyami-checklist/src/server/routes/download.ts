import type { Context } from "hono";
import { parseResultSnapshot } from "../../domain/result-snapshot";
import { readRequiredEnv, type AppContextEnv } from "../../lib/env";
import { verifyDownloadToken } from "../../lib/download-token";
import { createD1PurchaseRepository } from "../../repositories/d1-purchase-repository";
import {
  buildChecklistPdf,
  buildChecklistPdfModel
} from "../../services/pdf/checklist-pdf";

export async function downloadChecklistPdf(c: Context<AppContextEnv>) {
  const token = c.req.query("token");
  if (!token) {
    return c.text("Download token is required.", 400);
  }

  let payload;
  try {
    payload = await verifyDownloadToken(token, readRequiredEnv(c.env, "DOWNLOAD_TOKEN_SECRET"));
  } catch {
    return c.text("Invalid download token.", 400);
  }

  const purchaseRepository = createD1PurchaseRepository(c.env.DB);
  const purchase = await purchaseRepository.findById(payload.purchase_id);
  if (!purchase) {
    return c.text("Purchase not found.", 404);
  }

  if (purchase.status !== "paid") {
    return c.text("Purchase is not paid.", 403);
  }

  const snapshot = parseResultSnapshot(JSON.parse(purchase.snapshotJson) as unknown);
  const model = buildChecklistPdfModel(snapshot);
  const pdf = await buildChecklistPdf(model);
  const body = new Uint8Array(pdf.byteLength);
  body.set(pdf);

  return new Response(body, {
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="okuyami-checklist-${purchase.id}.pdf"`
    }
  });
}
