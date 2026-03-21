import { describe, expect, it } from "vitest";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import * as fixtures from "../fixtures/answers";

describe("runDiagnosis", () => {
  it("returns time-ordered procedures for a basic bereavement case", () => {
    const result = runDiagnosis(fixtures.basicCase);

    expect(result.procedures.map((item) => item.id)).toEqual([
      "death-notification",
      "national-pension-loss-report",
      "health-insurance-status-update",
      "household-head-change",
      "credit-card-cancellation",
      "bank-account-inheritance-contact",
      "inheritance-tax-review"
    ]);

    expect(result.sections.map((section) => section.slug)).toEqual([
      "first-two-weeks",
      "within-three-months",
      "within-ten-months",
      "needs-confirmation"
    ]);

    expect(result.sections[0].procedures.map((item) => item.id)).toEqual([
      "death-notification",
      "national-pension-loss-report",
      "health-insurance-status-update",
      "household-head-change",
      "credit-card-cancellation"
    ]);

    const healthInsuranceProcedure = result.procedures.find(
      (item) => item.id === "health-insurance-status-update"
    );
    expect(healthInsuranceProcedure?.display_reason).toBe(
      "健康保険種別に応じて資格喪失確認が必要です。"
    );
    expect(result.sections.find((section) => section.slug === "needs-confirmation")?.title).toBe(
      "期限の確認が必要なこと"
    );
  });

  it("flags expert escalation when debt risk is present", () => {
    const result = runDiagnosis(fixtures.debtRiskCase);

    expect(result.escalations).toContain("expert-consultation");
  });

  it("uses the highest-priority rule reason when multiple rules target one procedure", () => {
    const result = runDiagnosis({
      ...fixtures.basicCase,
      has_other_heirs: true,
      has_family_dispute_risk: true
    });

    const consultationProcedure = result.procedures.find(
      (item) => item.id === "inheritance-dispute-consultation"
    );
    expect(consultationProcedure?.display_reason).toBe(
      "家族間トラブルの可能性があるため、早期相談導線を確保します。"
    );
  });
});
