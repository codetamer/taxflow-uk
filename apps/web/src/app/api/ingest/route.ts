import { NextRequest, NextResponse } from 'next/server';
import { normalizeBankCsv, parseTrialBalanceCsv } from '@taxflow/ingestion';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let csvContent = '';
    let mode: 'bank' | 'trial_balance' = 'bank';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      mode = (formData.get('mode') as 'bank' | 'trial_balance') || 'bank';
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }
      csvContent = await file.text();
    } else {
      const body = await req.json();
      csvContent = body.csvContent;
      mode = body.mode || 'bank';
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 });
    }

    if (mode === 'trial_balance') {
      const tbResult = parseTrialBalanceCsv(csvContent);
      return NextResponse.json({
        success: true,
        type: 'trial_balance',
        result: tbResult
      });
    }

    const normResult = normalizeBankCsv(csvContent);
    return NextResponse.json({
      success: true,
      type: 'bank_statement',
      result: normResult
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}

