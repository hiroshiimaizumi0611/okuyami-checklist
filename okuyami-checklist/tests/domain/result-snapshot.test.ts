import { describe, expect, it } from "vitest";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import {
  createResultSnapshot,
  parseResultSnapshot
} from "../../src/domain/result-snapshot";
import { basicCase } from "../fixtures/answers";

describe("result snapshot", () => {
  it("preserves full procedure payload and section payload for deterministic reuse", () => {
    const result = runDiagnosis(basicCase);
    const snapshot = createResultSnapshot(result, new Date("2026-03-20T00:00:00.000Z"));

    expect(snapshot.procedures[0]?.national_or_local_flag).toBe(
      result.procedures[0]?.national_or_local_flag
    );
    expect(Array.isArray(snapshot.sections[0]?.procedures)).toBe(true);
    expect(snapshot.sections[0]?.procedures[0]?.id).toBe(result.sections[0]?.procedures[0]?.id);

    const roundTrip = parseResultSnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(roundTrip).toEqual(snapshot);
  });
});
