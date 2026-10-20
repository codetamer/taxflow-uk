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
    shortSummary: 'The simplest legal accounting standard in the UK for small companies.',
    plainEnglish:
      'FRS 105 is a simplified rulebook designed specifically for very small businesses ("micro-entities"). Instead of producing 30-page complex corporate reports, it allows you to submit a stripped-down, 2-page balance sheet and profit & loss account without complicated fair-value notes.',
    whyItMatters:
      'Using FRS 105 keeps you fully compliant with Companies House while drastically reducing reporting paperwork and accountant fees.',
    example: 'A solo consultant or e-commerce shop with turnover under £1,000,000 qualifies to use FRS 105.',
    statutoryRef: 'Financial Reporting Standard 105 / The Small Companies Regulations 2008'
  },
  {
    id: 'ct600',
    term: 'HMRC CT600 Form',
    category: 'Corporation Tax',
    shortSummary: 'The official tax return your company files annually with HMRC.',
    plainEnglish:
      'Just like an individual files a Self Assessment tax return, a limited company files a CT600. It calculates your company’s trading profit, applies allowable deductions, and works out how much Corporation Tax your company owes.',
    whyItMatters:
      'It must be filed with HMRC within 12 months after your accounting period ends, though the actual tax payment is due earlier (9 months and 1 day). Late submission incurs automatic penalties.',
    statutoryRef: 'Corporation Tax Act 2010'
  },
  {
    id: 's455-loan',
    term: 'Section 455 Director’s Loan Tax',
    category: 'Director Compliance',
    shortSummary: 'A temporary tax (33.75% or 35.75%) HMRC charges if you borrow money from your company and do not pay it back.',
    plainEnglish:
      'Company money is not your personal money. If you withdraw money from the business that is not salary or dividends, it is legally a "director’s loan". If you don’t repay it within 9 months and 1 day after your financial year ends, HMRC charges the company a temporary tax (33.75% for loans taken before 6 April 2026, and 35.75% for loans made on or after).',
    whyItMatters:
      'The good news: Once you repay the loan back to the company, HMRC refunds this entire tax to you under Section 458! TaxFlow tracks repayment dates automatically so you never overpay.',
    example: 'You borrowed £10,000 for home renovations. If still unpaid 9 months after year-end, company pays £3,375 tax to HMRC, which is refunded when you pay the £10,000 back.',
    statutoryRef: 'Corporation Tax Act 2010 s455 & s458'
  },
  {
    id: 'balance-sheet-symmetry',
    term: 'Balance Sheet Symmetry (Net Assets = Equity)',
    category: 'Accounts',
    shortSummary: 'The fundamental rule that what the company owns minus what it owes must equal shareholders’ funds.',
    plainEnglish:
      'Think of a balance sheet as two sides of a scale: Side A is Net Assets (Everything the company owns like cash, computers, and invoices owed to you, minus all debts and unpaid bills). Side B is Shareholders’ Funds (the original £100 share capital + all profits kept in the business). Both sides MUST match to the exact single penny.',
    whyItMatters:
      'Companies House computer systems check this down to the 1p level. If Side A does not equal Side B, the electronic gateway rejects your submission immediately.',
    example: 'Fixed Assets (£15,000) + Cash (£31,139) - Creditors (£25,000) = £31,139 Net Assets. This precisely matches £100 Shares + £31,039 Retained Profit.',
    statutoryRef: 'Companies Act 2006 s396 & FRS 105 Section 4'
  },
  {
    id: 'disallowable-expenses',
    term: 'Disallowable Expenses (Add-Backs)',
    category: 'Corporation Tax',
    shortSummary: 'Business costs that you are legally allowed to record, but which cannot reduce your tax bill.',
    plainEnglish:
      'Not every business expense reduces your corporation tax. For example, taking a client to lunch or paying a parking fine are valid accounting costs, but HMRC rules say you cannot deduct them for tax. These get "added back" to your profit before computing your tax.',
    whyItMatters:
      'Claiming client entertaining or parking tickets as tax-deductible is one of the most common mistakes HMRC audits and penalizes.',
    example: 'You made £30,000 accounting profit and spent £1,000 taking prospective clients to dinners. TaxFlow automatically adds back the £1,000 so your tax is calculated on £31,000.',
    statutoryRef: 'Corporation Tax Act 2009 s1298 (Client Entertaining)'
  },
  {
    id: 'capital-allowances-aia',
    term: 'Capital Allowances & AIA (Annual Investment Allowance)',
    category: 'Corporation Tax',
    shortSummary: 'HMRC’s way of letting you deduct 100% of the cost of tools, laptops, and equipment in year one.',
    plainEnglish:
      'When you buy everyday stationery, it’s an expense. When you buy a £2,000 MacBook or specialist tools that last years, it’s a "capital asset". Normal depreciation isn’t tax deductible, but HMRC gives you "Annual Investment Allowance" (AIA) which lets you deduct 100% of the equipment price from your taxable profits immediately.',
    whyItMatters:
      'Saves you significant tax up front! However, motor cars (except 100% electric zero-emission vehicles) are legally barred from 100% AIA and must use Writing Down Allowances instead.',
    statutoryRef: 'Capital Allowances Act 2001 s38A & s38B'
  },
  {
    id: 'wda-main-pool',
    term: 'Writing Down Allowance (WDA) & 14% Reform',
    category: 'Corporation Tax',
    shortSummary: 'The annual percentage deduction you claim on business assets that do not get 100% first-year relief.',
    plainEnglish:
      'For assets that don’t qualify for 100% first-year deduction (like certain company vehicles), you deduct a percentage of their value each year. From April 2026, the UK government reduced the standard rate from 18% to 14%.',
    whyItMatters:
      'If your company financial year crosses 1 April 2026 (e.g. October 2025 to September 2026), you cannot use a simple 18% or 14%. You must calculate a day-by-day blended rate. TaxFlow does this calculation automatically to the exact penny.',
    statutoryRef: 'Finance Act 2024 / CAA 2001 s56'
  },
  {
    id: 'distributable-reserves',
    term: 'Distributable Reserves & Illegal Dividends',
    category: 'Director Compliance',
    shortSummary: 'The actual accumulated post-tax profit your company is legally permitted to pay out as dividends.',
    plainEnglish:
      'You cannot legally pay yourself a dividend just because there is cash in the company bank account. A dividend can ONLY be paid out of accumulated profit AFTER setting aside money for Corporation Tax and unpaid bills. If you take dividends when reserves are negative, it is an "ultra vires" (unlawful) dividend.',
    whyItMatters:
      'If HMRC audits an illegal dividend, they can reclassify it as an overdrawn director loan and demand 33.75% / 35.75% s455 tax plus National Insurance penalties. TaxFlow’s shield verifies you have sufficient reserves before you distribute.',
    statutoryRef: 'Companies Act 2006 s830'
  },
  {
    id: 's477-exemption',
    term: 'Section 477 Audit Exemption',
    category: 'Accounts',
    shortSummary: 'The legal right of micro-entities not to pay £5,000+ for an independent external auditor.',
    plainEnglish:
      'Large corporations must hire expensive audit firms to review their financial records. As a UK micro-entity, you are legally exempt from this requirement under Section 477 of the Companies Act 2006, as long as you include the mandatory legal declaration on your balance sheet.',
    whyItMatters:
      'Companies House will reject any accounts that lack this exact statutory statement. TaxFlow embeds the exact required wording and director sign-off block automatically.',
    statutoryRef: 'Companies Act 2006 s477'
  },
  {
    id: 'ixbrl-irmark',
    term: 'iXBRL & C14N IRmark',
    category: 'Technical',
    shortSummary: 'The digital language and cryptographic security stamp used by HMRC and Companies House.',
    plainEnglish:
      'Instead of reading PDFs like humans do, government computers read "Inline XBRL" (iXBRL) — HTML documents with hidden computer tags on every number (e.g. `<ix:nonFraction name="uk-gaap:Turnover">100000</ix:nonFraction>`). An "IRmark" is a digital SHA-1 fingerprint generated from the document code to prove it hasn’t been tampered with.',
    whyItMatters:
      'Both HMRC and Companies House reject files if the iXBRL code has invalid namespaces or if the IRmark fingerprint does not match the XML body precisely.',
    statutoryRef: 'HMRC Technical Pack / W3C XML Canonicalization (C14N)'
  },
  {
    id: 'close-company',
    term: 'Close Company',
    category: 'Director Compliance',
    shortSummary: 'A limited company controlled by 5 or fewer directors/shareholders.',
    plainEnglish:
      'Almost every contractor, family business, and startup in the UK is a "close company". It simply means the company is owned and controlled by a small circle of individuals (usually the founding directors) rather than thousands of public stock market investors.',
    whyItMatters:
      'Special anti-avoidance tax rules (like Section 455 director loan tax) only apply to close companies.',
    statutoryRef: 'Corporation Tax Act 2010 s439'
  },
  {
    id: 'marginal-relief',
    term: 'Marginal Relief & Augmented Profits',
    category: 'Corporation Tax',
    shortSummary: 'A tax discount for companies with taxable profits between £50,000 and £250,000.',
    plainEnglish:
      'Companies with profits under £50,000 pay the 19% Small Profits Rate. Companies earning over £250,000 pay the 25% Main Rate. If your profit falls between £50k and £250k, the UK tax system provides "Marginal Relief" — a sliding scale discount so your tax rate transitions smoothly instead of jumping instantly.',
    whyItMatters:
      'Without Marginal Relief, a company earning £50,001 would see a sudden jump in tax. TaxFlow calculates this fractional taper (standard fraction 3/200) automatically.',
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
    shortSummary: 'Two completely different annual submissions that directors frequently confuse.',
    plainEnglish:
      '• Confirmation Statement (CS01): A corporate identity check verifying your directors, registered address, shareholders, and PSC (Persons of Significant Control). No financial figures or numbers are involved.\n• Annual Accounts (FRS 105): A financial report showing your turnover, profit, assets, and liabilities.\nBoth must be submitted annually to Companies House, but they are separate filings.',
    whyItMatters:
      'Filing your accounts does not satisfy your Confirmation Statement duty. Both have distinct deadlines.',
    statutoryRef: 'Companies Act 2006 Part 24'
  },
  {
    id: 'payment-deadline-vs-filing',
    term: 'Corporation Tax Payment Date vs Return Deadline',
    category: 'Corporation Tax',
    shortSummary: 'The trap where your tax bill is due before your tax return needs to be filed.',
    plainEnglish:
      'In the UK tax system, you must PAY your Corporation Tax to HMRC 9 months and 1 day after your accounting period ends (e.g. 1 July for a 30 September year end). However, you have 12 months to submit the actual CT600 return form (e.g. 30 September).',
    whyItMatters:
      'Many directors assume their tax payment isn\'t due until the return filing deadline, which causes HMRC to charge automatic interest on unpaid tax.',
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
      'Under UK statutory accounting, you must report transactions in the year they happened. An "Accrual" is an expense you incurred but haven\'t paid yet (like December electricity billed in January). A "Prepayment" is an expense you paid in advance (like annual insurance paid upfront).',
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

