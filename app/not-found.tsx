import Link from 'next/link';
import { BarChart3, ArrowRight, Home, Compass } from 'lucide-react';

export const metadata = {
  title: 'Page Not Found',
  description: 'The requested page could not be found on VizPilot.',
};

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 py-24 sm:py-32 overflow-hidden bg-[#08080b] text-white">
      {/* Background ambient lighting */}
      <div 
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[360px] bg-indigo-500/10 blur-[130px] rounded-full"
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-xl w-full text-center space-y-6 sm:space-y-8">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20 border border-indigo-400/30">
            <BarChart3 className="h-3 w-3 text-indigo-400" strokeWidth={2} />
          </div>
          <span className="font-mono text-[11px] font-semibold tracking-widest text-white/70 uppercase">
            VIZPILOT NAVIGATION CORRECTION
          </span>
        </div>

        {/* 404 Large Display */}
        <div>
          <h1 className="font-display text-[clamp(4.5rem,14vw,8rem)] font-extrabold tracking-tighter text-white/90 leading-none">
            4<span className="text-indigo-400">0</span>4
          </h1>
          <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.25em] text-indigo-300 uppercase mt-2">
            SIGNAL LOST ï¿½ ROUTE NOT FOUND
          </p>
        </div>

        <p className="text-xs sm:text-sm md:text-base text-white/60 max-w-md mx-auto leading-relaxed">
          The view, session, or intelligence dataset you are attempting to access does not exist or has been cleared in accordance with Zero-Trace lifecycle protocols.
        </p>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-6 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-all duration-200 shadow-xl shadow-indigo-500/20 active:scale-[0.98] min-h-[44px]"
          >
            <Home className="h-4 w-4" />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/upload"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-6 py-3 text-xs font-mono font-bold tracking-widest text-white uppercase transition-all duration-200 active:scale-[0.98] min-h-[44px]"
          >
            <Compass className="h-4 w-4 text-indigo-400" />
            <span>Open Workspace</span>
            <ArrowRight className="h-3.5 w-3.5 text-white/50" />
          </Link>
        </div>

        {/* Support link */}
        <p className="pt-4 text-xs font-mono text-white/40">
          Need assistance? Reach our engineering team at{' '}
          <a
            href="mailto:hello@vizpilot.ai?subject=VizPilot%20404%20Navigation%20Report"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
          >
            hello@vizpilot.ai
          </a>
        </p>
      </div>
    </div>
  );
}
