'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Building2,
  Check,
  X,
  ChevronRight,
  Database
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth/context';
import { useProtectedRoute } from '@/src/lib/auth/useProtectedRoute';
import { getUserInitials } from '@/src/lib/auth/utils';
import { ParallaxText } from '@/src/components/cinematic/ParallaxText';
import { cn } from '@/src/lib/utils/cn';

export default function ProfilePage() {
  useProtectedRoute('/profile');
  const { user, workspace, setUser } = useAuth();

  // Name Edit State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);

  // Email Verification State (for current email)
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);

  // Email Change State
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [changeEmailStep, setChangeEmailStep] = useState<1 | 2>(1);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [changePasswordInput, setChangePasswordInput] = useState('');
  const [showChangePw, setShowChangePw] = useState(false);
  const [changeEmailCode, setChangeEmailCode] = useState('');
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const [changeEmailSuccess, setChangeEmailSuccess] = useState<string | null>(null);
  const [changeEmailCooldown, setChangeEmailCooldown] = useState(0);

  // Password Change State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Initialize name input from user
  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  // Cooldown timer tick
  useEffect(() => {
    if (sendCooldown <= 0) return;
    const timer = setInterval(() => {
      setSendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [sendCooldown]);

  // Email change cooldown timer tick
  useEffect(() => {
    if (changeEmailCooldown <= 0) return;
    const timer = setInterval(() => {
      setChangeEmailCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [changeEmailCooldown]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#08080b] flex items-center justify-center text-white">
        <div className="flex items-center gap-3 font-mono text-xs text-white/50">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>LOADING PROFILE SESSION...</span>
        </div>
      </div>
    );
  }

  const initials = getUserInitials(user.name);
  const isVerified = Boolean(user.emailVerifiedAt);

  // 1. Handle Name Update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(null);

    const clean = nameInput.trim();
    if (clean.length < 2 || clean.length > 60) {
      setNameError('Full name must be between 2 and 60 characters.');
      return;
    }

    setNameLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setNameError(data.error?.message || 'Failed to update name.');
        setNameLoading(false);
        return;
      }

      setUser(data.user);
      setNameSuccess(data.message || 'Your name has been updated.');
      setIsEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Network error updating name.');
    } finally {
      setNameLoading(false);
    }
  };

  // 2. Handle Send Verification Code for Current Email
  const handleSendVerificationCode = async () => {
    setVerifyError(null);
    setVerifySuccess(null);
    setVerifyLoading(true);

    try {
      const res = await fetch('/api/profile/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVerifyError(data.error?.message || 'Failed to send verification code.');
        setVerifyLoading(false);
        return;
      }

      setCodeSent(true);
      setSendCooldown(60);
      setVerifySuccess(data.message || 'Verification code sent to your email.');
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Network error requesting verification code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // 3. Handle Verify Code for Current Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifySuccess(null);

    if (!/^\d{6}$/.test(verifyCode.trim())) {
      setVerifyError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    setVerifyLoading(true);
    try {
      const res = await fetch('/api/profile/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVerifyError(data.error?.message || 'Email verification failed.');
        setVerifyLoading(false);
        return;
      }

      setUser(data.user);
      setVerifySuccess(data.message || 'Email verified successfully!');
      setCodeSent(false);
      setVerifyCode('');
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Network error submitting verification code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // 4. Handle Email Change Request (Step 1)
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeEmailError(null);
    setChangeEmailSuccess(null);

    const cleanNewEmail = newEmailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNewEmail)) {
      setChangeEmailError('Please enter a valid corporate email address.');
      return;
    }

    if (!changePasswordInput) {
      setChangeEmailError('Please enter your current password to authorize this sensitive change.');
      return;
    }

    setChangeEmailLoading(true);
    try {
      const res = await fetch('/api/profile/email/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: cleanNewEmail,
          currentPassword: changePasswordInput,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setChangeEmailError(data.error?.message || 'Failed to request email change.');
        setChangeEmailLoading(false);
        return;
      }

      setChangeEmailSuccess(data.message);
      setChangeEmailStep(2);
      setChangeEmailCooldown(60);
      setChangePasswordInput('');
    } catch (err) {
      setChangeEmailError(err instanceof Error ? err.message : 'Network error during email change request.');
    } finally {
      setChangeEmailLoading(false);
    }
  };

  // 5. Handle Confirm Email Change (Step 2)
  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeEmailError(null);
    setChangeEmailSuccess(null);

    if (!/^\d{6}$/.test(changeEmailCode.trim())) {
      setChangeEmailError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    setChangeEmailLoading(true);
    try {
      const res = await fetch('/api/profile/email/confirm-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: changeEmailCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setChangeEmailError(data.error?.message || 'Failed to confirm email change.');
        setChangeEmailLoading(false);
        return;
      }

      setUser(data.user);
      setChangeEmailSuccess(data.message || 'Email address successfully updated!');
      setShowEmailChange(false);
      setChangeEmailStep(1);
      setNewEmailInput('');
      setChangeEmailCode('');
    } catch (err) {
      setChangeEmailError(err instanceof Error ? err.message : 'Network error confirming email change.');
    } finally {
      setChangeEmailLoading(false);
    }
  };

  // 6. Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPw) {
      setPwError('Please enter your current password.');
      return;
    }

    if (newPw.length < 8) {
      setPwError('New password must contain at least 8 characters.');
      return;
    }

    if (newPw !== confirmPw) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    if (newPw === currentPw) {
      setPwError('New password must be different from your current password.');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
          confirmPassword: confirmPw,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPwError(data.error?.message || 'Failed to change password.');
        setPwLoading(false);
        return;
      }

      setPwSuccess(data.message || 'Password changed successfully.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Network error changing password.');
    } finally {
      setPwLoading(false);
    }
  };

  const inputClasses =
    'w-full rounded-xl border border-white/10 bg-black/40 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-white/30 font-mono outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all';

  return (
    <div className="relative min-h-screen pt-24 sm:pt-28 md:pt-32 pb-20 bg-[#08080b] text-white overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute top-[12%] left-0 right-0 z-0 pointer-events-none opacity-40">
        <ParallaxText direction="ltr" duration={54} outline={true}>
          PROFILE · SECURITY · WORKSPACE
        </ParallaxText>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 md:px-8 space-y-8 sm:space-y-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>BACK TO DASHBOARD</span>
          </Link>
          <span className="font-mono text-[10px] tracking-widest uppercase text-indigo-400">
            ACCOUNT PROTOCOL V2.5
          </span>
        </div>

        {/* ── CARD 1: Identity & Profile Header ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6 border-b border-white/10 pb-6 sm:pb-8">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-display text-xl sm:text-2xl font-bold shadow-lg shadow-indigo-500/20">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
                    {user.name}
                  </h1>
                  {/* Verified / Unverified Pill */}
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      VERIFIED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
                      UNVERIFIED
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs sm:text-sm text-white/60 mt-1 truncate">
                  {user.email}
                </p>
                <p className="font-mono text-[11px] text-white/40 mt-1">
                  MEMBER SINCE {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Workspace details badge */}
            {workspace && (
              <div className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-3.5 text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase text-[10px] tracking-wider">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>WORKSPACE</span>
                </div>
                <p className="text-white font-semibold truncate max-w-[220px]">
                  {workspace.name}
                </p>
                <p className="text-white/30 text-[10px] truncate max-w-[220px]">
                  ID: {workspace.id}
                </p>
              </div>
            )}
          </div>

          {/* Verification Status Banner if Unverified */}
          {!isVerified && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-200">
                    Your corporate email address is not yet verified.
                  </p>
                  <p className="text-[11px] font-mono text-amber-200/70 mt-0.5">
                    Verify your email to ensure secure account recovery and access to all enterprise analytics features.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={verifyLoading || sendCooldown > 0}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-[#08080b] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer min-h-[36px]"
              >
                {verifyLoading ? 'Sending...' : sendCooldown > 0 ? `Wait ${sendCooldown}s` : 'Send Code'}
              </button>
            </div>
          )}
        </div>

        {/* ── CARD 2: Personal Information (Edit Name) ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 shadow-2xl space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-indigo-400" />
              <h2 className="font-display text-base sm:text-lg font-bold uppercase text-white tracking-wide">
                Personal Information
              </h2>
            </div>
            {!isEditingName && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingName(true);
                  setNameError(null);
                  setNameSuccess(null);
                }}
                className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider underline underline-offset-4 cursor-pointer"
              >
                Edit Name
              </button>
            )}
          </div>

          {nameSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <Check className="h-3.5 w-3.5" />
              <span>{nameSuccess}</span>
            </div>
          )}

          {nameError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-300 flex items-center gap-2">
              <X className="h-3.5 w-3.5" />
              <span>{nameError}</span>
            </div>
          )}

          {isEditingName ? (
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="nameInput">
                  Display Name
                </label>
                <input
                  id="nameInput"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className={inputClasses}
                  placeholder="Your Full Name"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={nameLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-5 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer min-h-[38px]"
                >
                  {nameLoading ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setNameInput(user.name);
                    setNameError(null);
                  }}
                  className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-mono text-white/70 uppercase transition-all cursor-pointer min-h-[38px]"
                >
                  CANCEL
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-white/40 block mb-1 uppercase">Full Name</span>
                <span className="text-white font-semibold text-sm">{user.name}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-1 uppercase">Default Workspace</span>
                <span className="text-white font-semibold text-sm">{workspace?.name || 'Default'}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── CARD 3: Email Verification & Email Change ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-indigo-400" />
              <h2 className="font-display text-base sm:text-lg font-bold uppercase text-white tracking-wide">
                Corporate Email & Verification
              </h2>
            </div>
            {!showEmailChange && (
              <button
                type="button"
                onClick={() => {
                  setShowEmailChange(true);
                  setChangeEmailError(null);
                  setChangeEmailSuccess(null);
                  setChangeEmailStep(1);
                }}
                className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider underline underline-offset-4 cursor-pointer"
              >
                Change Email
              </button>
            )}
          </div>

          {/* Current Email Status Display */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-0.5">
                Current Registered Address
              </span>
              <p className="font-mono text-sm sm:text-base font-bold text-white truncate">
                {user.email}
              </p>
              <div className="mt-1 flex items-center gap-2">
                {isVerified ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified on {user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleDateString() : 'Record'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300">
                    <AlertCircle className="h-3 w-3" />
                    Pending verification code confirmation
                  </span>
                )}
              </div>
            </div>

            {!isVerified && !codeSent && (
              <button
                type="button"
                onClick={handleSendVerificationCode}
                disabled={verifyLoading || sendCooldown > 0}
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer min-h-[38px]"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', verifyLoading ? 'animate-spin' : '')} />
                <span>{verifyLoading ? 'SENDING...' : sendCooldown > 0 ? `RESEND IN ${sendCooldown}S` : 'VERIFY EMAIL'}</span>
              </button>
            )}
          </div>

          {/* Current Email Verification Form (if codeSent and unverified) */}
          {codeSent && !isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-5 space-y-4"
            >
              <div>
                <span className="font-mono text-[10px] text-indigo-300 uppercase tracking-widest block mb-1">
                  CONFIRMATION PENDING
                </span>
                <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase">
                  Enter 6-Digit Code
                </h3>
                <p className="text-xs font-mono text-white/60 mt-1">
                  A one-time code was sent to <span className="text-white font-bold">{user.email}</span>. Valid for 10 minutes.
                </p>
              </div>

              {verifySuccess && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-2.5 text-xs font-mono text-emerald-300">
                  {verifySuccess}
                </div>
              )}

              {verifyError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/20 p-2.5 text-xs font-mono text-rose-300">
                  {verifyError}
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-lg font-mono text-center tracking-[0.4em] text-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none w-full sm:w-44"
                  placeholder="000000"
                  required
                />
                <button
                  type="submit"
                  disabled={verifyLoading || verifyCode.length !== 6}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer min-h-[42px]"
                >
                  {verifyLoading ? 'VERIFYING...' : 'CONFIRM CODE'}
                </button>
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={verifyLoading || sendCooldown > 0}
                  className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-mono text-white/70 uppercase transition-all disabled:opacity-40 cursor-pointer min-h-[42px]"
                >
                  {sendCooldown > 0 ? `RESEND IN ${sendCooldown}S` : 'RESEND CODE'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Change Email Sub-flow (Step 1 & Step 2) */}
          <AnimatePresence>
            {showEmailChange && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-6 space-y-5 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest block mb-0.5">
                      SENSITIVE ACTION · STEP 0{changeEmailStep} OF 02
                    </span>
                    <h3 className="font-display text-sm sm:text-base font-bold text-white uppercase">
                      Change Corporate Email Address
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailChange(false);
                      setChangeEmailStep(1);
                      setChangeEmailError(null);
                    }}
                    className="text-white/40 hover:text-white p-1"
                    aria-label="Cancel email change"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs font-mono text-white/50 leading-relaxed">
                  Your current email address remains active until you successfully verify the one-time code sent to the new address.
                </p>

                {changeEmailSuccess && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-2.5 text-xs font-mono text-emerald-300">
                    {changeEmailSuccess}
                  </div>
                )}

                {changeEmailError && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/20 p-2.5 text-xs font-mono text-rose-300">
                    {changeEmailError}
                  </div>
                )}

                {changeEmailStep === 1 ? (
                  <form onSubmit={handleRequestEmailChange} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="newEmail">
                        New Corporate Email
                      </label>
                      <input
                        id="newEmail"
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className={inputClasses}
                        placeholder="new.email@enterprise.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="changePw">
                        Confirm Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="changePw"
                          type={showChangePw ? 'text' : 'password'}
                          value={changePasswordInput}
                          onChange={(e) => setChangePasswordInput(e.target.value)}
                          className={cn(inputClasses, 'pr-11')}
                          placeholder="••••••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowChangePw(!showChangePw)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          aria-label="Toggle password visibility"
                        >
                          {showChangePw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={changeEmailLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer min-h-[40px]"
                      >
                        {changeEmailLoading ? 'DISPATCHING CODE...' : 'SEND VERIFICATION CODE'}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEmailChange(false)}
                        className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-mono text-white/70 uppercase transition-all cursor-pointer min-h-[40px]"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmEmailChange} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="confirmCode">
                        Enter 6-Digit Code Sent to {newEmailInput}
                      </label>
                      <input
                        id="confirmCode"
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={changeEmailCode}
                        onChange={(e) => setChangeEmailCode(e.target.value.replace(/\D/g, ''))}
                        className="rounded-xl border border-white/20 bg-black/60 px-4 py-2.5 text-lg font-mono text-center tracking-[0.4em] text-indigo-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none w-full sm:w-48"
                        placeholder="000000"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={changeEmailLoading || changeEmailCode.length !== 6}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer min-h-[40px]"
                      >
                        {changeEmailLoading ? 'UPDATING...' : 'CONFIRM & SWITCH EMAIL'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeEmailStep(1)}
                        className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-mono text-white/70 uppercase transition-all cursor-pointer min-h-[40px]"
                      >
                        BACK
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CARD 4: Security & Password Change ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0f0f16]/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
            <KeyRound className="h-4 w-4 text-indigo-400" />
            <h2 className="font-display text-base sm:text-lg font-bold uppercase text-white tracking-wide">
              Security & Password
            </h2>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs font-mono text-white/50 space-y-1">
            <p className="text-white font-semibold flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
              <span>Argon2 / BCrypt Password Hashing with TLS 1.3 Transmission</span>
            </p>
            <p className="text-[11px] text-white/40">
              Changing your password will immediately invalidate all other active sessions across devices, guaranteeing that unauthorized sessions are disconnected.
            </p>
          </div>

          {pwSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <Check className="h-3.5 w-3.5" />
              <span>{pwSuccess}</span>
            </div>
          )}

          {pwError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-mono text-rose-300 flex items-center gap-2">
              <X className="h-3.5 w-3.5" />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="currPw">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currPw"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={cn(inputClasses, 'pr-11')}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="newPw">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPw"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className={cn(inputClasses, 'pr-11')}
                    placeholder="Min 8 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    aria-label="Toggle new password visibility"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-white/60 mb-1.5 uppercase" htmlFor="confirmPw">
                  Confirm New Password
                </label>
                <input
                  id="confirmPw"
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputClasses}
                  placeholder="Repeat new password"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-[#08080b] hover:bg-white/90 px-7 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-all disabled:opacity-50 cursor-pointer min-h-[42px] shadow-lg shadow-indigo-500/10"
              >
                {pwLoading ? 'UPDATING CREDENTIALS...' : 'UPDATE PASSWORD'}
              </button>
            </div>
          </form>
        </div>

        {/* ── CARD 5: Zero-Trace Compliance Assurance ── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs font-mono text-white/50 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
            <Database className="h-3.5 w-3.5" />
            <span>ZERO-TRACE DATA ARCHITECTURE COMPLIANCE</span>
          </div>
          <p className="leading-relaxed">
            Your user account profile, verified emails, and credential hashes are securely stored in MongoDB Atlas with cryptographic salt protection. In accordance with VizPilot Zero-Trace architecture, any business datasets ingested in Zero-Trace mode remain completely volatile and are never written to disk or account collections.
          </p>
        </div>

      </div>
    </div>
  );
}
