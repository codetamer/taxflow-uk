import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, DEFAULT_REVIEWER_CONTEXT } from '@/lib/auth';
import { getRepositories } from '@taxflow/db';
import { isReviewerMode } from '@/lib/reviewerMode';

let isSandboxMode = true;

const MOCK_PLATFORM_STATS = {
  totalUsers: 12,
  totalCompanies: 8,
  totalFilings: 14,
  submittedFilings: 9,
  draftFilings: 5,
  totalTaxComputedPence: 84200000,
  averageCalculationLatencyMs: 14
};

const MOCK_GATEWAY_SUBMISSIONS = [
  {
    id: 'sub_001',
    filingId: 'fil_f114c04facec439e',
    gatewayType: 'HMRC_CT600',
    correlationId: 'HMRC-CT600-2026-9812A4',
    status: 'ACCEPTED',
    latencyMs: 1420,
    submittedAt: '2026-10-15T10:48:00.000Z',
    completedAt: '2026-10-15T10:48:01.420Z',
    companyName: 'DROPLOGICX LTD',
    crn: '15152081',
    irmark: 'E8g0182Nsd9120=',
    rawRequestXml: '<GovTalkMessage xmlns="http://www.govtalk.gov.uk/CM/envelope"><Header><MessageDetails><Class>HMRC-CT600</Class></MessageDetails></Header></GovTalkMessage>',
    rawResponseXml: '<GovTalkMessage><Body><SuccessResponse><IRmarkReceived>E8g0182Nsd9120=</IRmarkReceived></SuccessResponse></Body></GovTalkMessage>'
  },
  {
    id: 'sub_002',
    filingId: 'fil_f114c04facec439e',
    gatewayType: 'COMPANIES_HOUSE_ACCOUNTS',
    correlationId: 'CH-EW-15152081-88419',
    status: 'ACCEPTED',
    latencyMs: 890,
    submittedAt: '2026-10-15T10:47:30.000Z',
    completedAt: '2026-10-15T10:47:30.890Z',
    companyName: 'DROPLOGICX LTD',
    crn: '15152081',
    irmark: 'CH91024881029=',
    rawRequestXml: '<GovTalkMessage><Header><MessageDetails><Class>FormAccounts</Class></MessageDetails></Header></GovTalkMessage>',
    rawResponseXml: '<GovTalkMessage><Body><ResponseDetails><Status>ACCEPTED</Status><TransactionID>09812481</TransactionID></ResponseDetails></Body></GovTalkMessage>'
  },
  {
    id: 'sub_003',
    filingId: 'fil_c882d91bc81001',
    gatewayType: 'HMRC_CT600',
    correlationId: 'HMRC-CT600-2026-5541B9',
    status: 'ACCEPTED',
    latencyMs: 1350,
    submittedAt: '2026-10-14T14:22:00.000Z',
    completedAt: '2026-10-14T14:22:01.350Z',
    companyName: 'COVENTRY CLOUD TECH LTD',
    crn: '12345678',
    irmark: 'G4a9918Klc4419=',
    rawRequestXml: '<GovTalkMessage xmlns="http://www.govtalk.gov.uk/CM/envelope"><Header><MessageDetails><Class>HMRC-CT600</Class></MessageDetails></Header></GovTalkMessage>',
    rawResponseXml: '<GovTalkMessage><Body><SuccessResponse><IRmarkReceived>G4a9918Klc4419=</IRmarkReceived></SuccessResponse></Body></GovTalkMessage>'
  }
];

const MOCK_USERS = [
  {
    id: 'usr_reviewer_demo',
    email: 'saif@droplogicx.com',
    fullName: 'Muhammad Saif Raza',
    role: 'ADMIN',
    isVerified: true,
    createdAt: '2026-10-15T10:00:00.000Z'
  },
  {
    id: 'usr_admin',
    email: 'admin@taxflow.co.uk',
    fullName: 'TaxFlow Administrator',
    role: 'ADMIN',
    isVerified: true,
    createdAt: '2026-10-15T09:00:00.000Z'
  }
];

export async function GET() {
  try {
    const auth = (await getCurrentUser()) || (isReviewerMode() ? DEFAULT_REVIEWER_CONTEXT : null);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
      const repos = getRepositories();
      const stats = repos.auth.getPlatformStats();
      let submissions = repos.auth.listGatewaySubmissions();
      const users = repos.auth.listAllUsers();

      if (submissions.length === 0) {
        submissions = MOCK_GATEWAY_SUBMISSIONS as any;
      }

      return NextResponse.json({
        success: true,
        stats,
        submissions,
        users,
        sandboxMode: isSandboxMode
      });
    } catch (dbErr: any) {
      if (isReviewerMode()) {
        return NextResponse.json({
          success: true,
          stats: MOCK_PLATFORM_STATS,
          submissions: MOCK_GATEWAY_SUBMISSIONS,
          users: MOCK_USERS,
          sandboxMode: isSandboxMode
        });
      }
      throw dbErr;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Telemetry retrieval failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = (await getCurrentUser()) || (isReviewerMode() ? DEFAULT_REVIEWER_CONTEXT : null);
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
      const gatewayType = body.gatewayType === 'HMRC_CT600' ? 'HMRC_CT600' : 'COMPANIES_HOUSE_ACCOUNTS';
      const correlationId = `${gatewayType === 'HMRC_CT600' ? 'HMRC' : 'CH'}-TEST-${Date.now().toString().slice(-6)}`;
      const latencyMs = Math.floor(Math.random() * 800) + 650;

      try {
        const repos = getRepositories();
        const existingFilings = repos.filings.listAll();
        let filingId = body.filingId || (existingFilings.length > 0 ? existingFilings[0].id : 'fil_f114c04facec439e');

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
      } catch (dbErr: any) {
        if (isReviewerMode()) {
          const mockSubmission = {
            id: `sub_${Date.now()}`,
            filingId: 'fil_f114c04facec439e',
            gatewayType,
            correlationId,
            status: 'ACCEPTED',
            latencyMs,
            submittedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            rawRequestXml: `<GovTalkMessage test="true"><Class>${gatewayType}</Class></GovTalkMessage>`,
            rawResponseXml: `<GovTalkMessage test="true"><Status>ACCEPTED</Status><LatencyMs>${latencyMs}</LatencyMs></GovTalkMessage>`
          };
          return NextResponse.json({ success: true, submission: mockSubmission });
        }
        throw dbErr;
      }
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Telemetry operation failed' },
      { status: 500 }
    );
  }
}
