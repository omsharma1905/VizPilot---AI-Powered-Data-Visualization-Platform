'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutDashboard, Upload, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/src/lib/auth/context';
import { getUserInitials, getFirstName } from '@/src/lib/auth/utils';

export function UserProfileMenu() {
  const { user, workspace, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const initials = getUserInitials(user.name);
  const firstName = getFirstName(user.name);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User Account Menu"
        className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 px-2 sm:px-2.5 py-1 text-xs transition-all duration-200 cursor-pointer min-h-[36px]"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-[10px] font-bold">
          {initials}
        </div>
        <span className="hidden sm:inline font-mono text-xs font-semibold tracking-wider text-white/90 group-hover:text-white uppercase max-w-[100px] truncate">
          {firstName}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-white/40 group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-[#0f0f16]/95 backdrop-blur-2xl p-3 shadow-2xl z-[100]"
          >
            {/* User Profile Header */}
            <div className="px-2.5 py-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-mono text-xs font-bold">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-white tracking-tight truncate">
                    {user.name}
                  </p>
                  <p className="font-mono text-[11px] text-white/50 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {workspace && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-indigo-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span className="truncate max-w-[190px]">{workspace.name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 my-1.5" />

            {/* Navigation Options */}
            <div className="space-y-0.5">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-mono text-white/75 hover:text-white hover:bg-white/5 transition-colors"
                role="menuitem"
              >
                <User className="h-3.5 w-3.5 text-indigo-400" />
                <span>Profile & Settings</span>
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-mono text-white/75 hover:text-white hover:bg-white/5 transition-colors"
                role="menuitem"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-indigo-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/upload"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-mono text-white/75 hover:text-white hover:bg-white/5 transition-colors"
                role="menuitem"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-400" />
                <span>Upload Dataset</span>
              </Link>
            </div>

            <div className="border-t border-white/10 my-1.5" />

            {/* Logout Action */}
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              role="menuitem"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>Log out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
