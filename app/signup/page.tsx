'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { cn } from '@/src/lib/utils/cn';
import { getSafeRedirectUrl } from '@/src/lib/auth/redirect';
import { useAuth } from '@/src/lib/auth/context';
import { clearZeroTraceClientState } from '@/src/lib/client/zero-trace-cleanup';

function getStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'WEAK', 'FAIR', 'SOLID', 'ENTERPRISE GRADE'];
const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-400', 'bg-emerald-400'];

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next');
  const safeNext = getSafeRedirectUrl(rawNext, '/upload');
  const { user, loading: authLoading, setUser, setWorkspace } = useAuth();

  const reduced = useReducedMotion();
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(password);

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
    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Account creation failed. Please check your details.');
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
      setError(err instanceof Error ? err.message : 'Network error during registration.');
      setLoading(false);
    }
  };

  const inputCls = cn(
    'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white',
    'placeholder:text-white/30 outline-none font-mono',
    'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all'
  );

  return (
    <div className="relative min-h-screen pt-24 pb-16 bg-[#08080b] text-white flex items-center justify-center overflow-hidden">
      
      {/* Background Parallax Typography */}
      <div className="absolute top-[12%] left-0 right-0 z-0">
        <ParallaxText direction="rtl" velocity={90} outline={true}>
          NEW WORKSPACE · REGISTRATION
        </ParallaxText>
      </div>

      <div className="relative z-10 w-full max-w-4xl px-4 sm:px-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
        
        {/* Left Col: Cinematic Brand & Features (5 Cols) */}
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
              COMMENCE YOUR<br />
              <span className="text-white/40">ANALYTICS.</span>
            </h1>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/60 leading-relaxed font-mono">
              Join leading quantitative analysts and business operators using autonomous visualization.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-2.5 text-xs font-mono text-white/60">
            {['Zero credit card required', 'Immediate Zero-Trace protection', 'Multi-format ingest (CSV, XLSX, PDF)'].map((feat) => (
              <div key={feat} className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Registration Form (7 Cols) */}
        <motion.div
          className="md:col-span-7 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-5 sm:p-7 md:p-10 shadow-2xl relative"
          initial={reduced ? undefined : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6">
            <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-1">
              NEW ACCOUNT
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight text-white uppercase">
              Create Enterprise Access
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Sarah Chen"
                autoComplete="name"
              />
            </div>

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
                placeholder="sarah@firm.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="password">
                Secret Key / Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(inputCls, 'pr-12')}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
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

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          strength >= step ? STRENGTH_COLORS[strength] : 'bg-white/10'
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-white/40 uppercase tracking-widest">
                    <span>STRENGTH: {STRENGTH_LABELS[strength]}</span>
                    <span>8+ CHARS</span>
                  </div>
                </div>
              )}
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
                <span>INITIALIZING ACCESS…</span>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs font-mono text-white/50">
            <span>Already registered? </span>
            <Link
              href={rawNext ? `/login?next=${encodeURIComponent(rawNext)}` : '/login'}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4"
            >
              Sign in to Portal
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080b]" />}>
      <SignupContent />
    </Suspense>
  );
}
