import { describe, expect, it } from "vitest";
import { runDiagnosis } from "../../src/domain/diagnosis-engine";
import { createResultSnapshot } from "../../src/domain/result-snapshot";
import {
  signSnapshotToken,
  verifySnapshotToken
} from "../../src/lib/snapshot-token";
import { basicCase } from "../fixtures/answers";

const SECRET = "unit-test-snapshot-secret";

describe("snapshot token", () => {
  it("roundtrips a snapshot through sign and verify", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const token = await signSnapshotToken(snapshot, SECRET);

    const verified = await verifySnapshotToken(token, SECRET);
    expect(verified).toEqual(snapshot);
  });

  it("rejects tampered snapshot payload", async () => {
    const snapshot = createResultSnapshot(
      runDiagnosis(basicCase),
      new Date("2026-03-20T00:00:00.000Z")
    );
    const token = await signSnapshotToken(snapshot, SECRET);
    const [version, payload, signature] = token.split(".");
    const tamperedPayload = payload.endsWith("a")
      ? `${payload.slice(0, -1)}b`
      : `${payload.slice(0, -1)}a`;
    const tampered = `${version}.${tamperedPayload}.${signature}`;

    await expect(verifySnapshotToken(tampered, SECRET)).rejects.toThrow(
      "Invalid snapshot token signature"
    );
  });
});
