import type {
  AnswerType,
  DeadlineBucket,
  DiagnosisContent,
  DiagnosisQuestion,
  DiagnosisQuestionOption,
  ProcedureDefinition,
  ResultRuleDefinition
} from "./types";

import questionsData from "../../content/questions.json";
import proceduresData from "../../content/procedures.json";
import resultRulesData from "../../content/result-rules.json";

let cachedContent: DiagnosisContent | null = null;

const ANSWER_TYPES: AnswerType[] = ["single_choice", "date", "text", "boolean"];
const ANSWER_TYPES_SET = new Set<AnswerType>(ANSWER_TYPES);

const DEADLINE_BUCKETS: DeadlineBucket[] = [
  "first-two-weeks",
  "within-three-months",
  "within-ten-months",
  "expert-consultation"
];
const DEADLINE_BUCKETS_SET = new Set<DeadlineBucket>(DEADLINE_BUCKETS);

export function loadDiagnosisContent(): DiagnosisContent {
  if (cachedContent) {
    return cachedContent;
  }

  cachedContent = parseDiagnosisContent({
    questions: questionsData,
    procedures: proceduresData,
    resultRules: resultRulesData
  });

  return cachedContent;
}

interface RawDiagnosisContent {
  questions: unknown;
  procedures: unknown;
  resultRules: unknown;
}

export function parseDiagnosisContent(raw: RawDiagnosisContent): DiagnosisContent {
  const questions = ensureQuestions(raw.questions);
  const procedures = ensureProcedures(raw.procedures);
  const resultRules = ensureResultRules(raw.resultRules);

  ensureUniqueIds(questions, "questions");
  ensureUniqueIds(procedures, "procedures");
  ensureUniqueIds(resultRules, "resultRules");

  const proceduresById = Object.fromEntries(
    procedures.map((procedure) => [procedure.id, procedure])
  );

  resultRules.forEach((rule, index) => {
    if (!proceduresById[rule.procedure_id]) {
      throw new Error(
        `resultRules[${index}].procedure_id references unknown procedure id: ${rule.procedure_id}`
      );
    }
  });

  return {
    questions,
    procedures,
    resultRules,
    proceduresById
  };
}

function ensureQuestions(data: unknown): DiagnosisQuestion[] {
  if (!Array.isArray(data)) {
    throw new Error("questions.json must be an array");
  }

  return data.map((entry, index) => {
    const row = ensureObject(entry, `questions[${index}]`);

    return {
      id: ensureString(row.id, `questions[${index}].id`),
      text: ensureString(row.text, `questions[${index}].text`),
      answer_type: ensureAnswerType(
        row.answer_type,
        `questions[${index}].answer_type`
      ),
      options: ensureQuestionOptions(row.options, `questions[${index}].options`),
      order: ensureNumber(row.order, `questions[${index}].order`),
      help_text: ensureString(row.help_text, `questions[${index}].help_text`)
    };
  });
}

function ensureQuestionOptions(
  data: unknown,
  path: string
): DiagnosisQuestionOption[] {
  if (!Array.isArray(data)) {
    throw new Error(`${path} must be an array`);
  }

  return data.map((entry, index) => {
    const option = ensureObject(entry, `${path}[${index}]`);
    return {
      value: ensureString(option.value, `${path}[${index}].value`),
      label: ensureString(option.label, `${path}[${index}].label`)
    };
  });
}

function ensureProcedures(data: unknown): ProcedureDefinition[] {
  if (!Array.isArray(data)) {
    throw new Error("procedures.json must be an array");
  }

  return data.map((entry, index) => {
    const row = ensureObject(entry, `procedures[${index}]`);

    return {
      id: ensureString(row.id, `procedures[${index}].id`),
      name: ensureString(row.name, `procedures[${index}].name`),
      short_description: ensureString(
        row.short_description,
        `procedures[${index}].short_description`
      ),
      deadline_bucket: ensureDeadlineBucket(
        row.deadline_bucket,
        `procedures[${index}].deadline_bucket`
      ),
      official_link: ensureString(
        row.official_link,
        `procedures[${index}].official_link`
      ),
      caution_text: ensureString(
        row.caution_text,
        `procedures[${index}].caution_text`
      ),
      national_or_local_flag: ensureString(
        row.national_or_local_flag,
        `procedures[${index}].national_or_local_flag`
      ),
      requires_expert_flag: ensureBoolean(
        row.requires_expert_flag,
        `procedures[${index}].requires_expert_flag`
      ),
      required_items_hint: ensureString(
        row.required_items_hint,
        `procedures[${index}].required_items_hint`
      ),
      confirmation_source_type: ensureString(
        row.confirmation_source_type,
        `procedures[${index}].confirmation_source_type`
      ),
      updated_at: ensureString(row.updated_at, `procedures[${index}].updated_at`)
    };
  });
}

function ensureResultRules(data: unknown): ResultRuleDefinition[] {
  if (!Array.isArray(data)) {
    throw new Error("result-rules.json must be an array");
  }

  return data.map((entry, index) => {
    const row = ensureObject(entry, `resultRules[${index}]`);

    return {
      id: ensureString(row.id, `resultRules[${index}].id`),
      condition_expression: ensureString(
        row.condition_expression,
        `resultRules[${index}].condition_expression`
      ),
      procedure_id: ensureString(
        row.procedure_id,
        `resultRules[${index}].procedure_id`
      ),
      priority: ensureNumber(row.priority, `resultRules[${index}].priority`),
      visibility_reason: ensureString(
        row.visibility_reason,
        `resultRules[${index}].visibility_reason`
      ),
      escalation_flag: ensureString(
        row.escalation_flag,
        `resultRules[${index}].escalation_flag`
      )
    };
  });
}

function ensureObject(
  value: unknown,
  path: string
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }

  return value as Record<string, unknown>;
}

function ensureString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    throw new Error(`${path} must be a string`);
  }

  return value;
}

function ensureNumber(value: unknown, path: string): number {
  if (typeof value !== "number") {
    throw new Error(`${path} must be a number`);
  }

  return value;
}

function ensureBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${path} must be a boolean`);
  }

  return value;
}

function ensureAnswerType(value: unknown, path: string): AnswerType {
  const answerType = ensureString(value, path);
  if (!ANSWER_TYPES_SET.has(answerType as AnswerType)) {
    throw new Error(
      `${path} must be one of: ${ANSWER_TYPES.join(", ")}`
    );
  }

  return answerType as AnswerType;
}

function ensureDeadlineBucket(value: unknown, path: string): DeadlineBucket {
  const deadlineBucket = ensureString(value, path);
  if (!DEADLINE_BUCKETS_SET.has(deadlineBucket as DeadlineBucket)) {
    throw new Error(
      `${path} must be one of: ${DEADLINE_BUCKETS.join(", ")}`
    );
  }

  return deadlineBucket as DeadlineBucket;
}

function ensureUniqueIds(
  rows: Array<{ id: string }>,
  collectionName: string
): void {
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    if (seenIds.has(row.id)) {
      throw new Error(
        `${collectionName}[${index}].id duplicates existing id: ${row.id}`
      );
    }

    seenIds.add(row.id);
  });
}
