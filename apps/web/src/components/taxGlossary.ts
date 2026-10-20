export interface GlossaryTerm {
  id: string;
  term: string;
  category: 'Accounts' | 'Corporation Tax' | 'Director Compliance' | 'Technical';
  shortSummary: string;
  plainEnglish: string;
  whyItMatters: string;
  example?: string;
  statutoryRef?: string;
}

export const TAX_GLOSSARY: GlossaryTerm[] = [
  {
    id: 'frs-105',
    term: 'FRS 105 (Micro-Entities Standard)',
    category: 'Accounts',
    shortSummary: 'The official streamlined accounting standard for eligible UK small companies.',
    plainEnglish:
      'FRS 105 is the official accounting standard created by the UK Financial Reporting Council specifically for micro-entities. It enables eligible businesses to submit clear, concise accounts consisting of a Balance Sheet and Profit & Loss statement, without the extensive fair-value disclosures required for larger corporations.',
    whyItMatters:
      'Using FRS 105 keeps you fully compliant with Companies House while keeping reporting focused, efficient, and cost-effective.',
    example: 'A consultant or e-commerce business with turnover under £1,000,000 qualifies to use FRS 105.',
    statutoryRef: 'Financial Reporting Standard 105 / The Small Companies Regulations 2008'
  },
  {
    id: 'ct600',
    term: 'HMRC CT600 Form',
    category: 'Corporation Tax',
    shortSummary: 'The official company tax return filed annually by limited companies with HMRC.',
    plainEnglish:
      'The CT600 is the official company tax return. It reconciles your company’s trading profit, incorporates allowable deductions and capital allowances, and determines the precise Corporation Tax liability due to HMRC.',
    whyItMatters:
      'The return must be filed within 12 months after your accounting period ends, while the actual tax payment is due on a separate official timetable (9 months and 1 day).',
    statutoryRef: 'Corporation Tax Act 2010'
  },
  {
    id: 's455-loan',
    term: 'Section 455 Director’s Loan Tax',
    category: 'Director Compliance',
    shortSummary: 'The tax rules governing temporary funds borrowed by company directors.',
    plainEnglish:
      'In a limited company, corporate funds and personal finances remain legally distinct. When a director withdraws funds outside standard salary or declared dividends, UK tax law classifies this as a Director’s Loan. To prevent tax avoidance, HMRC provides a 9-month and 1-day grace period following the financial year-end to settle the balance. If repaid within this window, £0.00 s455 tax is due. If any balance remains outstanding past the official payment deadline, HMRC charges a temporary s455 tax (33.75% for loans taken before 6 April 2026, and 35.75% for loans made on or after), which is fully refundable once the loan is repaid.',
    whyItMatters:
      'Once the advance is repaid back to the company, HMRC refunds 100% of this tax under Section 458 of the Corporation Tax Act 2010. TaxFlow tracks repayment dates automatically so your company never overpays.',
    example: 'A director advances £10,000 for short-term personal needs. If repaid within 9 months of year-end, £0.00 s455 tax is due. If unpaid, the temporary tax is refunded once the advance is settled.',
    statutoryRef: 'Corporation Tax Act 2010 s455 & s458'
  },
  {
    id: 'balance-sheet-symmetry',
    term: 'Balance Sheet Symmetry (Net Assets = Equity)',
    category: 'Accounts',
    shortSummary: 'The fundamental accounting standard ensuring Net Assets precisely equal Shareholders’ Equity.',
    plainEnglish:
      'Balance sheet symmetry is the fundamental identity of UK corporate accounting: Total Net Assets (everything the company owns minus what it owes) must equal Total Shareholders’ Funds (the original share capital plus accumulated retained profits) to the exact single penny. TaxFlow guarantees this mathematical equilibrium automatically so your annual filing passes Companies House validation without rejection.',
    whyItMatters:
      'Companies House automated gateway systems validate this identity down to 1p. Ensuring exact zero-penny discrepancy guarantees your return is accepted without gateway rejection.',
    example: 'Fixed Assets (£15,000) + Cash (£31,139) - Creditors (£25,000) = £31,139 Net Assets. This precisely matches £100 Shares + £31,039 Retained Profit.',
    statutoryRef: 'Companies Act 2006 s396 & FRS 105 Section 4'
  },
  {
    id: 'disallowable-expenses',
    term: 'Disallowable Expenses (Add-Backs)',
    category: 'Corporation Tax',
    shortSummary: 'Commercial expenditures that UK tax law excludes from corporation tax deductions.',
    plainEnglish:
      'While all genuine commercial costs can be recorded in your internal bookkeeping, UK tax legislation designates certain categories (such as client hospitality and government fines) as non-deductible for Corporation Tax. TaxFlow automatically adds back these items to your net accounting profit to ensure your Corporation Tax calculation is 100% compliant with HMRC rules.',
    whyItMatters:
      'Accurately distinguishing allowable operating costs from non-deductible expenses ensures your company claims every legitimate tax relief while remaining fully compliant with HMRC standards.',
    example: 'A business records £30,000 accounting profit and spent £1,000 hosting prospective clients. TaxFlow automatically adds back the £1,000 so tax is calculated on £31,000.',
    statutoryRef: 'Corporation Tax Act 2009 s1298 (Client Entertaining)'
  },
  {
    id: 'capital-allowances-aia',
    term: 'Capital Allowances & AIA (Annual Investment Allowance)',
    category: 'Corporation Tax',
    shortSummary: 'Valuable tax relief providing immediate 100% deduction on qualifying business equipment.',
    plainEnglish:
      'Capital allowances enable businesses to write off the full cost of qualifying capital equipment (such as laptops, servers, tools, and office hardware) against taxable profits. Under the Annual Investment Allowance (AIA), your company can deduct up to 100% of eligible equipment expenditure in the year of purchase, significantly reducing your immediate Corporation Tax bill.',
    whyItMatters:
      'Maximizing your Annual Investment Allowance accelerates tax savings and improves working capital in the year investments are made. Note that passenger cars (except 100% zero-emission electric vehicles) use Writing Down Allowances instead.',
    statutoryRef: 'Capital Allowances Act 2001 s38A & s38B'
  },
  {
    id: 'wda-main-pool',
    term: 'Writing Down Allowance (WDA) & 14% Reform',
    category: 'Corporation Tax',
    shortSummary: 'The annual percentage deduction claimed on business assets that do not receive 100% first-year relief.',
    plainEnglish:
      'For assets that do not qualify for 100% first-year deduction, you deduct a percentage of their value each year. From April 2026, UK legislation adjusted the standard main pool rate from 18% to 14%.',
    whyItMatters:
      'When your company financial year straddles 1 April 2026, UK tax rules require a day-by-day blended rate. TaxFlow calculates this day-weighted percentage automatically to the exact penny.',
    statutoryRef: 'Finance Act 2024 / CAA 2001 s56'
  },
  {
    id: 'distributable-reserves',
    term: 'Distributable Reserves & Dividends',
    category: 'Director Compliance',
    shortSummary: 'Accumulated post-tax profits legally available for distribution to shareholders.',
    plainEnglish:
      'Under the Companies Act 2006, company dividends can only be distributed from realized accumulated profits, after accounting for Corporation Tax and operational liabilities. TaxFlow verifies your distributable reserves in real time to ensure all distributions are lawful and properly documented.',
    whyItMatters:
      'Maintaining positive distributable reserves before declaring dividends protects directors from unlawful distributions and potential tax reclassifications.',
    statutoryRef: 'Companies Act 2006 s830'
  },
  {
    id: 's477-exemption',
    term: 'Section 477 Audit Exemption',
    category: 'Accounts',
    shortSummary: 'The legal right of micro-entities to file without appointing an external auditor.',
    plainEnglish:
      'Under Section 477 of the Companies Act 2006, qualifying small companies and micro-entities are legally exempt from appointing an independent auditor. TaxFlow automatically embeds the required official exemption statements and director declaration on your Balance Sheet.',
    whyItMatters:
      'Including the exact legal audit exemption declaration allows small businesses to file confidently without incurring external audit fees.',
    statutoryRef: 'Companies Act 2006 s477'
  },
  {
    id: 'ixbrl-irmark',
    term: 'iXBRL & C14N IRmark',
    category: 'Technical',
    shortSummary: 'The digital reporting standard and cryptographic security digest used by HMRC and Companies House.',
    plainEnglish:
      'Government gateways process accounts using Inline XBRL (iXBRL) — specialized digital documents with embedded taxonomy tags for every financial item. An IRmark is a cryptographic SHA-1 digest generated from canonical XML code (W3C C14N) that verifies data integrity and provides non-repudiation.',
    whyItMatters:
      'Both HMRC and Companies House require certified iXBRL tagging and valid IRmark digests to accept digital tax filings.',
    statutoryRef: 'HMRC Technical Pack / W3C XML Canonicalization (C14N)'
  },
  {
    id: 'close-company',
    term: 'Close Company',
    category: 'Director Compliance',
    shortSummary: 'A private limited company controlled by five or fewer director-shareholders.',
    plainEnglish:
      'Most UK startups, consultancies, and family businesses are close companies, meaning ownership is concentrated among founding directors. This structure qualifies companies for streamlined annual reporting provisions.',
    whyItMatters:
      'Certain director compliance rules (such as Section 455 loan schedules) apply specifically to close companies, ensuring transparent corporate governance.',
    statutoryRef: 'Corporation Tax Act 2010 s439'
  },
  {
    id: 'marginal-relief',
    term: 'Marginal Relief & Augmented Profits',
    category: 'Corporation Tax',
    shortSummary: 'A graduated tax rate mechanism for companies with taxable profits between £50,000 and £250,000.',
    plainEnglish:
      'Companies with profits under £50,000 pay the 19% Small Profits Rate, while companies with profits over £250,000 pay the 25% Main Rate. For profits between £50,000 and £250,000, UK tax law provides Marginal Relief — a graduated sliding scale that transitions your effective tax rate smoothly.',
    whyItMatters:
      'Marginal Relief ensures that companies earning slightly over £50,000 do not experience a sudden jump to the 25% rate. TaxFlow calculates this fractional relief (standard fraction 3/200) automatically.',
    statutoryRef: 'Corporation Tax Act 2010 s18A'
  },
  {
    id: 'utr-vs-crn',
    term: 'UTR vs CRN vs Auth Code',
    category: 'Technical',
    shortSummary: 'The three essential reference numbers every UK company has.',
    plainEnglish:
      '• CRN (Company Registration Number): An 8-character ID assigned by Companies House when your company is incorporated (e.g. 15152081).\n• UTR (Unique Taxpayer Reference): A 10-digit tax number issued by HMRC for Corporation Tax.\n• WebFiling Auth Code: A 6-character secret code (letters/numbers) from Companies House that acts like your company’s digital signature.',
    whyItMatters:
      'You need CRN and Auth Code to file with Companies House, and UTR and Government Gateway credentials to file with HMRC.',
    statutoryRef: 'Companies House & HMRC Identification Standards'
  },
  {
    id: 'creditors-under-one-year',
    term: 'Creditors: Amounts Falling Due Within One Year',
    category: 'Accounts',
    shortSummary: 'All money your company owes to suppliers, banks, or the taxman within the next 12 months.',
    plainEnglish:
      'This represents your short-term liabilities: unpaid supplier bills, corporation tax owed to HMRC for the current year, VAT owed, credit card balances, or overdrafts that must be settled within the coming year.',
    whyItMatters:
      'Must be deducted from your current assets (cash and invoices due to you) to determine your "Net Current Assets". If this number is greater than your current assets, your company may be facing cash flow pressure.',
    statutoryRef: 'FRS 105 Section 4'
  },
  {
    id: 'tangible-fixed-assets',
    term: 'Tangible Fixed Assets',
    category: 'Accounts',
    shortSummary: 'Physical items your business owns to generate income for more than one year.',
    plainEnglish:
      'Laptops, computers, vehicles, tools, and office machinery. Unlike everyday stationery or software subscriptions that get used up quickly, tangible fixed assets are durable equipment you keep for years.',
    whyItMatters:
      'These appear on your balance sheet as assets and can qualify for 100% tax deduction under Annual Investment Allowance (AIA).',
    example: 'A £1,800 MacBook Pro purchased for software development is recorded as a tangible fixed asset.',
    statutoryRef: 'FRS 105 Section 12 / CAA 2001'
  },
  {
    id: 'debtors-receivable',
    term: 'Debtors (Trade Receivables)',
    category: 'Accounts',
    shortSummary: 'Money that clients or customers owe your company for invoices you have sent but not yet received payment for.',
    plainEnglish:
      'If you completed a project on 20 September, sent an invoice for £5,000, and the client pays on 15 October, that £5,000 is legally your asset on 30 September under accruals accounting.',
    whyItMatters:
      'Under UK law, tax is calculated on trading activity when the invoice is earned, not when the cash lands in the bank.',
    statutoryRef: 'FRS 105 Section 2 (Accrual Basis)'
  },
  {
    id: 'share-capital',
    term: 'Called-Up Share Capital',
    category: 'Accounts',
    shortSummary: 'The permanent nominal value of the shares issued to company founders upon incorporation.',
    plainEnglish:
      'When you incorporate a private limited company, you issue shares (usually 100 shares at £1 each = £100). This £100 is legally locked in as the company\'s base equity and does not change when profits rise.',
    whyItMatters:
      'Must balance exactly on the balance sheet: Total Shareholders\' Funds = Share Capital (£100) + Accumulated Retained Profit.',
    statutoryRef: 'Companies Act 2006 s542'
  },
  {
    id: 'confirmation-statement',
    term: 'Confirmation Statement (CS01) vs Accounts',
    category: 'Director Compliance',
    shortSummary: 'Understanding the distinct roles of the CS01 and your annual financial accounts.',
    plainEnglish:
      'UK companies have two distinct annual requirements:\n• Confirmation Statement (CS01): A corporate identity confirmation verifying directors, registered office address, shareholders, and Persons of Significant Control (PSC).\n• Annual Accounts (FRS 105): An official financial report detailing turnover, profit, balance sheet assets, and liabilities.\nBoth must be submitted annually to Companies House on separate official schedules.',
    whyItMatters:
      'Filing your accounts does not satisfy your Confirmation Statement duty. Keeping both current maintains your company’s active standing on the public register.',
    statutoryRef: 'Companies Act 2006 Part 24'
  },
  {
    id: 'payment-deadline-vs-filing',
    term: 'Corporation Tax Payment Date vs Return Deadline',
    category: 'Corporation Tax',
    shortSummary: 'Understanding the dual timetable for Corporation Tax payment and CT600 return filing.',
    plainEnglish:
      'In the UK tax system, Corporation Tax payment is due 9 months and 1 day after your accounting period ends (e.g. 1 July for a 30 September year end), while the CT600 tax return itself is due within 12 months (e.g. 30 September). TaxFlow provides clear timetable visibility so your company stays ahead of both deadlines.',
    whyItMatters:
      'Settling Corporation Tax by the 9-month due date prevents automatic HMRC interest charges and keeps your compliance record clean.',
    statutoryRef: 'TMA 1970 s59D'
  },
  {
    id: 'eccta-2023',
    term: 'ECCTA 2023 Digital Filing Mandate',
    category: 'Technical',
    shortSummary: 'The modern UK law phasing out paper accounts and mandating software-only filing.',
    plainEnglish:
      'The Economic Crime and Corporate Transparency Act (ECCTA) 2023 modernizes Companies House. It ends "filleted" paper accounts and mandates that all micro-entities must file both Profit & Loss and Balance Sheet via digital software using iXBRL.',
    whyItMatters:
      'TaxFlow UK was built specifically to comply with ECCTA 2023 from day one, ensuring your accounts are 100% compliant with the new digital transparency rules.',
    statutoryRef: 'Economic Crime and Corporate Transparency Act 2023'
  },
  {
    id: 'accruals-prepayments',
    term: 'Accruals and Prepayments',
    category: 'Accounts',
    shortSummary: 'Matching income and costs to when work happened, not when money moved.',
    plainEnglish:
      'Under UK accounting standards, you must report transactions in the year they happened. An "Accrual" is an expense you incurred but haven\'t paid yet (like December electricity billed in January). A "Prepayment" is an expense you paid in advance (like annual insurance paid upfront).',
    whyItMatters:
      'Ensures your profit calculation matches the exact trading reality of your 12-month period, rather than being distorted by cash timing.',
    example: 'You paid £1,200 for 12 months software on 1 July. Only £300 belongs to the period ending 30 September; the remaining £900 is a prepayment.',
    statutoryRef: 'FRS 105 Section 2.15 (Accrual Basis)'
  },
  {
    id: 'associated-companies',
    term: 'Associated Companies & Threshold Rules',
    category: 'Corporation Tax',
    shortSummary: 'How owning multiple limited companies affects your Corporation Tax thresholds.',
    plainEnglish:
      'If you control more than one UK company, HMRC treats them as "associated companies". Instead of each company enjoying the full £50,000 Small Profits threshold (19% rate), the £50,000 and £250,000 limits are divided equally between them (e.g. £25,000 and £125,000 each for two companies).',
    whyItMatters:
      'Prevents businesses from splitting into multiple entities to artificially stay within the 19% small profits rate.',
    example: 'A director owns Company A and Company B. Company A pays 19% on the first £25,000 profit, and enters marginal relief between £25,000 and £125,000.',
    statutoryRef: 'Corporation Tax Act 2010 s18E'
  },
  {
    id: 'trading-loss-relief',
    term: 'Trading Loss Relief & Carry-Forward',
    category: 'Corporation Tax',
    shortSummary: 'Using a loss made in a tough year to eliminate or reduce tax in future profitable years.',
    plainEnglish:
      'If your company expenses exceed your revenue in a given year, you have made a "trading loss". You don\'t pay any Corporation Tax in a loss-making year, and UK tax law allows you to carry that loss forward indefinitely to deduct against future trading profits.',
    whyItMatters:
      'Never waste a loss. If you lose £10,000 in Year 1 and make £30,000 in Year 2, you only pay tax on £20,000.',
    example: 'Brought forward loss of £10,000 + Year 2 trading profit of £30,000 = Taxable profit of £20,000.',
    statutoryRef: 'Corporation Tax Act 2010 Part 4 Chapter 2 (s45)'
  },
  {
    id: 'cis-deductions',
    term: 'Construction Industry Scheme (CIS)',
    category: 'Corporation Tax',
    shortSummary: 'Tax deducted at source from subcontractors in the construction trade.',
    plainEnglish:
      'If your company operates in the construction sector, contractors may deduct 20% or 30% from your invoices and pay it directly to HMRC as CIS tax. On your CT600 return, you report these CIS deductions suffered (Box 545) to offset directly against your final Corporation Tax bill.',
    whyItMatters:
      'If your CIS deductions suffered exceed your Corporation Tax due, HMRC will issue a cash refund directly to your company bank account.',
    statutoryRef: 'Income Tax (Earnings and Pensions) Act 2003 / FA 2004'
  }
];

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return TAX_GLOSSARY.find((t) => t.id === id);
}

export function searchGlossary(query: string): GlossaryTerm[] {
  if (!query.trim()) return TAX_GLOSSARY;
  const q = query.toLowerCase();
  return TAX_GLOSSARY.filter(
    (t) =>
      t.term.toLowerCase().includes(q) ||
      t.shortSummary.toLowerCase().includes(q) ||
      t.plainEnglish.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
}

