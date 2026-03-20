import { PDFPage } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import type { ResultSnapshot } from "../../src/domain/result-snapshot";
import {
  buildChecklistPdf,
  buildChecklistPdfModel
} from "../../src/services/pdf/checklist-pdf";

const sampleSnapshot: ResultSnapshot = {
  schema_version: 1,
  generated_at: "2026-03-20T00:00:00.000Z",
  procedures: [
    {
      id: "proc_death_report",
      name: "死亡届の提出",
      short_description: "亡くなった事実を市区町村へ届け出る手続きです。",
      deadline_bucket: "first-two-weeks",
      national_or_local_flag: "municipal",
      display_reason: "死亡後7日以内の届出が必要です。",
      official_link: "https://example.jp/death-report",
      caution_text: "自治体で必要書類が変わる場合があります。",
      required_items_hint: "死亡診断書、届出人の本人確認書類を準備",
      confirmation_source_type: "市区町村窓口",
      updated_at: "2026-03-01",
      requires_expert_flag: false,
      matched_rule_ids: ["rule_death_report"]
    }
  ],
  sections: [
    {
      slug: "first-two-weeks",
      title: "まず2週間以内に確認したい手続き",
      procedures: [
        {
          id: "proc_death_report",
          name: "死亡届の提出",
          short_description: "亡くなった事実を市区町村へ届け出る手続きです。",
          deadline_bucket: "first-two-weeks",
          national_or_local_flag: "municipal",
          display_reason: "死亡後7日以内の届出が必要です。",
          official_link: "https://example.jp/death-report",
          caution_text: "自治体で必要書類が変わる場合があります。",
          required_items_hint: "死亡診断書、届出人の本人確認書類を準備",
          confirmation_source_type: "市区町村窓口",
          updated_at: "2026-03-01",
          requires_expert_flag: false,
          matched_rule_ids: ["rule_death_report"]
        }
      ]
    }
  ],
  escalations: ["expert-consultation"]
};

describe("checklist PDF", () => {
  it("builds the paid PDF view model with full row details", () => {
    const model = buildChecklistPdfModel(sampleSnapshot);

    expect(model).toMatchObject({
      title: "おくやみ手続きナビ 有料版チェックリスト",
      generatedAtLabel: "作成日: 2026-03-20",
      sections: [
        {
          title: "まず2週間以内に確認したい手続き",
          rows: [
            {
              procedureName: "死亡届の提出",
              reasonShown: "死亡後7日以内の届出が必要です。",
              deadlineBucketLabel: "2週間以内",
              preparationHints: "死亡診断書、届出人の本人確認書類を準備",
              confirmationSourceType: "市区町村窓口",
              officialLink: "https://example.jp/death-report",
              memoLines: 4,
              updateDateLabel: "更新日: 2026-03-01",
              disclaimerText: "自治体で必要書類が変わる場合があります。",
              requiresExpertEscalation: false
            }
          ]
        }
      ],
      escalationFlags: ["expert-consultation"]
    });
  });

  it("returns PDF bytes larger than 1000 bytes from a validated model", async () => {
    const model = buildChecklistPdfModel(sampleSnapshot);

    const pdf = await buildChecklistPdf(model);
    const header = new TextDecoder().decode(pdf.slice(0, 5));

    expect(header).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });

  it("does not replace Japanese checklist content with question marks", async () => {
    const model = buildChecklistPdfModel(sampleSnapshot);
    const drawTextSpy = vi.spyOn(PDFPage.prototype, "drawText");

    await buildChecklistPdf(model);

    const drawnStrings = drawTextSpy.mock.calls.map(([text]) => text);

    expect(drawnStrings).toContain("おくやみ手続きナビ 有料版チェックリスト");
    expect(drawnStrings).toContain("まず2週間以内に確認したい手続き");
    expect(drawnStrings).toContain("Procedure");
    expect(drawnStrings).toContain("死亡届の提出");
    expect(drawnStrings).toContain("Reason");
    expect(drawnStrings).toContain("死亡後7日以内の届出が必要です。");

    drawTextSpy.mockRestore();
  });

  it("wraps long field text into multiple drawText lines instead of a single fixed slot", async () => {
    const longReason =
      "Reason detail repeated for wrapping coverage ".repeat(10) +
      "to prove the PDF renderer flows content across multiple lines.";
    const model = buildChecklistPdfModel({
      ...sampleSnapshot,
      procedures: sampleSnapshot.procedures.map((procedure) => ({
        ...procedure,
        display_reason: longReason
      })),
      sections: sampleSnapshot.sections.map((section) => ({
        ...section,
        procedures: section.procedures.map((procedure) => ({
          ...procedure,
          display_reason: longReason
        }))
      }))
    });
    const drawTextSpy = vi.spyOn(PDFPage.prototype, "drawText");

    await buildChecklistPdf(model);

    const matchingCalls = drawTextSpy.mock.calls
      .map(([text]) => text)
      .filter((text) => text.includes("Reason detail repeated for wrapping coverage"));

    expect(matchingCalls.length).toBeGreaterThan(1);
    expect(drawTextSpy.mock.calls.map(([text]) => text)).not.toContain(longReason);

    drawTextSpy.mockRestore();
  });
});
