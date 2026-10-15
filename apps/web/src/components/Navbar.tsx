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

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard'
    },
    {
      label: 'Filing Wizard',
      href: '/filings/drop-logicx/wizard',
      icon: Calculator,
      active: pathname.includes('/wizard')
    },
    {
      label: 'Pre-Flight Shield',
      href: '/filings/drop-logicx/shield',
      icon: ShieldCheck,
      badge: '40/40',
      active: pathname.includes('/shield')
    },
    {
      label: 'Documents',
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
                    <span className="ml-1 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Auth Status & Mobile Menu Toggle */}
        <div className="flex items-center space-x-3">
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
          </nav>

          <div className="pt-3 border-t border-stone-800">
            <HeaderAuthStatus />
          </div>
        </div>
      )}
    </header>
  );
}
