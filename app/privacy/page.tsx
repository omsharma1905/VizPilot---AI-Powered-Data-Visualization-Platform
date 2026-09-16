import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero-Trace Architecture',
  description: 'VizPilot Zero-Trace privacy policy. Learn how our ephemeral data pipeline processes business data entirely client-side and in transient memory.',
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-[#08080b] text-white pt-28 sm:pt-36 pb-20 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>BACK TO HOME</span>
        </Link>

        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-mono font-semibold tracking-wider text-indigo-400 uppercase">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ZERO-TRACE PRIVACY PROTOCOL</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white uppercase">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm font-mono text-white/50">
            LAST REVISED: SEPTEMBER 2026 ï¿½ VIZPILOT CORE SYSTEM
          </p>
        </div>

        {/* Zero-Trace Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
            <Lock className="h-5 w-5 text-indigo-400" />
            <h2 className="font-display text-base font-bold text-white">Ephemeral Ingestion</h2>
            <p className="text-xs text-white/60 font-mono leading-relaxed">
              Your raw CSV, XLSX, PDF, and DOCX files are parsed in memory. Raw documents are never permanently stored.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h2 className="font-display text-base font-bold text-white">No Model Training</h2>
            <p className="text-xs text-white/60 font-mono leading-relaxed">
              Your enterprise figures, confidential metrics, and proprietary records are never used to train machine learning models.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-2">
            <EyeOff className="h-5 w-5 text-indigo-400" />
            <h2 className="font-display text-base font-bold text-white">Encrypted Workspace</h2>
            <p className="text-xs text-white/60 font-mono leading-relaxed">
              Workspace sessions and user credentials use salted argon2/scrypt hashing with TLS 1.3 transport security.
            </p>
          </div>
        </div>

        {/* Body sections */}
        <div className="space-y-8 text-sm text-white/70 leading-relaxed font-sans border-t border-white/10 pt-8">
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              1. Our Data Commitment
            </h2>
            <p>
              VizPilot is engineered from the foundation up with a zero-retention philosophy for proprietary business data. When you ingest data through VizPilot, the system extracts statistical metadata (such as schema, column types, cardinalities, and value distributions) strictly to calculate visual recommendations and render interactive charts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              2. Account Information
            </h2>
            <p>
              For registered accounts, we store only your name, corporate email address, and cryptographic password hash. We use secure HTTP-only cookies to maintain your authenticated session. You can request account deletion at any time by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              3. Telemetry & Analytics
            </h2>
            <p>
              VizPilot does not utilize third-party trackers or ad networks. Operational telemetry is restricted to runtime error logs and performance metrics required to guarantee uptime and sub-40ms edge rendering latency.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
              4. Contact & Compliance
            </h2>
            <p>
              For data protection inquiries or to exercise your GDPR/CCPA rights, reach our data privacy officer directly at{' '}
              <a
                href="mailto:privacy@vizpilot.ai?subject=VizPilot%20Privacy%20Inquiry"
                className="text-indigo-400 hover:text-indigo-300 font-mono underline underline-offset-2"
              >
                privacy@vizpilot.ai
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
