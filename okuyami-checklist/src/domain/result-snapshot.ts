import type { DeadlineBucket, DiagnosisResult } from "./types";

export interface ResultSnapshotProcedure {
  id: string;
  name: string;
  short_description: string;
  deadline_bucket: DeadlineBucket;
  national_or_local_flag: string;
  display_reason: string;
  official_link: string;
  caution_text: string;
  required_items_hint: string;
  confirmation_source_type: string;
  updated_at: string;
  requires_expert_flag: boolean;
  matched_rule_ids: string[];
}

export interface ResultSnapshotSection {
  slug: DeadlineBucket;
  title: string;
  procedures: ResultSnapshotProcedure[];
}

export interface ResultSnapshot {
  schema_version: 1;
  generated_at: string;
  procedures: ResultSnapshotProcedure[];
  sections: ResultSnapshotSection[];
  escalations: string[];
}

export function createResultSnapshot(
  result: DiagnosisResult,
  generatedAt: Date = new Date()
): ResultSnapshot {
  return {
    schema_version: 1,
    generated_at: generatedAt.toISOString(),
    procedures: result.procedures.map((procedure) => toSnapshotProcedure(procedure)),
    sections: result.sections.map((section) => ({
      slug: section.slug,
      title: section.title,
      procedures: section.procedures.map((procedure) => toSnapshotProcedure(procedure))
    })),
    escalations: [...result.escalations]
  };
}

export function parseResultSnapshot(value: unknown): ResultSnapshot {
  const parsed = ensureObject(value, "snapshot");
  const schemaVersion = ensureNumber(parsed.schema_version, "snapshot.schema_version");
  if (schemaVersion !== 1) {
    throw new Error("snapshot.schema_version must be 1");
  }

  return {
    schema_version: 1,
    generated_at: ensureString(parsed.generated_at, "snapshot.generated_at"),
    procedures: ensureProcedureList(parsed.procedures, "snapshot.procedures"),
    sections: ensureSectionList(parsed.sections, "snapshot.sections"),
    escalations: ensureStringList(parsed.escalations, "snapshot.escalations")
  };
}

function ensureProcedureList(value: unknown, path: string): ResultSnapshotProcedure[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  return value.map((row, index) => {
    const node = ensureObject(row, `${path}[${index}]`);
    return {
      id: ensureString(node.id, `${path}[${index}].id`),
      name: ensureString(node.name, `${path}[${index}].name`),
      short_description: ensureString(
        node.short_description,
        `${path}[${index}].short_description`
      ),
      deadline_bucket: ensureDeadlineBucket(
        node.deadline_bucket,
        `${path}[${index}].deadline_bucket`
      ),
      national_or_local_flag: ensureString(
        node.national_or_local_flag,
        `${path}[${index}].national_or_local_flag`
      ),
      display_reason: ensureString(node.display_reason, `${path}[${index}].display_reason`),
      official_link: ensureString(node.official_link, `${path}[${index}].official_link`),
      caution_text: ensureString(node.caution_text, `${path}[${index}].caution_text`),
      required_items_hint: ensureString(
        node.required_items_hint,
        `${path}[${index}].required_items_hint`
      ),
      confirmation_source_type: ensureString(
        node.confirmation_source_type,
        `${path}[${index}].confirmation_source_type`
      ),
      updated_at: ensureString(node.updated_at, `${path}[${index}].updated_at`),
      requires_expert_flag: ensureBoolean(
        node.requires_expert_flag,
        `${path}[${index}].requires_expert_flag`
      ),
      matched_rule_ids: ensureStringList(
        node.matched_rule_ids,
        `${path}[${index}].matched_rule_ids`
      )
    };
  });
}

function ensureSectionList(value: unknown, path: string): ResultSnapshotSection[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  return value.map((row, index) => {
    const node = ensureObject(row, `${path}[${index}]`);
    return {
      slug: ensureDeadlineBucket(node.slug, `${path}[${index}].slug`),
      title: ensureString(node.title, `${path}[${index}].title`),
      procedures: ensureProcedureList(node.procedures, `${path}[${index}].procedures`)
    };
  });
}

function ensureStringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }

  return value.map((entry, index) => ensureString(entry, `${path}[${index}]`));
}

function ensureObject(value: unknown, path: string): Record<string, unknown> {
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

function ensureDeadlineBucket(value: unknown, path: string): DeadlineBucket {
  const deadlineBucket = ensureString(value, path);
  if (
    deadlineBucket !== "first-two-weeks" &&
    deadlineBucket !== "within-three-months" &&
    deadlineBucket !== "within-ten-months" &&
    deadlineBucket !== "expert-consultation"
  ) {
    throw new Error(`${path} has an unsupported value`);
  }

  return deadlineBucket;
}

function toSnapshotProcedure(
  procedure: DiagnosisResult["procedures"][number]
): ResultSnapshotProcedure {
  return {
    id: procedure.id,
    name: procedure.name,
    short_description: procedure.short_description,
    deadline_bucket: procedure.deadline_bucket,
    national_or_local_flag: procedure.national_or_local_flag,
    display_reason: procedure.display_reason,
    official_link: procedure.official_link,
    caution_text: procedure.caution_text,
    required_items_hint: procedure.required_items_hint,
    confirmation_source_type: procedure.confirmation_source_type,
    updated_at: procedure.updated_at,
    requires_expert_flag: procedure.requires_expert_flag,
    matched_rule_ids: [...procedure.matched_rule_ids]
  };
}
