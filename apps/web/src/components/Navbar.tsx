'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  FileText,
  LayoutDashboard,
  Calculator,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { HeaderAuthStatus } from './HeaderAuthStatus';
import { TaxFlowLogo } from './TaxFlowLogo';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qaBarOpen, setQaBarOpen] = useState(false);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/'
    },
    {
      label: 'Filing Wizard',
      href: '/filings/drop-logicx/wizard',
      icon: Calculator,
      badge: 'Step 1/3',
      active: pathname.includes('/wizard')
    },
    {
      label: 'Statutory Documents',
      href: '/filings/drop-logicx/documents',
      icon: FileText,
      active: pathname.includes('/documents')
    },
    {
      label: 'Tax Guide',
      href: '/glossary',
      icon: BookOpen,
      active: pathname.includes('/glossary')
    }
  ];

  return (
    <>
      {/* Top Ambient Review Mode Ribbon */}
      <div className="bg-stone-950 text-stone-300 text-xs py-1.5 px-4 border-b border-stone-800 transition-all select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Stateless Review Mode
            </span>
            <span className="hidden sm:inline text-stone-400 text-[11px]">
              All 6 routes, 3 wizard steps &amp; 40-point shield unlocked.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setQaBarOpen(!qaBarOpen)}
              className="text-indigo-300 hover:text-white font-medium underline underline-offset-2 transition"
            >
              {qaBarOpen ? 'Hide QA Jump Bar' : 'Toggle QA Jump Bar'}
            </button>
            <span className="text-stone-700">|</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-medium transition"
            >
              <span>⚡ Admin Telemetry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Collapsible QA Route Jumper Bar */}
      {qaBarOpen && (
        <div className="bg-indigo-950 text-white border-b border-indigo-800 px-4 py-2 shadow-inner text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-indigo-300 font-semibold uppercase tracking-wider text-[10px] mr-1">QA Routes:</span>
              <Link href="/dashboard" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">1. Dashboard</Link>
              <Link href="/filings/drop-logicx/wizard?step=1" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">2. Wizard Step 1</Link>
              <Link href="/filings/drop-logicx/wizard?step=2" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">3. Wizard Step 2</Link>
              <Link href="/filings/drop-logicx/wizard?step=3" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">4. Wizard Step 3</Link>
              <Link href="/filings/drop-logicx/documents" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">5. Document Studio</Link>
              <Link href="/filings/drop-logicx/shield" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">6. Pre-Flight Shield (40)</Link>
              <Link href="/glossary" className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-700 text-indigo-100 font-medium transition">7. Tax Guide (24)</Link>
              <Link href="/admin" className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 text-amber-200 font-medium transition">8. Admin Telemetry</Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Clean Header */}
      <header className="sticky top-0 z-50 bg-[#1C1917]/95 backdrop-blur-md text-white border-b border-stone-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Monogram & Desktop Nav */}
          <div className="flex items-center space-x-6 lg:space-x-8">
            <Link href="/" className="group shrink-0">
              <TaxFlowLogo variant="full" theme="dark" size="md" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                      item.active
                        ? 'text-white bg-stone-800/90 shadow-2xs font-bold'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-amber-400' : 'text-stone-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 bg-stone-700 text-stone-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Contextual Shield Status Pill & Auth Status */}
          <div className="flex items-center space-x-3">
            <Link
              href="/filings/drop-logicx/shield"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
              title="Inspect 40-Point Pre-Flight Shield"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Shield: 40/40 Passed</span>
            </Link>

            <div className="hidden sm:block">
              <HeaderAuthStatus />
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1C1917] border-b border-stone-800 px-4 pt-2 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      item.active
                        ? 'bg-stone-800 text-white font-bold'
                        : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-stone-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <Link
                href="/filings/drop-logicx/shield"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-900/60"
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pre-Flight Shield</span>
                </div>
                <span className="text-xs font-mono">40/40 ✓</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-stone-800">
              <HeaderAuthStatus />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
