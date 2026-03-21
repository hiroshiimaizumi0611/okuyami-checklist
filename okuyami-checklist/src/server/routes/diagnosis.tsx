import type { Context } from "hono";
import { loadDiagnosisContent } from "../../domain/load-content";
import {
  getExecutionCtxOrUndefined,
  trackAnalyticsInBackground
} from "../../lib/analytics";
import { DiagnosisForm } from "../../ui/components/diagnosis-form";
import { Layout } from "../../ui/layout";

export async function renderDiagnosisForm(c: Context) {
  const { questions } = loadDiagnosisContent();
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  trackAnalyticsInBackground(getExecutionCtxOrUndefined(c), c.env, "diagnosis_started", {
    questionCount: sortedQuestions.length
  });

  return c.html(
    <Layout
      title="おくやみ手続きナビ | 診断フォーム"
      description="亡くなった方との関係や資産状況など14問に回答し、一般案内として期限順の手続き候補と公式確認先を整理します。"
    >
      <DiagnosisForm questions={sortedQuestions} />
    </Layout>
  );
}

export function submitDiagnosisForm(c: Context) {
  // Backward-compatible fallback for older clients that still post to /diagnosis.
  return c.redirect("/diagnosis", 303);
}
