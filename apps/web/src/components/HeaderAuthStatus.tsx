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

  if (isLoading) {
    return <div className="w-16 h-7 bg-slate-800/40 rounded-lg animate-pulse" />;
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-semibold hover:bg-amber-500/30 transition flex items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Cockpit</span>
          </Link>
        )}

        <div className="hidden sm:flex items-center space-x-2 bg-stone-800/80 text-stone-200 px-3 py-1.5 rounded-xl border border-stone-700">
          <div className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px]">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold">{user.fullName.split(' ')[0]}</span>
        </div>

        <button
          onClick={handleLogout}
          title="Sign out of account"
          className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs font-semibold">
      <Link
        href="/auth/login"
        className="text-stone-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold px-3.5 py-1.5 rounded-lg transition shadow-xs"
      >
        Register
      </Link>
    </div>
  );
}

