import type { ResultSnapshot } from "../../domain/result-snapshot";

export interface ChecklistPdfRow {
  procedureName: string;
  reasonShown: string;
  deadlineBucketLabel: string;
  preparationHints: string;
  confirmationSourceType: string;
  officialLink: string;
  memoLines: number;
  updateDateLabel: string;
  disclaimerText: string;
  requiresExpertEscalation: boolean;
}

export interface ChecklistPdfSection {
  title: string;
  rows: ChecklistPdfRow[];
}

export interface ChecklistPdfModel {
  title: string;
  generatedAtLabel: string;
  sections: ChecklistPdfSection[];
  escalationFlags: string[];
}

const PDF_TITLE = "おくやみ手続きナビ 有料版チェックリスト";
const MEMO_LINE_COUNT = 4;

export function buildChecklistPdfModel(snapshot: ResultSnapshot): ChecklistPdfModel {
  return {
    title: PDF_TITLE,
    generatedAtLabel: `作成日: ${formatDateLabel(snapshot.generated_at)}`,
    sections: snapshot.sections.map((section) => ({
      title: section.title,
      rows: section.procedures.map((procedure) => ({
        procedureName: procedure.name,
        reasonShown: procedure.display_reason,
        deadlineBucketLabel: deadlineBucketToLabel(procedure.deadline_bucket),
        preparationHints: procedure.required_items_hint,
        confirmationSourceType: procedure.confirmation_source_type,
        officialLink: procedure.official_link,
        memoLines: MEMO_LINE_COUNT,
        updateDateLabel: `更新日: ${formatDateLabel(procedure.updated_at)}`,
        disclaimerText: procedure.caution_text,
        requiresExpertEscalation: procedure.requires_expert_flag
      }))
    })),
    escalationFlags: [...snapshot.escalations]
  };
}

function deadlineBucketToLabel(value: ResultSnapshot["procedures"][number]["deadline_bucket"]): string {
  switch (value) {
    case "first-two-weeks":
      return "2週間以内";
    case "within-three-months":
      return "3か月以内";
    case "within-ten-months":
      return "10か月以内";
    case "expert-consultation":
      return "専門家へ早めに相談";
    default:
      return "確認が必要";
  }
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}
