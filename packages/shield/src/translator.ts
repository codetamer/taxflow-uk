export interface TranslatedError {
  gateway: 'HMRC' | 'COMPANIES_HOUSE';
  rawCode: string;
  userTitle: string;
  plainEnglishExplanation: string;
  actionableRemediation: string[];
}

const ERROR_CATALOGUE: Record<string, Omit<TranslatedError, 'rawCode'>> = {
  'HMRC_1046': {
    gateway: 'HMRC',
    userTitle: 'Government Gateway Login or Tax Reference Invalid',
    plainEnglishExplanation:
      'HMRC rejected the login credentials. Either the Government Gateway User ID, password, or 10-digit Company UTR does not match HMRC’s records.',
    actionableRemediation: [
      'Log in directly to your HMRC Business Tax Account to verify your User ID and password.',
      'Check that Corporation Tax online services are enrolled and activated on your account.',
      'Confirm the 10-digit Company UTR matches your official HMRC Corporation Tax notices (e.g. form CT603).',
    ],
  },
  'HMRC_3001': {
    gateway: 'HMRC',
    userTitle: 'HMRC Electronic Schema Validation Mismatch',
    plainEnglishExplanation:
      'The electronic return payload contains an unexpected character, invalid date range, or missing mandatory taxonomy tag required by HMRC.',
    actionableRemediation: [
      'Review any newly edited company information or director names for unsupported special characters.',
      'Re-run the 40-Point Pre-Flight Shield to detect any field formatting anomalies.',
    ],
  },
  'HMRC_4065': {
    gateway: 'HMRC',
    userTitle: 'Accounting Period Start Date Mismatch',
    plainEnglishExplanation:
      'HMRC expects a Corporation Tax accounting period that starts on a different date than entered.',
    actionableRemediation: [
      'Consult your Notice to Deliver a Company Tax Return (form CT603) issued by HMRC for the statutory period dates.',
      'If your company changed its Accounting Reference Date (ARD) at Companies House, ensure HMRC has been formally notified.',
    ],
  },
  'COMPANIES_HOUSE_9999': {
    gateway: 'COMPANIES_HOUSE',
    userTitle: 'Companies House Authentication Code Rejected',
    plainEnglishExplanation:
      'Companies House rejected the 6-character authentication code entered for this company number.',
    actionableRemediation: [
      'Check the official letter sent by Companies House to your company’s registered office address containing your 6-character code.',
      'Log in to Companies House WebFiling to confirm the current authentication code is active.',
    ],
  },
  'CH_9999': {
    gateway: 'COMPANIES_HOUSE',
    userTitle: 'Companies House Authentication Code Rejected',
    plainEnglishExplanation:
      'Companies House rejected the 6-character authentication code entered for this company number.',
    actionableRemediation: [
      'Check the official letter sent by Companies House to your company’s registered office address containing your 6-character code.',
      'Log in to Companies House WebFiling to confirm the current authentication code is active.',
    ],
  },
  'HMRC_9999': {
    gateway: 'HMRC',
    userTitle: 'HMRC Gateway Temporary Technical Interruption',
    plainEnglishExplanation:
      'HMRC’s Transaction Engine experienced an internal processing timeout or temporary maintenance window.',
    actionableRemediation: [
      'Do not re-submit immediately to avoid duplicate filing requests.',
      'Our submission queue worker will automatically verify filing status with HMRC in 15 minutes.',
    ],
  },
};

/**
 * Translates raw XML gateway rejection error codes into plain-English instructions.
 */
export function translateGatewayError(gateway: 'HMRC' | 'COMPANIES_HOUSE', rawCode: string): TranslatedError {
  const key = `${gateway}_${rawCode}`;
  const found = ERROR_CATALOGUE[key];

  if (found) {
    return {
      rawCode,
      ...found,
    };
  }

  // Fallback for uncatalogued error codes
  return {
    gateway,
    rawCode,
    userTitle: `Gateway Rejection (${gateway} Error ${rawCode})`,
    plainEnglishExplanation: `The government gateway returned error code ${rawCode}. Review the details on your official government tax account.`,
    actionableRemediation: [
      'Verify your company and period details match official government notices.',
      'Contact TaxFlow UK specialist support with this error code for guidance.',
    ],
  };
}
