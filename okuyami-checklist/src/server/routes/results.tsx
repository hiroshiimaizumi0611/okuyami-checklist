import type { Context } from "hono";
import { runDiagnosis } from "../../domain/diagnosis-engine";
import { loadDiagnosisContent } from "../../domain/load-content";
import { createResultSnapshot } from "../../domain/result-snapshot";
import type { DiagnosisAnswers, DiagnosisQuestion } from "../../domain/types";
import {
  getExecutionCtxOrUndefined,
  trackAnalyticsInBackground
} from "../../lib/analytics";
import { signSnapshotToken } from "../../lib/snapshot-token";
import { ResultSummary } from "../../ui/components/result-summary";
import { Layout } from "../../ui/layout";

interface ValidationError {
  field: string;
  message: string;
}

type ParsedSubmission =
  | { ok: true; answers: DiagnosisAnswers }
  | { ok: false; errors: ValidationError[] };

export async function submitResults(c: Context) {
  const formData = await c.req.formData();
  const { questions } = loadDiagnosisContent();
  const parsed = parseDiagnosisSubmission(formData, questions);

  if (!parsed.ok) {
    return c.html(
      <Layout
        title="おくやみ手続きナビ | 入力内容の確認"
        description="入力内容に不足または形式不備があります。"
      >
        <section>
          <h1>入力内容を確認してください</h1>
          <p>未入力または形式不正の項目があります。診断フォームに戻って修正してください。</p>
          <ul>
            {parsed.errors.map((error) => (
              <li key={error.field}>
                <strong>{error.field}</strong>: {error.message}
              </li>
            ))}
          </ul>
          <p>
            <a href="/diagnosis">診断フォームへ戻る</a>
          </p>
        </section>
      </Layout>,
      400
    );
  }

  const snapshotSecret = resolveSnapshotSecret(c);
  if (!snapshotSecret) {
    return c.text("SNAPSHOT_TOKEN_SECRET is not configured.", 500);
  }

  const result = runDiagnosis(parsed.answers);
  const snapshot = createResultSnapshot(result);
  const snapshotToken = await signSnapshotToken(snapshot, snapshotSecret);
  trackAnalyticsInBackground(getExecutionCtxOrUndefined(c), c.env, "diagnosis_completed", {
    resultCount: result.procedures.length,
    escalationCount: result.escalations.length
  });

  return c.html(
    <Layout
      title="おくやみ手続きナビ | 無料診断結果"
      description="回答内容に基づく手続き候補を期限順で確認できます。"
    >
      <ResultSummary snapshot={snapshot} snapshotToken={snapshotToken} />
    </Layout>
  );
}

export function renderResultsPage(c: Context) {
  if (c.req.query("canceled") !== "1") {
    return c.notFound();
  }

  return c.html(
    <Layout
      title="おくやみ手続きナビ | 決済キャンセル"
      description="Stripe の決済はキャンセルされました。"
    >
      <section>
        <h1>決済はキャンセルされました</h1>
        <p>必要であれば、診断をやり直してもう一度お申し込みください。</p>
        <p>
          <a href="/diagnosis">診断フォームに戻る</a>
        </p>
      </section>
    </Layout>
  );
}

function parseDiagnosisSubmission(
  formData: FormData,
  questions: DiagnosisQuestion[]
): ParsedSubmission {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const answers: Record<string, string | boolean> = {};
  const errors: ValidationError[] = [];

  for (const question of sortedQuestions) {
    const rawValue = formData.get(question.id);

    if (typeof rawValue !== "string") {
      errors.push({ field: question.id, message: "必須項目です。" });
      continue;
    }

    const value = rawValue.trim();

    if (question.answer_type === "text") {
      if (value.length === 0) {
        errors.push({ field: question.id, message: "文字を入力してください。" });
        continue;
      }

      answers[question.id] = value;
      continue;
    }

    if (question.answer_type === "date") {
      if (!isIsoDate(value)) {
        errors.push({
          field: question.id,
          message: "日付形式（YYYY-MM-DD）で入力してください。"
        });
        continue;
      }

      answers[question.id] = value;
      continue;
    }

    if (question.answer_type === "boolean") {
      if (value !== "true" && value !== "false") {
        errors.push({ field: question.id, message: "true/false の値が必要です。" });
        continue;
      }

      answers[question.id] = value === "true";
      continue;
    }

    const optionValues = new Set(question.options.map((option) => option.value));
    if (!optionValues.has(value)) {
      errors.push({
        field: question.id,
        message: "選択肢にない値が送信されました。"
      });
      continue;
    }

    answers[question.id] = value;
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, answers: answers as DiagnosisAnswers };
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function resolveSnapshotSecret(c: Context): string | null {
  const envSecret = (c.env as Record<string, unknown>)?.SNAPSHOT_TOKEN_SECRET;
  if (typeof envSecret === "string" && envSecret.trim().length > 0) {
    return envSecret;
  }

  if (typeof process !== "undefined" && process.env?.VITEST) {
    return "vitest-snapshot-token-secret";
  }

  return null;
}
