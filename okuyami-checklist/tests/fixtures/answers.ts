export const basicCase = {
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

export const debtRiskCase = {
  ...basicCase,
  has_debt_risk: true
} as const;
