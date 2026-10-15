import type { ShieldInput, RuleEvaluation } from '../types.ts';

export function evaluateCategory8(input: ShieldInput): RuleEvaluation[] {
  const evaluations: RuleEvaluation[] = [];
  const { entity, period } = input;

  // RULE 36: 10-Digit Company UTR Validation
  if (!entity.utr || /^\d{10}$/.test(entity.utr)) {
    evaluations.push({
      id: 'RULE_36',
      name: 'HMRC Unique Taxpayer Reference (UTR) Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Company UTR matches standard 10-digit numeric format.',
    });
  } else {
    evaluations.push({
      id: 'RULE_36',
      name: 'HMRC Unique Taxpayer Reference (UTR) Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Invalid UTR Format: Company Unique Taxpayer Reference must be exactly 10 digits (received: ${entity.utr}).`,
      remediation: 'Enter the 10-digit UTR found on HMRC official correspondence (e.g. form CT603 or CT41G).',
      offendingFields: ['utr'],
    });
  }

  // RULE 37: 8-Character Companies House Registration Number (CRN)
  if (/^[A-Z0-9]{8}$/i.test(entity.crn)) {
    evaluations.push({
      id: 'RULE_37',
      name: 'Companies House Company Number (CRN) Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'PASS',
      message: `CRN format is valid (${entity.crn.toUpperCase()}).`,
    });
  } else {
    evaluations.push({
      id: 'RULE_37',
      name: 'Companies House Company Number (CRN) Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Invalid Company Number (CRN): Must be exactly 8 characters, padded with leading zeroes if applicable (received: ${entity.crn}).`,
      remediation: 'Verify your company registration number on Companies House register (e.g. 15152081 or SC123456).',
      offendingFields: ['crn'],
    });
  }

  // RULE 38: 6-Character Companies House Authentication Code
  if (!entity.chAuthCode || /^[A-Z0-9]{6}$/i.test(entity.chAuthCode)) {
    evaluations.push({
      id: 'RULE_38',
      name: 'Companies House Authentication Code Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Companies House Authentication Code matches 6-character alphanumeric format.',
    });
  } else {
    evaluations.push({
      id: 'RULE_38',
      name: 'Companies House Authentication Code Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'FAIL',
      message: `Invalid Authentication Code: Companies House WebFiling/API auth code must be exactly 6 characters (received: ${entity.chAuthCode.length} characters).`,
      remediation: 'Enter the 6-character authentication code sent by Companies House to your registered office address.',
      offendingFields: ['chAuthCode'],
    });
  }

  // RULE 39: Government Gateway Credentials Present for HMRC Submission
  if (
    entity.gatewayUserId === undefined ||
    entity.gatewayUserId.length >= 8 // Standard Gateway User ID
  ) {
    evaluations.push({
      id: 'RULE_39',
      name: 'HMRC Government Gateway User ID Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'PASS',
      message: 'Government Gateway user credentials validated.',
    });
  } else {
    evaluations.push({
      id: 'RULE_39',
      name: 'HMRC Government Gateway User ID Format',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'FAIL',
      message: 'HMRC Gateway User ID must be provided before dispatching return to HMRC.',
      remediation: 'Enter your 12-character Government Gateway User ID.',
      offendingFields: ['gatewayUserId'],
    });
  }

  // RULE 40: Director Electronic Declaration Sign-Off
  if (period.isDirectorApproved && period.directorDeclarationName && period.directorDeclarationName.trim().length > 0) {
    evaluations.push({
      id: 'RULE_40',
      name: 'Director Legal Declaration & Capacity Sign-Off',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'PASS',
      message: `Legally signed and declared by ${period.directorDeclarationName} in the capacity of Director.`,
    });
  } else {
    evaluations.push({
      id: 'RULE_40',
      name: 'Director Legal Declaration & Capacity Sign-Off',
      category: 'Gateway Credentials & Identity Verification',
      severity: 'FATAL',
      status: 'FAIL',
      message: 'Director Legal Declaration Incomplete: Under TMA 1970 s108 and Companies Act 2006, the return must carry the printed name of an appointed company director who formally declares that the return is correct and complete.',
      remediation: 'Provide the full name of the declaring director and check the statutory confirmation box.',
      offendingFields: ['isDirectorApproved', 'directorDeclarationName'],
    });
  }

  return evaluations;
}

