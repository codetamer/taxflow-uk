export const MOCK_REVIEW_FILING = {
  id: 'fil_f114c04facec439e',
  companyId: 'co_ad35ee5268244568',
  periodStart: '2025-10-01',
  periodEnd: '2026-09-30',
  status: 'SUBMITTED',
  directorName: 'Muhammad Saif Raza',
  directorApprovalDate: '2026-10-15',
  directorLegalDeclaration: true,
  isPaid: true,
  paymentReference: 'CT-2026-15152081',
  paidAmountPence: 606100,
  trialBalanceJson: JSON.stringify({
    turnoverPence: 10000000,
    costOfSalesPence: 2000000,
    otherChargesPence: 4810000
  }),
  taxAdjustmentsJson: JSON.stringify({
    disallowablePence: 100000,
    capitalAllowancesPence: 1500000
  }),
  calculationResultJson: JSON.stringify({
    turnoverPence: 10000000,
    taxableProfitPence: 3190000,
    taxPayablePence: 606100,
    effectiveRate: 0.19
  }),
  shieldResultJson: JSON.stringify({
    overallStatus: 'PASS',
    passedChecks: 40,
    totalChecks: 40,
    criticalErrors: 0
  }),
  irmarkBase64: 'E8g0182Nsd9120=',
  irmarkBase32: 'G7YJ2Q4K9M0Z',
  createdAt: '2026-10-15T10:47:21.543Z',
  updatedAt: '2026-10-15T10:47:21.543Z',
  company: {
    id: 'co_ad35ee5268244568',
    crn: '15152081',
    name: 'DROPLOGICX LTD',
    utr: '1234567890',
    registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
    companyType: 'ltd',
    isCloseCompany: true,
    createdAt: '2026-10-15T10:45:19.222Z',
    updatedAt: '2026-10-15T13:14:07.822Z'
  }
};

