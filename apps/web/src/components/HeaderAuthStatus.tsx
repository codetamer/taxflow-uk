'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

export function HeaderAuthStatus() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; fullName: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/auth/login';
    } catch {
      // ignore
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('#user-profile-menu')) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="w-16 h-7 bg-slate-800/40 rounded-lg animate-pulse" />;
  }

  if (user) {
    return (
      <div className="relative text-xs" id="user-profile-menu">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-700 transition"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold hidden sm:inline">{user.fullName.split(' ')[0]}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-4 py-2.5 border-b border-slate-800">
              <p className="font-bold text-white text-sm truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">Director • DROPLOGICX LTD</p>
            </div>

            <div className="py-1">
              <Link
                href="/filings/drop-logicx/wizard"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition"
              >
                <span>Active Return (15152081)</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">Ready</span>
              </Link>

              <Link
                href="/filings/drop-logicx/shield"
                onClick={() => setIsDropdownOpen(false)}
                className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition"
              >
                <span>Pre-Flight Diagnostic Shield</span>
                <span className="text-[10px] font-mono text-slate-400">40 checks</span>
              </Link>
            </div>

            {user.role === 'ADMIN' && (
              <>
                <div className="my-1 border-t border-slate-800" />
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Internal / Telemetry
                </div>
                <Link
                  href="/admin"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-800 text-emerald-300 font-semibold flex items-center justify-between transition"
                >
                  <span className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Gateway Admin Cockpit</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Live</span>
                </Link>
              </>
            )}

            <div className="my-1 border-t border-slate-800" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center space-x-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs font-semibold">
      <Link
        href="/auth/login"
        className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3.5 py-1.5 rounded-lg transition shadow-xs"
      >
        Register
      </Link>
    </div>
  );
}

