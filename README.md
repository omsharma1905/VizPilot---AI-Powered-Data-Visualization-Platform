# VizPilot — Cinematic Data Visualization & Intelligence

<p align="center">
  <img src="public/icon.svg" alt="VizPilot Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>Turn unformatted business data into cinematic, interactive visualizations and analytical dashboards.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Apache_ECharts-6.1-red?logo=apacheecharts" alt="ECharts" />
</p>

---

## 🌟 Overview

**VizPilot** is a full-stack data intelligence and visualization application designed for executives, analysts, and operators. Upload structured files in any common format and VizPilot automatically inspects columns, infers statistical relationships, recommends optimal visualization structures, and generates interactive charts with a cinematic dark aesthetic.

---

## 🚀 Key Features

- **Multi-Format Ingestion Pipeline**:
  - Support for **CSV**, **XLSX** (multi-sheet), **PDF tables**, and **DOCX** files.
  - Robust inference for numeric, categorical, temporal, boolean, and currency data.
- **Automated Data Profiling Engine**:
  - Automatic identification of primary keys, continuous distributions, discrete dimensions, and temporal trends.
  - Calculation of cardinality, missing values, quartiles, and statistical anomalies.
- **Smart Chart Recommendation**:
  - Heuristic scoring combined with optional LLM ranking (via Groq).
  - Automatically identifies primary representations and valid alternatives.
- **11 Production Chart Types**:
  - Powered by **Apache ECharts**: Bar, Horizontal Bar, Grouped Bar, Stacked Bar, Line, Area, Scatter, Pie, Donut, Histogram, and KPI Metric Cards.
- **Dual Processing Modes**:
  - **Zero-Trace Mode**: Data is processed in volatile client/server memory with zero database persistence for privacy-conscious workflows.
  - **Workspace Mode**: Persistent dashboards, datasets, and visualizations saved securely in MongoDB Atlas.
- **Enterprise Authentication & Account Settings**:
  - Secure session management with HTTP-only cookies and bcrypt hashing.
  - Real HMAC-SHA256 email verification flow with rate limiting and attempt invalidation.
  - Multi-step email change and password update with automatic remote session revocation.
- **Cinematic UI/UX**:
  - Deep space dark theme with smooth Framer Motion transitions, custom cursor, and responsive mobile layout.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Visualizations**: [Apache ECharts](https://echarts.apache.org/) (`echarts-for-react`)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Official MongoDB Node.js Driver)
- **Data Parsers**: `papaparse`, `xlsx`, `pdf-parse`, `mammoth`
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 📦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20.x or higher
- [npm](https://www.npmjs.com/) v10.x or higher
- A MongoDB connection string (MongoDB Atlas or local instance)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/vizpilot.git
   cd vizpilot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and configure your credentials:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=vizpilot
   SESSION_SECRET=your-random-32-char-entropy-key
   GROQ_API_KEY=your-optional-groq-api-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

VizPilot contains comprehensive automated test suites covering all core layers:

```bash
# Ingestion pipeline tests (CSV, XLSX, PDF, DOCX)
npm run test

# Data profiling & statistical analysis tests
npm run test:profiling

# Chart recommendation engine tests
npm run test:recommendation

# Chart rendering & options generation tests
npm run test:visualization

# Data isolation & Zero-Trace security tests
npm run test:security

# Authentication & session database tests
npm run test:auth

# Navigation & auth UI state tests
npm run test:auth-ui

# Profile, account settings & verification tests
npm run test:profile

# End-to-end integration test suite
npm run test:e2e
```

### Production Build Verification

```bash
# Type check without emitting files
npx tsc --noEmit

# Production build
npm run build
```

---

## 🛡 Security & Privacy

- **No Plaintext Secrets**: Passwords hashed with bcrypt (cost factor 12); email verification codes hashed with HMAC-SHA256.
- **Zero-Trace Architecture**: Datasets processed under Zero-Trace mode never touch disk or database collections.
- **Session Security**: 256-bit cryptographically secure session tokens stored with HTTP-only, SameSite Lax, and Secure flags.

---

## 📄 License

This project is private and proprietary. All rights reserved.
