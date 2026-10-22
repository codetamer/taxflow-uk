import { NextRequest, NextResponse } from 'next/server';
import { CompaniesHouseClient } from '@taxflow/companies-house';
import { parseFrs105Ixbrl } from '@taxflow/doc-engine';
import { getRepositories } from '@taxflow/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ crn: string }> }
) {
  try {
    const { crn } = await context.params;

    if (!crn || crn.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Company registration number (CRN) is required' },
        { status: 400 }
      );
    }

    const cleanCrn = crn.trim().toUpperCase();
    const repos = getRepositories();

    // Ensure company exists in DB
    let companyRecord = repos.companies.getByCrn(cleanCrn);
    const client = new CompaniesHouseClient();

    if (!companyRecord) {
      const details = await client.getNormalizedCompanyDetails(cleanCrn);
      if (details) {
        companyRecord = repos.companies.upsert({
          crn: details.crn,
          name: details.name,
          registeredAddress: details.registeredAddress,
          companyType: details.companyType,
          isCloseCompany: details.isCloseCompany
        });
      }
    }

    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Retrieve latest accounts document from Companies House Document API
    const docResult = await client.getLatestAccountsDocument(cleanCrn);

    if (!docResult.isAvailable || !docResult.rawXhtml) {
      return NextResponse.json({
        success: true,
        isAvailable: false,
        reason: docResult.reason,
        crn: cleanCrn,
        message:
          docResult.reason === 'NO_ACCOUNTS_FILED'
            ? 'No previous accounts found on Companies House register (first-year company).'
            : docResult.reason === 'PAPER_PDF_ONLY'
            ? 'Prior year accounts were filed on paper/PDF. Enter comparative figures manually.'
            : 'Unable to retrieve document content from Companies House.'
      });
    }

    // Parse the iXBRL XHTML into exact integer pence
    const parsed = parseFrs105Ixbrl(docResult.rawXhtml, docResult.periodEnd || '2025-09-30');

    // Cache in database if company is recorded
    let priorYearRecord = null;
    if (companyRecord) {
      priorYearRecord = repos.priorYears.upsert({
        companyId: companyRecord.id,
        periodEnd: parsed.periodEnd,
        turnoverPence: parsed.turnoverPence,
        costOfSalesPence: parsed.costOfSalesPence,
        tangibleFixedAssetsPence: parsed.tangibleFixedAssetsPence,
        debtorsPence: parsed.debtorsPence,
        cashAtBankPence: parsed.cashAtBankPence,
        creditorsDueWithinOneYearPence: parsed.creditorsDueWithinOneYearPence,
        calledUpShareCapitalPence: parsed.calledUpShareCapitalPence,
        profitAndLossReservePence: parsed.profitAndLossReservePence
      });
    }

    return NextResponse.json({
      success: true,
      isAvailable: true,
      source: 'COMPANIES_HOUSE_IXBRL',
      crn: cleanCrn,
      transactionId: docResult.transactionId,
      filingDate: docResult.filingDate,
      periodEnd: parsed.periodEnd,
      approvalDate: parsed.approvalDate,
      directorName: parsed.directorName,
      isBalanceSheetSymmetric: parsed.isBalanceSheetSymmetric,
      variancePence: parsed.variancePence,
      figures: {
        turnoverPence: parsed.turnoverPence,
        costOfSalesPence: parsed.costOfSalesPence,
        otherChargesPence: parsed.otherChargesPence,
        taxExpensePence: parsed.taxExpensePence,
        netProfitAfterTaxPence: parsed.netProfitAfterTaxPence,
        tangibleFixedAssetsPence: parsed.tangibleFixedAssetsPence,
        debtorsPence: parsed.debtorsPence,
        cashAtBankPence: parsed.cashAtBankPence,
        creditorsDueWithinOneYearPence: parsed.creditorsDueWithinOneYearPence,
        calledUpShareCapitalPence: parsed.calledUpShareCapitalPence,
        profitLossReservePence: parsed.profitLossReservePence,
        netCurrentAssetsPence: parsed.netCurrentAssetsPence,
        totalAssetsLessCurrentLiabilitiesPence: parsed.totalAssetsLessCurrentLiabilitiesPence,
        netAssetsPence: parsed.netAssetsPence,
        shareholderFundsPence: parsed.shareholderFundsPence
      },
      priorYearRecord
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve prior-year iXBRL accounts' },
      { status: 500 }
    );
  }
}
