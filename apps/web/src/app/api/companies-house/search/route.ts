import { NextRequest, NextResponse } from 'next/server';
import { CompaniesHouseClient } from '@taxflow/companies-house';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, items: [] });
    }

    const client = new CompaniesHouseClient();
    const items = await client.searchCompanies(q.trim(), 8);

    return NextResponse.json({
      success: true,
      items
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Companies House search failed' },
      { status: 500 }
    );
  }
}
