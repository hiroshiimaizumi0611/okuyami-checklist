import type { FC } from "hono/jsx";
import type { DiagnosisQuestion } from "../../domain/types";

interface DiagnosisFormProps {
  questions: DiagnosisQuestion[];
}

const diagnosisFormStyles = `
  .diagnosis-panel {
    background: var(--paper-soft);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 20px;
  }

  .diagnosis-eyebrow {
    margin: 0;
    font-size: 12px;
    color: var(--ink-soft);
    letter-spacing: 0.08em;
  }

  .diagnosis-title {
    margin: 10px 0 12px;
    font-size: 30px;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .diagnosis-lead {
    margin: 0 0 12px;
  }

  .progress-box {
    margin: 14px 0 18px;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }

  .progress-label {
    margin: 0 0 8px;
    font-size: 14px;
    color: var(--ink-soft);
  }

  .progress-meter {
    display: block;
    width: 100%;
    height: 10px;
  }

  .diagnosis-form {
    display: grid;
    gap: 12px;
  }

  .question-card {
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px;
    background: #fffdfa;
  }

  .question-card legend {
    width: 100%;
    margin: 0;
    padding: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
  }

  .question-index {
    display: inline-block;
    margin-right: 8px;
    font-size: 12px;
    color: var(--ink-soft);
    font-weight: 500;
  }

  .question-help {
    margin: 0 0 10px;
    color: var(--ink-soft);
    font-size: 13px;
  }

  .option-list {
    display: grid;
    gap: 8px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper-soft);
  }

  .text-input {
    width: 100%;
    min-height: 40px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 16px;
    font: inherit;
    background: #fff;
    color: inherit;
  }

  .text-input:focus-visible {
    outline: 2px solid var(--signal);
    outline-offset: 1px;
  }

  .diagnosis-disclaimer {
    margin: 4px 0 0;
    padding: 12px 14px;
    border-left: 4px solid var(--line);
    background: var(--paper);
    font-size: 14px;
    color: var(--ink-soft);
  }

  .diagnosis-submit {
    display: inline-block;
    margin-top: 6px;
    padding: 11px 18px;
    border-radius: 999px;
    background: var(--signal);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    border: none;
    cursor: pointer;
    font-size: 15px;
    line-height: 1.2;
  }

  .diagnosis-submit:hover,
  .diagnosis-submit:focus-visible {
    background: var(--signal-strong);
  }

  @media (min-width: 768px) {
    .diagnosis-panel {
      padding: 28px;
      border-radius: 16px;
    }

    .diagnosis-title {
      font-size: 38px;
    }

    .diagnosis-form {
      gap: 14px;
    }
  }
`;

export const DiagnosisForm: FC<DiagnosisFormProps> = ({ questions }) => {
  return (
    <section class="diagnosis-panel">
      <style>{diagnosisFormStyles}</style>
      <p class="diagnosis-eyebrow">無料3分診断</p>
      <h1 class="diagnosis-title">状況チェック</h1>
      <p class="diagnosis-lead">
        {questions.length}問の短い質問に答えると、優先して確認したい手続き候補を整理できます。
      </p>

      <div class="progress-box">
        <p class="progress-label">
          進捗表示: 全{questions.length}問（上から順に回答してください）
        </p>
        <progress class="progress-meter" max={questions.length} value={0} />
      </div>

      <form class="diagnosis-form" method="post" action="/results">
        {questions.map((question, index) => (
          <fieldset class="question-card" key={question.id}>
            <legend>
              <span class="question-index">
                Q{index + 1}/{questions.length}
              </span>
              {question.text}
            </legend>
            <p class="question-help">{question.help_text}</p>
            {renderInput(question)}
          </fieldset>
        ))}

        <p class="diagnosis-disclaimer">
          診断結果は一般案内です。表示後は公式確認先を必ず確認し、必要に応じて専門家へ相談してください。
        </p>
        <button class="diagnosis-submit" type="submit">
          無料で結果を見る
        </button>
      </form>
    </section>
  );
};

function renderInput(question: DiagnosisQuestion) {
  if (question.answer_type === "date") {
    return <input class="text-input" id={question.id} name={question.id} type="date" required />;
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
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
