import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaxFlow UK | Micro-Entity Statutory Accounts & CT600 Filing',
  description: 'High-assurance UK micro-entity tax filing and compliance platform with 40-point Pre-Flight Rejection Shield.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen text-slate-900 bg-slate-50 antialiased">
        <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-2.5 font-bold text-xl tracking-tight text-white hover:text-sky-400 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-lg shadow-inner">
                  T
                </span>
                <span>TaxFlow <span className="text-sky-400 font-semibold text-sm ml-0.5">UK</span></span>
              </Link>

              <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/filings/drop-logicx/wizard"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Filing Wizard
                </Link>
                <Link
                  href="/filings/drop-logicx/shield"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <span>Pre-Flight Shield</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-1.5 py-0.5 rounded font-mono font-semibold">40 Rules</span>
                </Link>
                <Link
                  href="/filings/drop-logicx/documents"
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Documents & Drafts
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium">2026/27 Rates Active</span>
              </div>
              <div className="bg-sky-600/30 text-sky-300 text-xs px-2.5 py-1 rounded border border-sky-500/30 font-medium">
                CRN: 15152081
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p>© 2026 TaxFlow UK. Built for UK micro-entities under Companies Act 2006 & FRS 105.</p>
            <div className="flex space-x-4">
              <span>HMRC Transaction Engine Standard</span>
              <span>•</span>
              <span>Companies House TIS iXBRL Ready</span>
              <span>•</span>
              <span>W3C C14N Validated</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

