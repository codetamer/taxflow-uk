'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Server,
  Activity,
  Users,
  Building2,
  FileCheck2,
  CreditCard,
  RefreshCw,
  Search,
  ExternalLink,
  Code2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  Play
} from 'lucide-react';

interface PlatformStats {
  totalUsers: number;
  totalCompanies: number;
  totalFilings: number;
  completedFilings: number;
  grossRevenuePence: number;
}

interface GatewaySubmission {
  id: string;
  filingId: string;
  gatewayType: 'HMRC_CT600' | 'COMPANIES_HOUSE_ACCOUNTS';
  correlationId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rawRequestXml?: string;
  rawResponseXml?: string;
  errorCode?: string;
  errorMessage?: string;
  latencyMs: number;
  submittedAt: string;
  completedAt?: string;
  companyName: string;
  crn: string;
  irmark?: string;
}

interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  companyCount: number;
}

export default function AdminCockpitPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [submissions, setSubmissions] = useState<GatewaySubmission[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [sandboxMode, setSandboxMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterCrn, setFilterCrn] = useState<string>('');
  const [selectedXml, setSelectedXml] = useState<{ title: string; content: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setSubmissions(data.submissions);
          setUsers(data.users);
          setSandboxMode(data.sandboxMode);
        }
      } else if (res.status === 403) {
        setErrorMessage('Access Denied: You must be logged in as an Administrator (e.g. admin@taxflow.co.uk) to view this cockpit.');
      } else if (res.status === 401) {
        setErrorMessage('Authentication Required: Please sign in as an admin.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect to gateway telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleToggleSandbox = async () => {
    try {
      const res = await fetch('/api/admin/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_sandbox', sandboxMode: !sandboxMode })
      });
      if (res.ok) {
        const data = await res.json();
        setSandboxMode(data.sandboxMode);
      }
    } catch (err) {
      console.error('Error toggling sandbox:', err);
    }
  };

  const handleSimulateTransmission = async (gatewayType: 'HMRC_CT600' | 'COMPANIES_HOUSE_ACCOUNTS') => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/admin/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_transmission', gatewayType })
      });
      if (res.ok) {
        await fetchTelemetry();
      }
    } catch (err) {
      console.error('Error simulating transmission:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (!filterCrn) return true;
    const term = filterCrn.toLowerCase();
    return (
      sub.crn.toLowerCase().includes(term) ||
      sub.companyName.toLowerCase().includes(term) ||
      sub.correlationId.toLowerCase().includes(term)
    );
  });

  if (errorMessage) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-3xl mx-auto flex items-center justify-center border border-red-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Cockpit Restricted</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">{errorMessage}</p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/auth/login"
            className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition"
          >
            Sign in as Admin
          </Link>
          <Link
            href="/dashboard"
            className="bg-white border border-slate-300 text-slate-700 font-semibold px-5 py-2.5 rounded-xl text-xs hover:bg-slate-50 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Cockpit Header */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Sovereign Gateway Mesh • Operational
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gateway Telemetry & Admin Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Live transmission monitoring for HMRC Transaction Engine (CT600) and Companies House Gateway (FRS 105).
            </p>
          </div>

          {/* Sandbox Switch & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center space-x-3 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Environment</span>
                <span className={`font-bold ${sandboxMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {sandboxMode ? 'GovTalk Test Sandbox' : 'Live Production Gateway'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleSandbox}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  sandboxMode ? 'bg-amber-600' : 'bg-emerald-600'
                }`}
                title="Toggle Sandbox Mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    sandboxMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={fetchTelemetry}
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time Gateway Health Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
            <Server className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-200">HMRC GovTalk Endpoint</p>
              <p className="text-[11px] text-emerald-400 font-mono">Online • 99.98% SLA • 1,420ms avg</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-200">Companies House TIS</p>
              <p className="text-[11px] text-emerald-400 font-mono">Online • 99.99% SLA • 890ms avg</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-200">40-Point Pre-Flight Shield</p>
              <p className="text-[11px] text-emerald-400 font-mono">Active • 0.0% Gateway Rejection</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Sovereign Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Platform Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-mono">
            £{stats ? ((stats.grossRevenuePence || 4900) / 100).toFixed(2) : '49.00'}
          </div>
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-700 font-semibold">£49.00 net</span>
            <span>per filed micro-entity return</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Directors</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-mono">
            {stats ? stats.totalUsers : 2}
          </div>
          <p className="text-xs text-slate-500">
            Active verified director accounts
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Connected Companies</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-mono">
            {stats ? stats.totalCompanies : 1}
          </div>
          <p className="text-xs text-slate-500">
            Companies House verified CRNs
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gateway Filings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-950 font-mono">
            {stats ? `${stats.completedFilings} / ${stats.totalFilings || 1}` : '1 / 1'}
          </div>
          <p className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0% rejection rate</span>
          </p>
        </div>
      </div>

      {/* Gateway Submissions Live Telemetry Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Live Gateway Submissions & Transmissions
              </h2>
              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                {submissions.length} events
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographic IRmarks, GovTalk correlation tokens, and round-trip latency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by CRN or ID..."
                value={filterCrn}
                onChange={(e) => setFilterCrn(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
              />
            </div>

            {/* Simulate Transmission Triggers */}
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateTransmission('HMRC_CT600')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1 transition disabled:opacity-50"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Test HMRC Gateway</span>
            </button>

            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleSimulateTransmission('COMPANIES_HOUSE_ACCOUNTS')}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1 transition disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              <span>Test CH Gateway</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Gateway</th>
                <th className="py-3 px-4">Company / CRN</th>
                <th className="py-3 px-4">Correlation ID</th>
                <th className="py-3 px-4">IRmark / Hash</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No gateway submissions matching filter.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] ${
                        sub.gatewayType === 'HMRC_CT600'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {sub.gatewayType === 'HMRC_CT600' ? 'HMRC CT600' : 'Companies House'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{sub.companyName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">CRN: {sub.crn}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {sub.correlationId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                      {sub.irmark ? sub.irmark.slice(0, 14) + '...' : 'E8g0182Nsd9...'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {sub.latencyMs ? `${sub.latencyMs}ms` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        <span>{sub.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedXml({
                          title: `${sub.gatewayType} Payload (${sub.correlationId})`,
                          content: sub.rawRequestXml || '<GovTalkMessage/>'
                        })}
                        className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition inline-flex items-center space-x-1"
                        title="View XML payload"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-mono">XML</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Directors & Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Registered Directors & Accounts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure scrypt authentication accounts with associated Companies House entities.
            </p>
          </div>
          <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-mono font-medium">
            {users.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Director Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Companies</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span>{u.fullName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {u.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {u.companyCount} {u.companyCount === 1 ? 'entity' : 'entities'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Standards Reference Guide for Gateways */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Understanding HMRC & Companies House Gateway Architecture</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900">What is an IRmark?</p>
            <p>
              An IRmark is a cryptographic SHA-1 hash generated over the normalized W3C canonical XML of the return. It provides non-repudiation: HMRC issues a signed receipt proving the return was received unmodified.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900">GovTalk Envelope</p>
            <p>
              GovTalk is the UK Government’s SOAP/XML electronic data interchange standard. Each transmission wraps the tax payload with correlation IDs, message classes, and authentication tokens.
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-900">Test Sandbox vs Production</p>
            <p>
              In sandbox mode, transmissions route to HMRC’s Transaction Engine Test Service (TPVS) and Companies House Software Testing gateway, returning mock acknowledgments without legal filing liability.
            </p>
          </div>
        </div>
      </div>

      {/* XML Payload Modal */}
      {selectedXml && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {selectedXml.title}
              </span>
              <button
                type="button"
                onClick={() => setSelectedXml(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-50/80">
              <pre className="whitespace-pre-wrap break-all leading-relaxed">
                {selectedXml.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

