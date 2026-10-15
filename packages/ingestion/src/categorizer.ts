/**
 * TaxFlow UK Ingestion Engine - Automated Rule-Based Transaction Categorizer
 * Flags disallowable expenses (entertaining, fines) and capital asset purchases with high confidence.
 */

import { AccountingBucket } from './types.ts';

export interface CategorizationResult {
  bucket: AccountingBucket;
  isDisallowable: boolean;
  isCapitalAsset: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  ruleMatched?: string;
}

interface PatternRule {
  patterns: RegExp[];
  bucket: AccountingBucket;
  isDisallowable?: boolean;
  isCapitalAsset?: boolean;
  ruleName: string;
}

const OUTFLOW_RULES: PatternRule[] = [
  // 1. Client Entertaining (Disallowable for CT)
  {
    ruleName: 'CLIENT_ENTERTAINING',
    patterns: [
      /\b(costa|starbucks|caff[eè]\s*nero|pret\s*a\s*manger|nando'?s|wagamama|pizza\s*express)\b/i,
      /\b(restaurant|bistro|pub|bar|dining|cocktail|hospitality|entertaining)\b/i,
      /\b(deliveroo|uber\s*eats|just\s*eat)\b/i
    ],
    bucket: AccountingBucket.CLIENT_ENTERTAINING,
    isDisallowable: true
  },

  // 2. Fines & Penalties (Disallowable for CT)
  {
    ruleName: 'FINES_AND_PENALTIES',
    patterns: [
      /\b(parking\s*charge|parking\s*fine|pcn|penalty|penalty\s*charge|traffic\s*penalty|speeding)\b/i,
      /\b(court\s*fine|hmrc\s*penalty|late\s*filing|fine)\b/i
    ],
    bucket: AccountingBucket.FINES_PENALTIES,
    isDisallowable: true
  },

  // 3. Tangible Fixed Assets / Capital Equipment (Eligible for Capital Allowances)
  {
    ruleName: 'CAPITAL_ASSETS',
    patterns: [
      /\b(apple\s*store|apple\.com\/bill|currys|dell\s*corp|lenovo|macbook|laptop|workstation|desktop\s*pc)\b/i,
      /\b(computer\s*hardware|office\s*furniture|ergonomic\s*desk)\b/i
    ],
    bucket: AccountingBucket.TANGIBLE_FIXED_ASSETS,
    isCapitalAsset: true
  },

  // 4. Software & Cloud Subscriptions
  {
    ruleName: 'SOFTWARE_SUBSCRIPTIONS',
    patterns: [
      /\b(aws|amazon\s*web\s*services|github|gitlab|google\s*cloud|gsuite|google\s*workspace)\b/i,
      /\b(microsoft\s*365|azure|slack|zoom\.us|figma|notion|linear|adobe|vercel|digitalocean)\b/i,
      /\b(cloudflare|stripe|hubspot|canva|openai|anthropic|atlassian|jira|docker)\b/i
    ],
    bucket: AccountingBucket.SOFTWARE_SUBSCRIPTIONS
  },

  // 5. Professional & Legal Fees
  {
    ruleName: 'PROFESSIONAL_FEES',
    patterns: [
      /\b(solicitor|lawyer|legal\s*services|accountant|accountancy|audit|tax\s*advisor)\b/i,
      /\b(companies\s*house|ico\s*fee|information\s*commissioner)\b/i
    ],
    bucket: AccountingBucket.PROFESSIONAL_FEES
  },

  // 6. Marketing & Advertising
  {
    ruleName: 'MARKETING_ADVERTISING',
    patterns: [
      /\b(meta\s*ads|facebook\s*ads|google\s*ads|linkedin\s*ads|twitter\s*ads|tiktok\s*ads)\b/i,
      /\b(godaddy|namecheap|hostinger|mailchimp|convertkit|hootsuite|marketing|advertising)\b/i
    ],
    bucket: AccountingBucket.MARKETING_ADVERTISING
  },

  // 7. Bank Charges & Interest Paid
  {
    ruleName: 'BANK_CHARGES',
    patterns: [
      /\b(bank\s*charge|service\s*charge|monthly\s*account\s*fee|transfer\s*fee|overdraft\s*fee)\b/i
    ],
    bucket: AccountingBucket.BANK_CHARGES
  },

  // 8. Rent, Rates & Utilities
  {
    ruleName: 'RENT_RATES_UTILITIES',
    patterns: [
      /\b(wework|regus|workspace|office\s*rent|council\s*tax|british\s*gas|edf\s*energy|e\.on|water)\b/i
    ],
    bucket: AccountingBucket.RENT_RATES_UTILITIES
  },

  // 9. Staff Salaries & Wages
  {
    ruleName: 'STAFF_COSTS',
    patterns: [
      /\b(salary|wages|payroll|hmrc\s*paye|pension|nest\s*pensions|smart\s*pension)\b/i
    ],
    bucket: AccountingBucket.STAFF_COSTS
  },

  // 10. Director Loan / Dividends
  {
    ruleName: 'DIRECTOR_TRANSACTIONS',
    patterns: [
      /\b(director\s*loan|dla\s*draw|director\s*withdrawal|owner\s*draw)\b/i
    ],
    bucket: AccountingBucket.DIRECTOR_LOAN_ACCOUNT
  },
  {
    ruleName: 'DIVIDENDS_PAID',
    patterns: [
      /\b(interim\s*dividend|final\s*dividend|dividend\s*paid)\b/i
    ],
    bucket: AccountingBucket.DIVIDENDS_PAID
  }
];

const INFLOW_RULES: PatternRule[] = [
  // 1. Bank Interest Received
  {
    ruleName: 'INTEREST_INCOME',
    patterns: [
      /\b(gross\s*interest|bank\s*interest|interest\s*paid\s*to\s*you|credit\s*interest)\b/i
    ],
    bucket: AccountingBucket.INTEREST_INCOME
  },
  // 2. Director Funds Introduced
  {
    ruleName: 'DIRECTOR_FUNDS_INTRODUCED',
    patterns: [
      /\b(director\s*loan|director\s*funds|capital\s*introduced|shareholder\s*loan)\b/i
    ],
    bucket: AccountingBucket.DIRECTOR_LOAN_ACCOUNT
  },
  // 3. Equity Capital
  {
    ruleName: 'SHARE_CAPITAL',
    patterns: [
      /\b(share\s*capital|equity\s*injection|seed\s*capital)\b/i
    ],
    bucket: AccountingBucket.CALLED_UP_SHARE_CAPITAL
  }
];

export function categorizeTransaction(
  description: string,
  amountPence: number
): CategorizationResult {
  const isCredit = amountPence > 0;
  const rules = isCredit ? INFLOW_RULES : OUTFLOW_RULES;

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(description)) {
        return {
          bucket: rule.bucket,
          isDisallowable: rule.isDisallowable ?? false,
          isCapitalAsset: rule.isCapitalAsset ?? false,
          confidence: 'HIGH',
          ruleMatched: rule.ruleName
        };
      }
    }
  }

  // Default fallbacks
  if (isCredit) {
    // Default credit for a trading micro-entity is sales/turnover
    return {
      bucket: AccountingBucket.TURNOVER,
      isDisallowable: false,
      isCapitalAsset: false,
      confidence: 'MEDIUM',
      ruleMatched: 'DEFAULT_SALES_INFLOW'
    };
  } else {
    // Default debit without a specific pattern is general administrative expense
    return {
      bucket: AccountingBucket.ADMINISTRATIVE_EXPENSES,
      isDisallowable: false,
      isCapitalAsset: false,
      confidence: 'LOW',
      ruleMatched: 'DEFAULT_ADMIN_OUTFLOW'
    };
  }
}
