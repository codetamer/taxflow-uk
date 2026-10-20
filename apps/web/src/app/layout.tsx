import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { TaxFlowLogo } from '../components/TaxFlowLogo';

export const metadata: Metadata = {
  title: 'TaxFlow UK | Annual Accounts (FRS 105) & CT600 Tax Filing',
  description: 'The high-assurance UK micro-entity tax filing and compliance platform with 40-Point Pre-Flight Rejection Shield.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen text-stone-900 bg-[#FAF9F6] antialiased">
        {/* Sovereign Header */}
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-white border-t border-stone-200/80 py-10 text-xs text-stone-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
              <div className="space-y-2">
                <TaxFlowLogo variant="compact" theme="light" size="sm" />
                <p className="text-stone-500 text-xs max-w-md">
                  High-Assurance UK Micro-Entity Annual Accounts (FRS 105) &amp; HMRC CT600 Corporate Tax Returns.
                </p>
              </div>

              {/* Fast Links */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-stone-700">
                <Link href="/" className="hover:text-amber-800 transition">
                  Tax Simulator
                </Link>
                <Link href="/glossary" className="hover:text-amber-800 transition">
                  Tax Guide
                </Link>
                <Link href="/dashboard" className="hover:text-amber-800 transition">
                  Director Dashboard
                </Link>
                <Link href="/filings/drop-logicx/wizard" className="hover:text-amber-800 transition">
                  Filing Studio
                </Link>
                <Link href="/filings/drop-logicx/shield" className="hover:text-amber-800 transition">
                  Pre-Flight Radar
                </Link>
                <Link href="/filings/drop-logicx/documents" className="hover:text-amber-800 transition">
                  Document Center
                </Link>
                <Link href="/admin" className="text-stone-400 hover:text-stone-800 transition">
                  Admin Telemetry
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
              <p>
                © 2026 TaxFlow UK. All tax calculations certified under Finance Act 2024 and Companies Act 2006.
              </p>
              <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                <span>HMRC IRmark Digest</span>
                <span>•</span>
                <span>Companies House iXBRL Gateway</span>
                <span>•</span>
                <span>W3C C14N Canonicalization</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
