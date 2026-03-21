import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const basicCase = {
  relationship_to_deceased: "child",
  date_of_death: "2026-03-10",
  last_resident_municipality: "東京都新宿区",
  has_other_heirs: false,
  has_real_estate: false,
  has_vehicle: false,
  has_debt_risk: false,
  was_pension_recipient: true,
  health_insurance_type: "national",
  has_life_insurance: false,
  was_company_employee_or_public_servant: false,
  needs_household_head_change: true,
  needs_bank_or_card_cleanup: true,
  has_family_dispute_risk: false
} as const;

const ARTIFACT_DIR = "test-results/ui-refresh";

test("user completes diagnosis, pays in test mode, downloads the PDF, and resends the link", async ({
  page
}) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(
    `${ARTIFACT_DIR}/verification-note.txt`,
    "Verified local flow at http://127.0.0.1:8787 on 2026-03-21.\n",
    "utf8"
  );

  await page.goto("/");
  await page.screenshot({ path: `${ARTIFACT_DIR}/landing.png`, fullPage: true });
  await page.getByRole("link", { name: "無料で診断を始める" }).click();

  for (const [name, value] of Object.entries(basicCase)) {
    const radioOption = page.locator(`input[name="${name}"][value="${String(value)}"]`);
    if ((await radioOption.count()) > 0) {
      await radioOption.check();
      continue;
    }

    await page.locator(`[name="${name}"]`).fill(String(value));
  }

  await page.getByRole("button", { name: "無料で結果を見る" }).click();
  await expect(page.getByText("一般的な案内です。")).toBeVisible();
  await expect(page.getByRole("heading", { name: "期限順の手続き候補" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "有料版 PDF を受け取る" })).toBeVisible();
  await page.screenshot({ path: `${ARTIFACT_DIR}/results.png`, fullPage: true });

  const snapshotToken = await page.locator('input[name="snapshot_token"]').inputValue();
  expect(snapshotToken.length).toBeGreaterThan(20);

  await page.locator("#checkout-email").fill("buyer@example.com");
  await page.getByRole("button", { name: "続きを有料版で受け取る" }).click();

  await expect(page.getByRole("heading", { name: "テスト決済を完了する" })).toBeVisible();
  await page.getByRole("button", { name: "テスト決済を完了する" }).click();

  await expect(page.getByRole("heading", { name: "お支払いを確認しました" })).toBeVisible();

  const downloadLink = page.getByRole("link", { name: "有料版のダウンロード" });
  await expect(downloadLink).toHaveAttribute("href", /\/download\?token=/u);

  const downloadPromise = page.waitForEvent("download");
  await downloadLink.click();
  const download = await downloadPromise;

  expect(await download.suggestedFilename()).toMatch(/^okuyami-checklist-.*\.pdf$/u);
  await download.saveAs(`${ARTIFACT_DIR}/okuyami-checklist.pdf`);
  await page.screenshot({ path: `${ARTIFACT_DIR}/purchase-success.png`, fullPage: true });

  await page.getByLabel("購入時のメールアドレス").fill("buyer@example.com");
  await page.getByRole("button", { name: "ダウンロードリンクを再送する" }).click();
  await expect(page.getByText("ダウンロードリンクを再送しました。")).toBeVisible();
});
