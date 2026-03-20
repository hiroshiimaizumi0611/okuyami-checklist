import { describe, expect, it } from "vitest";
import { parseDiagnosisContent } from "../../src/domain/load-content";

function makeValidRawContent() {
  return {
    questions: [
      {
        id: "q1",
        text: "質問",
        answer_type: "boolean",
        options: [],
        order: 1,
        help_text: "help"
      }
    ],
    procedures: [
      {
        id: "p1",
        name: "手続き",
        short_description: "desc",
        deadline_bucket: "first-two-weeks",
        official_link: "https://example.com",
        caution_text: "caution",
        national_or_local_flag: "national-common",
        requires_expert_flag: false,
        required_items_hint: "items",
        confirmation_source_type: "official-page",
        updated_at: "2026-03-20"
      }
    ],
    resultRules: [
      {
        id: "r1",
        condition_expression: "always",
        procedure_id: "p1",
        priority: 10,
        visibility_reason: "reason",
        escalation_flag: ""
      }
    ]
  };
}

describe("parseDiagnosisContent", () => {
  it("fails fast for invalid question answer_type", () => {
    const raw = makeValidRawContent();
    raw.questions[0].answer_type = "invalid-answer-type";

    expect(() => parseDiagnosisContent(raw)).toThrow(
      /questions\[0\]\.answer_type/
    );
  });

  it("fails fast for invalid procedure deadline_bucket", () => {
    const raw = makeValidRawContent();
    raw.procedures[0].deadline_bucket = "someday";

    expect(() => parseDiagnosisContent(raw)).toThrow(
      /procedures\[0\]\.deadline_bucket/
    );
  });

  it("fails when a result rule references an unknown procedure", () => {
    const raw = makeValidRawContent();
    raw.resultRules[0].procedure_id = "missing-procedure";

    expect(() => parseDiagnosisContent(raw)).toThrow(
      /resultRules\[0\]\.procedure_id/
    );
  });
});
