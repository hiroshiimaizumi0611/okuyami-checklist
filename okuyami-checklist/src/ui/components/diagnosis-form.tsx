import type { FC } from "hono/jsx";
import type { DiagnosisQuestion } from "../../domain/types";

export interface DiagnosisFormError {
  field: string;
  message: string;
}

interface DiagnosisFormProps {
  questions: DiagnosisQuestion[];
  submissionErrors?: DiagnosisFormError[];
}

const diagnosisFormStyles = `
  .diagnosis-page {
    padding: 36px 20px 88px;
  }

  .diagnosis-shell {
    max-width: 1080px;
    margin: 0 auto;
  }

  .diagnosis-intro {
    display: grid;
    gap: 14px;
    justify-items: center;
    text-align: center;
    margin-bottom: 28px;
  }

  .diagnosis-rule {
    color: var(--text-subtle);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.32em;
    text-transform: uppercase;
  }

  .diagnosis-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(34px, 5.2vw, 56px);
    line-height: 1.14;
    letter-spacing: -0.05em;
  }

  .diagnosis-lead {
    margin: 0;
    max-width: 42rem;
    color: var(--text-muted);
    font-size: 15px;
    line-height: 1.9;
  }

  .diagnosis-progress {
    margin: 0;
    color: var(--text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
  }

  .diagnosis-alert {
    margin: 0 0 24px;
    padding: 18px 20px;
    border: 1px solid var(--accent);
    background: rgba(241, 224, 205, 0.3);
  }

  .diagnosis-alert-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: 18px;
    line-height: 1.3;
  }

  .diagnosis-alert-copy {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .diagnosis-alert-list {
    margin: 12px 0 0;
    padding-left: 18px;
    color: var(--text-muted);
    font-size: 14px;
    line-height: 1.8;
  }

  .diagnosis-form {
    display: grid;
    gap: 18px;
  }

  .question-card {
    margin: 0;
    padding: 28px 24px;
    border: 1px solid rgba(214, 205, 194, 0.6);
    background: var(--surface);
  }

  .question-card--invalid {
    border-color: var(--accent);
  }

  .question-card legend {
    width: 100%;
    padding: 0;
  }

  .question-inner {
    display: grid;
    gap: 18px;
  }

  .question-label {
    display: grid;
    gap: 12px;
  }

  .question-index {
    font-family: var(--font-display);
    font-size: 40px;
    line-height: 0.9;
    letter-spacing: -0.08em;
    color: rgba(141, 116, 83, 0.45);
  }

  .question-text {
    font-family: var(--font-display);
    font-size: 24px;
    line-height: 1.34;
    letter-spacing: -0.04em;
  }

  .question-help {
    margin: 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.9;
  }

  .question-control {
    display: grid;
    gap: 10px;
  }

  .question-error {
    margin: 0;
    color: var(--accent-strong);
    font-size: 13px;
    line-height: 1.7;
  }

  .option-list {
    display: grid;
    gap: 8px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 60px;
    padding: 0 18px;
    border: 1px solid transparent;
    background: var(--surface-muted);
    cursor: pointer;
    transition:
      border-color 160ms ease,
      background-color 160ms ease;
  }

  .option-item:hover,
  .option-item:focus-within {
    border-color: rgba(141, 116, 83, 0.35);
    background: var(--surface);
  }

  .option-item input {
    accent-color: var(--accent);
    inline-size: 18px;
    block-size: 18px;
    flex: none;
    margin: 0;
  }

  .option-item span {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .text-input {
    width: 100%;
    min-height: 58px;
    padding: 0;
    border: 0;
    border-bottom: 2px solid rgba(214, 205, 194, 0.8);
    background: transparent;
    color: var(--text);
    font-size: 18px;
    transition: border-color 160ms ease;
  }

  .text-input:hover,
  .text-input:focus-visible {
    border-color: var(--accent);
    outline: none;
  }

  .text-input[aria-invalid="true"] {
    border-color: var(--accent);
  }

  .diagnosis-disclaimer {
    margin: 8px 0 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.9;
  }

  .diagnosis-disclaimer strong {
    color: var(--text);
    font-weight: 700;
  }

  .diagnosis-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    justify-self: start;
    min-height: 62px;
    padding: 0 28px;
    border: 0;
    background: var(--accent);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.14em;
    cursor: pointer;
    transition: background-color 160ms ease;
  }

  .diagnosis-submit:hover,
  .diagnosis-submit:focus-visible {
    background: var(--accent-strong);
  }

  @media (min-width: 900px) {
    .diagnosis-page {
      padding-left: 32px;
      padding-right: 32px;
    }

    .question-card {
      padding: 30px 34px;
    }

    .question-inner {
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 26px;
      align-items: start;
    }
  }
`;

export const DiagnosisForm: FC<DiagnosisFormProps> = ({
  questions,
  submissionErrors = []
}) => {
  const errorsByField = new Map(submissionErrors.map((error) => [error.field, error.message]));

  return (
    <section class="diagnosis-page">
      <style>{diagnosisFormStyles}</style>
      <div class="diagnosis-shell">
        <div class="diagnosis-intro">
          <p class="diagnosis-rule">Diagnosis form</p>
          <h1 class="diagnosis-title">必要な手続きを診断します</h1>
          <p class="diagnosis-lead">
            亡くなった方との関係や資産状況などを順番に確認し、一般案内として、公式確認先と専門家相談が必要になりそうな項目まで整理します。
          </p>
          <p class="diagnosis-progress">{questions.length}問の質問</p>
        </div>

        {submissionErrors.length > 0 ? (
          <section class="diagnosis-alert" role="alert" aria-live="polite">
            <p class="diagnosis-alert-title">入力内容を確認してください</p>
            <p class="diagnosis-alert-copy">
              未入力または形式が合わない項目があります。該当箇所を見直してから、もう一度結果を表示してください。
            </p>
            <ul class="diagnosis-alert-list">
              {submissionErrors.map((error) => (
                <li key={error.field}>
                  <strong>{error.field}</strong>: {error.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form class="diagnosis-form" method="post" action="/results">
          {questions.map((question, index) => {
            const errorMessage = errorsByField.get(question.id);
            const hasError = typeof errorMessage === "string";

            return (
              <fieldset
                class={hasError ? "question-card question-card--invalid" : "question-card"}
                key={question.id}
              >
                <legend>
                  <div class="question-inner">
                    <span class="question-index">{String(index + 1).padStart(2, "0")}</span>
                    <span class="question-label">
                      <span class="question-text">{question.text}</span>
                      <span class="question-help">{question.help_text}</span>
                    </span>
                  </div>
                </legend>
                <div class="question-control">{renderInput(question, hasError)}</div>
                {hasError ? <p class="question-error">{errorMessage}</p> : null}
              </fieldset>
            );
          })}

          <p class="diagnosis-disclaimer">
            <strong>一般案内です。</strong>
            この診断は法律判断や税務判断を行うものではありません。結果では公式確認先を併記し、迷う場合は専門家への相談を促します。
          </p>
          <button class="diagnosis-submit" type="submit">
            無料で結果を見る
          </button>
        </form>
      </div>
    </section>
  );
};

function renderInput(question: DiagnosisQuestion, hasError: boolean) {
  if (question.answer_type === "date") {
    return (
      <input
        class="text-input"
        id={question.id}
        name={question.id}
        type="date"
        required
        aria-invalid={hasError ? "true" : undefined}
      />
    );
  }

  if (question.answer_type === "text") {
    return (
      <input
        class="text-input"
        id={question.id}
        name={question.id}
        type="text"
        inputMode="text"
        autoComplete="off"
        required
        aria-invalid={hasError ? "true" : undefined}
      />
    );
  }

  return (
    <div class="option-list">
      {question.options.map((option) => {
        const optionId = `${question.id}-${option.value}`;
        return (
          <label class="option-item" htmlFor={optionId} key={optionId}>
            <input
              id={optionId}
              name={question.id}
              type="radio"
              value={option.value}
              required
              aria-invalid={hasError ? "true" : undefined}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
