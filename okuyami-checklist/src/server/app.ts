import { Hono } from "hono";
import type { AppContextEnv } from "../lib/env";
import { renderArticlePage } from "./routes/articles";
import { submitCheckout } from "./routes/checkout";
import { renderDiagnosisForm, submitDiagnosisForm } from "./routes/diagnosis";
import { healthRoute } from "./routes/health";
import { renderLandingPage } from "./routes/landing";
import { downloadChecklistPdf } from "./routes/download";
import {
  completeTestPurchase,
  renderPurchaseSuccess
} from "./routes/purchase-success";
import { resendPaidDownloadEmail } from "./routes/resend";
import { renderResultsPage, submitResults } from "./routes/results";
import { handleStripeWebhook } from "./routes/webhooks";

export const app = new Hono<AppContextEnv>();

app.get("/", renderLandingPage);
app.get("/articles/:slug", renderArticlePage);
app.get("/diagnosis", renderDiagnosisForm);
app.post("/diagnosis", submitDiagnosisForm);
app.get("/results", renderResultsPage);
app.post("/results", submitResults);
app.post("/checkout", submitCheckout);
app.get("/purchase/success", renderPurchaseSuccess);
app.post("/purchase/success", completeTestPurchase);
app.get("/download", downloadChecklistPdf);
app.post("/resend", resendPaidDownloadEmail);
app.post("/webhooks/stripe", handleStripeWebhook);
app.route("/", healthRoute);
