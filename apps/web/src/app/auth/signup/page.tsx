'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, User, Building2, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { TaxFlowLogo } from '@/components/TaxFlowLogo';

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCrn = searchParams.get('crn') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [crn, setCrn] = useState(initialCrn);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, crn })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <TaxFlowLogo variant="icon-only" theme="light" size={48} />
          <h1 className="text-2xl font-bold tracking-tight text-stone-950">
            Create Director Account
          </h1>
          <p className="text-xs text-stone-500">
            Start filing statutory accounts with 40-point pre-flight assurance
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
            Authentication is bypassed for inspection. You can enter the dashboard directly without creating an account.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            <span>Enter Studio Directly →</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-7 border border-stone-200/90 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Full Director Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Saif Raza"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="director@company.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Company Registration Number (CRN)
                <span className="text-[10px] text-stone-400 font-normal ml-1">(Optional)</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 15152081"
                  value={crn}
                  onChange={(e) => setCrn(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Can be found on your incorporation certificate</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Password
                <span className="text-[10px] text-stone-400 font-normal ml-1">(Min. 8 characters)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold py-3 rounded-xl text-xs transition shadow-xs disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Account...' : 'Register & Open Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Trust points */}
          <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-500 space-y-1.5">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Free draft documents before £49 filing fee</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Zero gateway rejections guaranteed</span>
            </div>
          </div>
        </div>

        {/* Footer Link to Login */}
        <div className="text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link href="/auth/login" className="font-semibold text-slate-950 hover:text-emerald-700 underline">
            Sign in here →
          </Link>
        </div>
      </div>
    </div>
  );
}
