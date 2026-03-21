export type AnswerType = "single_choice" | "date" | "text" | "boolean";

export interface DiagnosisQuestionOption {
  value: string;
  label: string;
}

export interface DiagnosisQuestion {
  id: string;
  text: string;
  answer_type: AnswerType;
  options: DiagnosisQuestionOption[];
  order: number;
  help_text: string;
}

export type DeadlineBucket =
  | "first-two-weeks"
  | "within-three-months"
  | "within-ten-months"
  | "expert-consultation";

export type ResultSectionSlug = DeadlineBucket | "needs-confirmation";

export interface ProcedureDefinition {
  id: string;
  name: string;
  short_description: string;
  deadline_bucket: DeadlineBucket;
  official_link: string;
  caution_text: string;
  national_or_local_flag: string;
  requires_expert_flag: boolean;
  required_items_hint: string;
  confirmation_source_type: string;
  updated_at: string;
}

export interface ResultRuleDefinition {
  id: string;
  condition_expression: string;
  procedure_id: string;
  priority: number;
  visibility_reason: string;
  escalation_flag: string;
}

export interface DiagnosisAnswers {
  relationship_to_deceased: string;
  date_of_death: string;
  last_resident_municipality: string;
  has_other_heirs: boolean;
  has_real_estate: boolean;
  has_vehicle: boolean;
  has_debt_risk: boolean;
  was_pension_recipient: boolean;
  health_insurance_type: string;
  has_life_insurance: boolean;
  was_company_employee_or_public_servant: boolean;
  needs_household_head_change: boolean;
  needs_bank_or_card_cleanup: boolean;
  has_family_dispute_risk: boolean;
  [key: string]: boolean | string | number | null | undefined;
}

export interface MatchedRule extends ResultRuleDefinition {}

export interface DiagnosisProcedure extends ProcedureDefinition {
  display_reason: string;
  matched_rule_ids: string[];
}

export interface DiagnosisSection {
  slug: ResultSectionSlug;
  title: string;
  procedures: DiagnosisProcedure[];
}

export interface DiagnosisResult {
  procedures: DiagnosisProcedure[];
  sections: DiagnosisSection[];
  escalations: string[];
}

export interface DiagnosisContent {
  questions: DiagnosisQuestion[];
  procedures: ProcedureDefinition[];
  resultRules: ResultRuleDefinition[];
  proceduresById: Record<string, ProcedureDefinition>;
}
