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
  .diagnosis-panel {
    display: grid;
    gap: 20px;
    padding: 20px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .diagnosis-eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-subtle);
    letter-spacing: 0.16em;
  }

  .diagnosis-title {
    margin: 12px 0 0;
    max-width: 12em;
    font-size: 32px;
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .diagnosis-lead {
    margin: 14px 0 0;
    max-width: 42rem;
    color: var(--text-muted);
  }

  .diagnosis-alert {
    padding: 16px 18px;
    border: 1px solid var(--line-strong);
    background: var(--surface-muted);
  }

  .diagnosis-alert-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
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
  }

  .diagnosis-progress {
    margin: 0;
    padding-top: 2px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .diagnosis-form {
    display: grid;
    gap: 14px;
  }

  .question-card {
    margin: 0;
    padding: 16px;
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .question-card--invalid {
    border-color: var(--line-strong);
  }

  .question-card legend {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .question-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .question-index {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-subtle);
    letter-spacing: 0.14em;
  }

  .question-text {
    font-size: 18px;
    font-weight: 500;
    line-height: 1.45;
  }

  .question-help {
    margin: 10px 0 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.7;
  }

  .question-error {
    margin: 10px 0 0;
    color: var(--text);
    font-size: 13px;
    line-height: 1.6;
  }

  .option-list {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  .option-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--line);
    background: var(--surface-muted);
    cursor: pointer;
    transition:
      border-color 140ms ease,
      background-color 140ms ease;
  }

  .option-item:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .option-item:focus-within {
    border-color: var(--accent);
    background: var(--surface);
  }

  .option-item input {
    margin: 2px 0 0;
    accent-color: var(--accent);
    inline-size: 16px;
    block-size: 16px;
    flex: none;
  }

  .option-item input[aria-invalid="true"] + span,
  .option-item--invalid span {
    color: var(--text);
  }

  .text-input {
    width: 100%;
    min-height: 48px;
    margin-top: 14px;
    padding: 11px 14px;
    border: 1px solid var(--line);
    background: var(--surface-muted);
    color: var(--text);
    font-size: 16px;
  }

  .text-input:hover {
    border-color: var(--accent);
  }

  .text-input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-color: var(--accent);
    background: var(--surface);
  }

  .text-input[aria-invalid="true"] {
    border-color: var(--line-strong);
  }

  .text-input:disabled,
  .option-item input:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .diagnosis-disclaimer {
    margin: 2px 0 0;
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.8;
  }

  .diagnosis-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 18px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #ffffff;
    text-decoration: none;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }

  .diagnosis-submit:hover,
  .diagnosis-submit:focus-visible {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }

  @media (min-width: 768px) {
    .diagnosis-panel {
      gap: 24px;
      padding: 32px;
    }

    .diagnosis-title {
      font-size: 42px;
    }

    .question-card {
      padding: 18px 20px;
    }
  }
`;

export const DiagnosisForm: FC<DiagnosisFormProps> = ({
  questions,
  submissionErrors = []
}) => {
  const errorsByField = new Map(submissionErrors.map((error) => [error.field, error.message]));

  return (
    <section class="diagnosis-panel">
      <style>{diagnosisFormStyles}</style>
      <div>
        <p class="diagnosis-eyebrow">FREE DIAGNOSIS</p>
        <h1 class="diagnosis-title">状況に沿って、今確認したい手続きを整理する</h1>
        <p class="diagnosis-lead">
          {questions.length}問の短い質問に答えると、一般案内として期限順の手続き候補と公式確認先を整理できます。
        </p>
      </div>

      {submissionErrors.length > 0 ? (
        <section class="diagnosis-alert" role="alert" aria-live="polite">
          <p class="diagnosis-alert-title">入力内容を確認してください</p>
          <p class="diagnosis-alert-copy">
            未入力または形式が合わない項目があります。下の質問を見直してから、もう一度結果を表示してください。
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

      <p class="diagnosis-progress">{questions.length}問中、上から順に確認してください。</p>

      <form class="diagnosis-form" method="post" action="/results">
        {questions.map((question, index) => {
          const errorMessage = errorsByField.get(question.id);
          const hasError = typeof errorMessage === "string";

          return (
            <fieldset
              class={`question-card${hasError ? " question-card--invalid" : ""}`}
              key={question.id}
            >
              <legend>
                <span class="question-label">
                  <span class="question-index">
                    Q{index + 1} / {questions.length}
                  </span>
                  <span class="question-text">{question.text}</span>
                </span>
              </legend>
              <p class="question-help">{question.help_text}</p>
              {renderInput(question, hasError)}
              {hasError ? <p class="question-error">{errorMessage}</p> : null}
            </fieldset>
          );
        })}

        <p class="diagnosis-disclaimer">
          診断結果は一般案内です。表示後は公式確認先を確認し、判断に迷う場合は専門家へ相談してください。
        </p>
        <button class="diagnosis-submit" type="submit">
          無料で結果を見る
        </button>
      </form>
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
          <label
            class={`option-item${hasError ? " option-item--invalid" : ""}`}
            htmlFor={optionId}
            key={optionId}
          >
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
