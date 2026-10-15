# TaxFlow UK 🇬🇧

> **Autonomous Micro-Entity Financial Statements (FRS 105) & CT600 Corporate Tax Filing Platform**  
> *Crafted with precision, high-assurance tax computation algorithms, and real-time Companies House intelligence.*

[![CI & Test Suite](https://github.com/codetamer/taxflow-uk/actions/workflows/ci.yml/badge.svg)](https://github.com/codetamer/taxflow-uk/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL--Mode-003B57?logo=sqlite)](https://sqlite.org/)

---

## 🌟 Overview

**TaxFlow UK** is a full-stack corporate tax automation suite engineered specifically for UK small and micro-entity businesses. It bridges the gap between raw accounting records and statutory UK government filings, producing legally binding FRS 105 balance sheets, CT600 Corporation Tax calculations, and comprehensive risk audits in minutes.

---

## 🎨 Brand Identity & Theme

- **Palette**: **Sunset Boulevard** — Warm Terracotta (`#C2410C` / `#EA580C`), Radiant Amber Gold (`#F59E0B` / `#D97706`), deep espresso stone (`#1C1917`), and warm card surfaces.
- **Insignia**: **The Ledger Chevron & Ascending Pillar (Concept 5)** — Stylized dual-pillar geometric crest representing ascending business equity, statutory security, and balanced financial flow.

---

## 🚀 Key Features

1. **Companies House Real-Time Intelligence**:
   - Zero-delay debounced CRN autocomplete & company search.
   - Live director registry sync, statutory filing due date monitoring, and accounts classification.

2. **Autonomous CT600 Tax Computation**:
   - Statutory 2026/2027 tiered rate schedule:
     - Small profits rate (19% up to £50,000)
     - Marginal relief calculations (£50,000 – £250,000 with 3/200 standard fraction)
     - Main rate (25% above £250,000)
   - Capital allowances calculation: AIA 100%, 18% main pool writing-down allowance, and full expensing adjustments.
   - Disallowable expenses add-back auditing (client entertainment, fines, depreciation).

3. **FRS 105 Micro-Entity Balance Sheet Engine**:
   - Automated double-entry balance validation (`Net Assets === Total Equity`).
   - Statutory notes generation, directors' approval statements, and Companies Act 2006 compliance declarations.

4. **TaxFlow Shield — Automated Risk Audit**:
   - Real-time statutory violation detection before submission.
   - Categorized high/medium risk checks with one-click remediation guidance.

5. **Vector & PDF Document Generation**:
   - Pixel-perfect statutory accounts and CT600 summary sheets stamped with official brand insignia.
   - Built with high-performance vector rendering.

6. **Plain English Tax Glossary**:
   - Interactive term explainer modals demystifying UK tax jargon (AIA, marginal relief, disallowable expenditure, FRS 105) for business owners.

---

## 🏗 Architecture & Workspaces

The platform is organized as a clean TypeScript monorepo:

```
taxflow-uk/
├── apps/
│   └── web/                   # Next.js 15 App Router web application
│       ├── src/app/           # Auth, Dashboard, Wizard, Shield, Documents, Glossary, Admin
│       ├── src/components/    # Reusable UI components & TaxFlow logo
│       └── src/lib/           # Session management & authentication
├── packages/
│   ├── ct-engine/             # CT600 corporation tax computation algorithms
│   ├── doc-engine/            # FRS 105 & CT600 statutory PDF generators
│   ├── shield/                # Regulatory audit & compliance rule engine
│   ├── companies-house/       # Companies House REST API client & mock services
│   ├── ingestion/             # Trial balance, CSV, and financial data parsers
│   └── db/                    # Native SQLite repository layer with WAL mode
└── .github/workflows/         # CI/CD automated test & build pipeline
```

---

## 🧪 Testing & Verification

The codebase includes an exhaustive test suite covering all calculation engines, API integrations, and database operations:

```bash
# Run all workspace test suites (80 / 80 tests passing)
npm test
```

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/codetamer/taxflow-uk.git
cd taxflow-uk

# Install dependencies across all monorepo workspaces
npm install

# Build all packages and web app
npm run build

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Data Privacy

- Passwords hashed with `bcryptjs` (salt rounds: 12).
- HTTP-only, secure, `SameSite=Lax` session cookies.
- Environment variables and database artifacts strictly git-ignored.
- Native SQLite with Write-Ahead Logging (WAL) for atomic transactions.

---

## 📜 License

Private & Proprietary © 2026 TaxFlow UK. All rights reserved.
