'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, ArrowRight, Activity } from 'lucide-react';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { cn } from '@/src/lib/utils/cn';
import { getSafeRedirectUrl } from '@/src/lib/auth/redirect';
import { useAuth } from '@/src/lib/auth/context';
import { clearZeroTraceClientState } from '@/src/lib/client/zero-trace-cleanup';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next');
  const safeNext = getSafeRedirectUrl(rawNext, '/upload');
  const { user, loading: authLoading, setUser, setWorkspace } = useAuth();

  const reduced = useReducedMotion();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sensible behavior: redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.replace(safeNext);
    }
  }, [user, authLoading, safeNext, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!email || !password) {
      setError('Please provide your corporate credentials.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Purge any stale client state from previous session before establishing new user
      clearZeroTraceClientState();
      setUser(data.user);
      setWorkspace(data.workspace || null);

      router.push(safeNext);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error during login.');
      setLoading(false);
    }
  };

  const inputCls = cn(
    'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white',
    'placeholder:text-white/30 outline-none font-mono',
    'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all'
  );

  return (
    <div className="relative min-h-screen pt-24 pb-16 bg-[#08080b] text-white flex items-center justify-center overflow-hidden">
      
      {/* Background Parallax Typography */}
      <div className="absolute top-[15%] left-0 right-0 z-0">
        <ParallaxText direction="ltr" velocity={90} outline={true}>
          SECURE ACCESS · AUTHENTICATION
        </ParallaxText>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
        
        {/* Left Col: Cinematic Brand & Metadata (5 Cols) */}
        <div className="md:col-span-5 space-y-4 sm:space-y-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-400/30">
              <BarChart3 className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
            </div>
            <span className="font-display text-lg font-bold tracking-wider text-white">
              VIZ<span className="text-indigo-400">PILOT</span>
            </span>
          </Link>

          <div>
            <h1 className="font-display text-[clamp(1.75rem,3.8vw,2.75rem)] font-extrabold uppercase tracking-tight text-white leading-tight">
              ACCESS YOUR<br />
              <span className="text-white/40">INTELLIGENCE.</span>
            </h1>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 leading-relaxed font-mono">
              Return to your persistent visualization sessions or launch a zero-trace ephemeral pipeline.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 sm:p-4 space-y-1.5 sm:space-y-2 text-xs font-mono text-white/50">
            <div className="flex items-center gap-2 text-indigo-400">
              <Activity className="h-3.5 w-3.5" />
              <span>TLS 1.3 CLIENT VERIFIED</span>
            </div>
            <p className="text-[11px] text-white/40">
              All credentials authenticated ephemerally with zero credential leak.
            </p>
          </div>
        </div>

        {/* Right Col: Glassmorphism Login Form (7 Cols) */}
        <motion.div
          className="md:col-span-7 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-5 sm:p-7 md:p-10 shadow-2xl relative"
          initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-1">
              PORTAL LOGIN
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight text-white uppercase">
              Sign in to VizPilot
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="email">
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="analyst@enterprise.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-semibold text-white/60 uppercase" htmlFor="password">
                  Password
                </label>
                <a href="mailto:support@vizpilot.ai?subject=VizPilot%20Password%20Reset%20Request" className="text-[11px] font-mono text-indigo-400 hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputCls, 'pr-12')}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 py-3.5 text-xs font-mono font-bold tracking-widest uppercase transition-all duration-300 shadow-xl shadow-indigo-500/20 mt-4 cursor-pointer"
            >
              {loading ? (
                <span>AUTHENTICATING…</span>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs font-mono text-white/50">
            <span>No account yet? </span>
            <Link
              href={rawNext ? `/signup?next=${encodeURIComponent(rawNext)}` : '/signup'}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4"
            >
              Register Enterprise Access
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080b]" />}>
      <LoginContent />
    </Suspense>
  );
}
