import { loadDiagnosisContent } from "./load-content";
import type {
  DeadlineBucket,
  DiagnosisAnswers,
  DiagnosisProcedure,
  DiagnosisResult,
  MatchedRule,
  ResultSectionSlug
} from "./types";

const DEADLINE_ORDER: DeadlineBucket[] = [
  "first-two-weeks",
  "within-three-months",
  "within-ten-months",
  "expert-consultation"
];

const SECTION_ORDER: ResultSectionSlug[] = [
  "first-two-weeks",
  "within-three-months",
  "within-ten-months",
  "needs-confirmation",
  "expert-consultation"
];

const SECTION_TITLES: Record<ResultSectionSlug, string> = {
  "first-two-weeks": "まず2週間以内に確認したいこと",
  "within-three-months": "3か月以内に要注意のこと",
  "within-ten-months": "10か月以内に確認すること",
  "needs-confirmation": "期限の確認が必要なこと",
  "expert-consultation": "専門家相談を検討したいこと"
};

export function runDiagnosis(input: DiagnosisAnswers): DiagnosisResult {
  const { proceduresById, resultRules } = loadDiagnosisContent();
  const matchedRules = resultRules
    .filter((rule) => matches(rule.condition_expression, input))
    .sort((left, right) => right.priority - left.priority);

  const matchedRulesByProcedure = new Map<string, MatchedRule[]>();

  for (const rule of matchedRules) {
    const list = matchedRulesByProcedure.get(rule.procedure_id) ?? [];
    list.push(rule);
    matchedRulesByProcedure.set(rule.procedure_id, list);
  }

  const procedures = Array.from(matchedRulesByProcedure.entries())
    .map(([procedureId, rules]) => {
      const procedure = proceduresById[procedureId];
      const topRule = rules[0];

      return {
        ...procedure,
        display_reason: topRule.visibility_reason,
        matched_rule_ids: rules.map((rule) => rule.id),
        sort_priority: topRule.priority
      };
    })
    .sort((left, right) => {
      const deadlineOrderDiff =
        DEADLINE_ORDER.indexOf(left.deadline_bucket) -
        DEADLINE_ORDER.indexOf(right.deadline_bucket);

      if (deadlineOrderDiff !== 0) {
        return deadlineOrderDiff;
      }

      const priorityDiff = right.sort_priority - left.sort_priority;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.id.localeCompare(right.id);
    })
    .map(({ sort_priority: _sortPriority, ...procedure }) => procedure);

  return {
    procedures,
    sections: buildSections(procedures),
    escalations: collectEscalations(matchedRules, procedures)
  };
}

function buildSections(procedures: DiagnosisProcedure[]) {
  return SECTION_ORDER.map((slug) => {
    const sectionProcedures = procedures.filter((procedure) =>
      belongsToSection(procedure, slug)
    );

    return {
      slug,
      title: SECTION_TITLES[slug],
      procedures: sectionProcedures
    };
  }).filter((section) => section.procedures.length > 0);
}

function belongsToSection(
  procedure: DiagnosisProcedure,
  slug: ResultSectionSlug
): boolean {
  if (slug === "needs-confirmation") {
    return needsDeadlineConfirmation(procedure);
  }

  return procedure.deadline_bucket === slug;
}

function needsDeadlineConfirmation(procedure: DiagnosisProcedure): boolean {
  if (procedure.requires_expert_flag) {
    return false;
  }

  const detail = `${procedure.short_description} ${procedure.caution_text} ${procedure.display_reason}`;

  return (
    detail.includes("期限") ||
    detail.includes("提出先") ||
    detail.includes("自治体") ||
    procedure.national_or_local_flag !== "national-common"
  );
}

function collectEscalations(
  matchedRules: MatchedRule[],
  procedures: DiagnosisProcedure[]
): string[] {
  const escalations = new Set<string>();

  for (const rule of matchedRules) {
    const escalation = rule.escalation_flag.trim();
    if (escalation.length > 0) {
      escalations.add(escalation);
    }
  }

  for (const procedure of procedures) {
    if (procedure.requires_expert_flag) {
      escalations.add("expert-consultation");
    }
  }

  return Array.from(escalations);
}

function matches(
  conditionExpression: string,
  answers: DiagnosisAnswers
): boolean {
  const normalized = conditionExpression.trim();

  if (normalized === "always") {
    return true;
  }

  return normalized
    .split("&&")
    .map((clause) => clause.trim())
    .every((clause) => evaluateClause(clause, answers));
}

function evaluateClause(clause: string, answers: DiagnosisAnswers): boolean {
  if (clause.length === 0) {
    return true;
  }

  if (clause.startsWith("!")) {
    const key = clause.slice(1).trim();
    return !toBoolean(answers[key]);
  }

  const equalityIndex = clause.indexOf("==");
  if (equalityIndex >= 0) {
    const key = clause.slice(0, equalityIndex).trim();
    const expected = parseLiteral(clause.slice(equalityIndex + 2).trim());
    return answers[key] === expected;
  }

  return toBoolean(answers[clause]);
}

function parseLiteral(rawValue: string): boolean | string | number {
  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }

  const numeric = Number(rawValue);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return rawValue;
}

function toBoolean(value: unknown): boolean {
  return Boolean(value);
}
