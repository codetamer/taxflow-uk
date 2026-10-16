'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { TaxFlowLogo } from '@/components/TaxFlowLogo';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password.');
        setIsLoading(false);
        return;
      }

      window.location.href = redirectPath;
    } catch {
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header Monogram & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <TaxFlowLogo variant="icon-only" theme="light" size={48} />
          <h1 className="text-2xl font-bold tracking-tight text-stone-950">
            Sign In to Compliance Studio
          </h1>
          <p className="text-xs text-stone-500">
            Access your statutory FRS 105 accounts and HMRC CT600 filings
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reviewer Quick Access Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Reviewer Mode Active</span>
          </div>
          <p className="text-xs text-stone-600">
            Authentication is bypassed for inspection. You can enter the dashboard and all filings directly.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            <span>Enter Studio Without Sign In →</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Director Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="director@company.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-slate-400">Encrypted with scrypt</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-950 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold py-3 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins Pill */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block text-center">
              One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('saif@droplogicx.com', 'Password123!')}
                className="bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 text-left p-2.5 rounded-xl text-[11px] font-medium transition"
              >
                <div className="font-bold text-stone-900 flex items-center space-x-1">
                  <Building2 className="w-3 h-3 text-amber-600" />
                  <span>Director Demo</span>
                </div>
                <div className="text-[10px] text-stone-500 truncate">saif@droplogicx.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@taxflow.co.uk', 'AdminPass2026!')}
                className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-left p-2.5 rounded-xl text-[11px] font-medium transition"
              >
                <div className="font-bold text-slate-900 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  <span>Admin Demo</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">admin@taxflow.co.uk</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link to Signup */}
        <div className="text-center text-xs text-slate-500">
          <span>Don't have an account yet? </span>
          <Link href="/auth/signup" className="font-semibold text-slate-950 hover:text-emerald-700 underline">
            Register your company →
          </Link>
        </div>
      </div>
    </div>
  );
}
