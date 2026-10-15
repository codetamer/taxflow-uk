'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  FileDown,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Code2
} from 'lucide-react';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'ct600' | 'ixbrl'>('accounts');
  const [isWatermarked, setIsWatermarked] = useState<boolean>(true);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <span className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statutory Document Center</h1>
              <p className="text-xs text-slate-500 font-mono">
                DROPLOGICX LTD (CRN: 15152081) — Accounting Period: 01 Oct 2025 to 30 Sep 2026
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Free full on-screen preview and downloadable watermarked drafts of both Full Accounts and CT600 Form before payment.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsWatermarked(!isWatermarked)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center space-x-1.5 ${
              isWatermarked
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <span>Preview Mode:</span>
            <strong>{isWatermarked ? 'Watermarked Draft' : 'Clean Final Copy'}</strong>
          </button>
        </div>
      </div>

      {/* Commercial Model Callout */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border border-sky-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Commercial Assurance Promise</span>
          </p>
          <p className="text-sm text-slate-700">
            Download and inspect all draft documents for free. When you are ready to file directly to Companies House and HMRC, pay just <strong>£49.00 net</strong>.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href={`/api/documents/accounts-pdf?draft=${isWatermarked}`}
            target="_blank"
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Accounts PDF</span>
          </a>
          <a
            href={`/api/documents/ct600-pdf?draft=${isWatermarked}`}
            target="_blank"
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download CT600 PDF</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'accounts'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Full Accounts (FRS 105 PDF)</span>
        </button>

        <button
          onClick={() => setActiveTab('ct600')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'ct600'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>HMRC CT600 Form & CT600A</span>
        </button>

        <button
          onClick={() => setActiveTab('ixbrl')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'ixbrl'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>FRS 105 iXBRL XHTML</span>
        </button>
      </div>

      {/* Tab 1: Full Accounts Preview */}
      {activeTab === 'accounts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 max-w-4xl mx-auto space-y-8 font-serif text-slate-900 relative overflow-hidden">
          {isWatermarked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <span className="text-slate-200/60 font-black text-6xl transform -rotate-45 font-sans tracking-widest">
                DRAFT — FOR REVIEW ONLY
              </span>
            </div>
          )}

          <div className="border-b-2 border-slate-900 pb-4">
            <h2 className="text-2xl font-bold tracking-tight">DROPLOGICX LTD</h2>
            <p className="text-sm font-sans text-slate-500">
              Company Registration Number: 15152081 (England & Wales)
            </p>
            <p className="text-sm font-sans text-slate-500">
              Unaudited Financial Statements for the Period Ended 30 September 2026
            </p>
          </div>

          {/* P&L */}
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Profit and Loss Account
            </h3>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between">
                <span>Turnover</span>
                <span className="font-mono">£100,000</span>
              </div>
              <div className="flex justify-between">
                <span>Cost of sales</span>
                <span className="font-mono">(£20,000)</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                <span>Gross profit</span>
                <span className="font-mono">£80,000</span>
              </div>
              <div className="flex justify-between">
                <span>Other charges (Administrative expenses)</span>
                <span className="font-mono">(£48,100)</span>
              </div>
              <div className="flex justify-between">
                <span>Tax on profit (Corporation Tax provision)</span>
                <span className="font-mono">(£6,061)</span>
              </div>
              <div className="flex justify-between font-black text-base border-t-2 border-slate-900 pt-1">
                <span>Profit for the financial year</span>
                <span className="font-mono">£25,839</span>
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="space-y-4">
            <h3 className="font-sans font-bold text-base text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Statement of Financial Position (Balance Sheet) as at 30 September 2026
            </h3>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between font-bold">
                <span>Fixed assets (Tangible assets)</span>
                <span className="font-mono">£15,000</span>
              </div>
              <div className="text-xs text-slate-500 font-sans uppercase pt-2">Current Assets</div>
              <div className="flex justify-between pl-4">
                <span>Debtors</span>
                <span className="font-mono">£10,000</span>
              </div>
              <div className="flex justify-between pl-4">
                <span>Cash at bank and in hand</span>
                <span className="font-mono">£31,139</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                <span>Total current assets</span>
                <span className="font-mono">£41,139</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Creditors: amounts falling due within one year</span>
                <span className="font-mono">(£25,000)</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                <span>Net current assets</span>
                <span className="font-mono">£16,139</span>
              </div>
              <div className="flex justify-between font-black text-base border-t-2 border-b-2 border-slate-900 py-1.5">
                <span>Total assets less current liabilities (Net Assets)</span>
                <span className="font-mono">£31,139</span>
              </div>

              <div className="text-xs text-slate-500 font-sans uppercase pt-2">Capital and Reserves</div>
              <div className="flex justify-between pl-4">
                <span>Called up share capital</span>
                <span className="font-mono">£100</span>
              </div>
              <div className="flex justify-between pl-4">
                <span>Profit and loss account (Retained earnings)</span>
                <span className="font-mono">£31,039</span>
              </div>
              <div className="flex justify-between font-black text-base border-t-2 border-b-2 border-slate-900 py-1.5">
                <span>Total Shareholders' Funds</span>
                <span className="font-mono">£31,139</span>
              </div>
            </div>
          </div>

          {/* Statutory Statements */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-sans text-slate-600">
            <p className="font-bold text-slate-800">Companies Act 2006 s477 Exemption Declaration:</p>
            <p>For the period ended 30 September 2026 the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to micro-entities.</p>
            <p>These financial statements have been prepared in accordance with the micro-entity provisions and in accordance with FRS 105.</p>
            <p className="font-semibold text-slate-800 pt-1">Approved by the board on 15 October 2026 and signed by Muhammad Saif Raza, Director.</p>
          </div>
        </div>
      )}

      {/* Tab 2: HMRC CT600 Form Preview */}
      {activeTab === 'ct600' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 max-w-4xl mx-auto space-y-8 relative overflow-hidden font-sans">
          {isWatermarked && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
              <span className="text-slate-200/60 font-black text-6xl transform -rotate-45 tracking-widest">
                DRAFT — NOT FOR FILING
              </span>
            </div>
          )}

          <div className="bg-emerald-800 text-white p-4 rounded-xl flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">HMRC CT600 (2026/27) Company Tax Return</h2>
              <p className="text-xs text-emerald-200">HM Revenue & Customs Official Return</p>
            </div>
            <span className="bg-emerald-700/80 text-white font-mono text-xs px-2.5 py-1 rounded">
              UTR: 1234567890
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-5 py-3 font-bold text-xs uppercase tracking-wider text-slate-700">
              Chargeable Profits & Tax Calculation Boxes
            </div>

            <div className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 145</span>
                <span>Turnover / gross operating revenue</span>
              </div>
              <span className="font-mono font-bold">£100,000.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 155</span>
                <span>Trading profits before capital allowances</span>
              </div>
              <span className="font-mono font-bold">£31,900.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 235</span>
                <span>Total Taxable Profits</span>
              </div>
              <span className="font-mono font-bold text-emerald-700">£31,900.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 315</span>
                <span>Profits chargeable at Small Profits Rate (19%)</span>
              </div>
              <span className="font-mono font-bold">£31,900.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-sm bg-emerald-50/50">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs font-bold text-emerald-900">Box 440</span>
                <span className="font-bold text-emerald-900">Corporation Tax Chargeable</span>
              </div>
              <span className="font-mono font-black text-lg text-emerald-700">£6,061.00</span>
            </div>

            <div className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <span className="font-mono bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-xs font-bold text-slate-800">Box 510</span>
                <span>Statutory Payment Due Date</span>
              </div>
              <span className="font-mono font-bold">01 July 2027</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: iXBRL XHTML Markup */}
      {activeTab === 'ixbrl' && (
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto space-y-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <span>FRS 105 Inline XBRL (iXBRL) Payload — 32 Semantic Tags Embedded</span>
            <a
              href="/api/documents/ixbrl?draft=false"
              target="_blank"
              className="text-sky-400 hover:text-sky-300 underline font-semibold"
            >
              Open Full XML in New Tab
            </a>
          </div>
          <pre className="text-slate-300 leading-relaxed">
{`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
      xmlns:uk-gaap="http://www.xbrl.org/uk/fr/gaap/core/2019-01-01"
      xmlns:uk-direp="http://xbrl.frc.org.uk/reports/2019-01-01/direp"
      xmlns:frs-105="http://xbrl.frc.org.uk/frs/105/2019-01-01">
  <head>
    <title>DROPLOGICX LTD - Statutory Accounts</title>
  </head>
  <body>
    <!-- P&L Tags -->
    <ix:nonFraction name="uk-gaap:TurnoverGrossOperatingRevenue" unitRef="GBP" decimals="0" contextRef="ctx_current_period">100000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CostSales" unitRef="GBP" decimals="0" contextRef="ctx_current_period">20000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:OtherOperatingChargesExpenses" unitRef="GBP" decimals="0" contextRef="ctx_current_period">48100</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:TaxTaxCreditOnProfitOrLossOnOrdinaryActivities" unitRef="GBP" decimals="0" contextRef="ctx_current_period">6061</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossForPeriod" unitRef="GBP" decimals="0" contextRef="ctx_current_period">25839</ix:nonFraction>

    <!-- Balance Sheet Tags -->
    <ix:nonFraction name="uk-gaap:PropertyPlantEquipment" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">15000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:Debtors" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">10000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CashBankOnHand" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">31139</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">25000</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ShareholderFunds" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">31139</ix:nonFraction>
    <ix:nonFraction name="uk-gaap:ProfitLossAccountReserve" unitRef="GBP" decimals="0" contextRef="ctx_current_instant">31039</ix:nonFraction>

    <!-- Disclosures -->
    <ix:nonNumeric name="uk-direp:DateApprovalAccounts" contextRef="ctx_current_instant">2026-10-15</ix:nonNumeric>
    <ix:nonNumeric name="uk-direp:NameEntityOfficer" contextRef="ctx_current_instant">Muhammad Saif Raza</ix:nonNumeric>
  </body>
</html>`}
          </pre>
        </div>
      )}
    </div>
  );
}

