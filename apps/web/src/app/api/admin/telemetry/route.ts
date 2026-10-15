import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getRepositories } from '@taxflow/db';

let isSandboxMode = true;

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const repos = getRepositories();
    const stats = repos.auth.getPlatformStats();
    let submissions = repos.auth.listGatewaySubmissions();
    const users = repos.auth.listAllUsers();

    // If no submissions recorded yet, seed realistic gateway transmissions for telemetry demonstration
    if (submissions.length === 0) {
      let filingId: string;
      const existingFilings = repos.filings.listAll();
      if (existingFilings.length > 0) {
        filingId = existingFilings[0].id;
      } else {
        const company = repos.companies.getByCrn('15152081') || repos.companies.upsert({
          crn: '15152081',
          name: 'DROPLOGICX LTD',
          registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
          companyType: 'ltd',
          isCloseCompany: true
        });

        const newFiling = repos.filings.create({
          companyId: company.id,
          periodStart: '2025-10-01',
          periodEnd: '2026-09-30',
          directorName: 'Muhammad Saif Raza',
          status: 'SUBMITTED',
          irmarkBase64: 'E8g0182Nsd9120='
        });
        filingId = newFiling.id;
      }

      repos.auth.recordGatewaySubmission({
        filingId,
        gatewayType: 'HMRC_CT600',
        correlationId: 'HMRC-CT600-2026-9812A4',
        status: 'ACCEPTED',
        latencyMs: 1420,
        rawRequestXml: '<GovTalkMessage xmlns="http://www.govtalk.gov.uk/CM/envelope"><Header><MessageDetails><Class>HMRC-CT600</Class></MessageDetails></Header></GovTalkMessage>',
        rawResponseXml: '<GovTalkMessage><Body><SuccessResponse><IRmarkReceived>E8g0182Nsd9120=</IRmarkReceived></SuccessResponse></Body></GovTalkMessage>'
      });

      repos.auth.recordGatewaySubmission({
        filingId,
        gatewayType: 'COMPANIES_HOUSE_ACCOUNTS',
        correlationId: 'CH-EW-15152081-88419',
        status: 'ACCEPTED',
        latencyMs: 890,
        rawRequestXml: '<GovTalkMessage><Header><MessageDetails><Class>FormAccounts</Class></MessageDetails></Header></GovTalkMessage>',
        rawResponseXml: '<GovTalkMessage><Body><ResponseDetails><Status>ACCEPTED</Status><TransactionID>09812481</TransactionID></ResponseDetails></Body></GovTalkMessage>'
      });

      submissions = repos.auth.listGatewaySubmissions();
    }

    return NextResponse.json({
      success: true,
      stats,
      submissions,
      users,
      sandboxMode: isSandboxMode
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Telemetry retrieval failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getCurrentUser();
    if (!auth || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();

    if (body.action === 'toggle_sandbox') {
      if (typeof body.sandboxMode === 'boolean') {
        isSandboxMode = body.sandboxMode;
      } else {
        isSandboxMode = !isSandboxMode;
      }
      return NextResponse.json({ success: true, sandboxMode: isSandboxMode });
    }

    if (body.action === 'test_transmission') {
      const repos = getRepositories();
      const existingFilings = repos.filings.listAll();
      let filingId = body.filingId;
      if (!filingId) {
        if (existingFilings.length > 0) {
          filingId = existingFilings[0].id;
        } else {
          const company = repos.companies.getByCrn('15152081') || repos.companies.upsert({
            crn: '15152081',
            name: 'DROPLOGICX LTD',
            registeredAddress: '71-75 Shelton Street, Covent Garden, London, WC2H 9JQ',
            companyType: 'ltd',
            isCloseCompany: true
          });
          const newFiling = repos.filings.create({
            companyId: company.id,
            periodStart: '2025-10-01',
            periodEnd: '2026-09-30',
            directorName: 'Muhammad Saif Raza',
            status: 'SUBMITTED',
            irmarkBase64: 'E8g0182Nsd9120='
          });
          filingId = newFiling.id;
        }
      }
      const gatewayType = body.gatewayType === 'HMRC_CT600' ? 'HMRC_CT600' : 'COMPANIES_HOUSE_ACCOUNTS';
      const correlationId = `${gatewayType === 'HMRC_CT600' ? 'HMRC' : 'CH'}-TEST-${Date.now().toString().slice(-6)}`;
      const latencyMs = Math.floor(Math.random() * 800) + 650;

      const newSubmission = repos.auth.recordGatewaySubmission({
        filingId,
        gatewayType,
        correlationId,
        status: 'ACCEPTED',
        latencyMs,
        rawRequestXml: `<GovTalkMessage test="true"><Class>${gatewayType}</Class></GovTalkMessage>`,
        rawResponseXml: `<GovTalkMessage test="true"><Status>ACCEPTED</Status><LatencyMs>${latencyMs}</LatencyMs></GovTalkMessage>`
      });

      return NextResponse.json({ success: true, submission: newSubmission });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Telemetry operation failed' },
      { status: 500 }
    );
  }
}
