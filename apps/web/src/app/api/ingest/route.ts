import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeBankCsv,
  parseTrialBalanceCsv,
  ingestFinancialPdf
} from '@taxflow/ingestion';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let mode: 'bank' | 'trial_balance' | undefined = undefined;

    // 1. Multipart Form Data (Direct File Upload via drag & drop or file picker)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const requestedMode = formData.get('mode') as 'bank' | 'trial_balance' | null;
      if (requestedMode) mode = requestedMode;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const fileName = file.name || '';
      const isPdf = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfResult = await ingestFinancialPdf(buffer, mode);

        return NextResponse.json({
          success: true,
          format: 'pdf',
          fileName,
          type: pdfResult.type,
          pageCount: pdfResult.pageCount,
          detectedBank: pdfResult.type === 'bank_statement' ? pdfResult.detectedBank : undefined,
          result: pdfResult.result
        });
      }

      // Otherwise text/CSV
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        return NextResponse.json({ error: 'Empty file uploaded' }, { status: 400 });
      }

      const isTrialBalance = mode === 'trial_balance' || (text.toLowerCase().includes('debit') && text.toLowerCase().includes('credit'));
      if (isTrialBalance) {
        const tbResult = parseTrialBalanceCsv(text);
        return NextResponse.json({
          success: true,
          format: 'csv',
          fileName,
          type: 'trial_balance',
          result: tbResult
        });
      }

      const normResult = normalizeBankCsv(text);
      return NextResponse.json({
        success: true,
        format: 'csv',
        fileName,
        type: 'bank_statement',
        result: normResult
      });
    }

    // 2. JSON Body Payload
    const body = await req.json();
    mode = body.mode;

    // Base64 PDF Ingestion
    const base64Str = body.base64Content || body.pdfBase64 || body.base64;
    if (base64Str) {
      const pdfBuffer = Buffer.from(base64Str, 'base64');
      const pdfResult = await ingestFinancialPdf(pdfBuffer, mode);

      return NextResponse.json({
        success: true,
        format: 'pdf',
        type: pdfResult.type,
        pageCount: pdfResult.pageCount,
        detectedBank: pdfResult.type === 'bank_statement' ? pdfResult.detectedBank : undefined,
        result: pdfResult.result
      });
    }

    // CSV Text Ingestion
    const csvContent = body.csvContent;
    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ error: 'Empty CSV content supplied' }, { status: 400 });
    }

    if (mode === 'trial_balance') {
      const tbResult = parseTrialBalanceCsv(csvContent);
      return NextResponse.json({
        success: true,
        format: 'csv',
        type: 'trial_balance',
        result: tbResult
      });
    }

    const normResult = normalizeBankCsv(csvContent);
    return NextResponse.json({
      success: true,
      format: 'csv',
      type: 'bank_statement',
      result: normResult
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}
