'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SafeUser, SafeWorkspace } from '@/src/types/auth';
import { clearZeroTraceClientState } from '@/src/lib/client/zero-trace-cleanup';

interface AuthContextType {
  user: SafeUser | null;
  workspace: SafeWorkspace | null;
  loading: boolean;
  setUser: (user: SafeUser | null) => void;
  setWorkspace: (workspace: SafeWorkspace | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: SafeUser | null;
  initialWorkspace?: SafeWorkspace | null;
}

export function AuthProvider({
  children,
  initialUser = null,
  initialWorkspace = null,
}: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(initialUser);
  const [workspace, setWorkspace] = useState<SafeWorkspace | null>(initialWorkspace);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setWorkspace(data.workspace || null);
        } else {
          setUser(null);
          setWorkspace(null);
        }
      } else {
        setUser(null);
        setWorkspace(null);
      }
    } catch (err) {
      console.error('[VizPilot AuthContext] Failed to refresh auth state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state if a valid user is passed from server SSR
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setWorkspace(initialWorkspace ?? null);
      setLoading(false);
    }
  }, [initialUser, initialWorkspace]);

  // If initialUser wasn't provided on SSR, fetch current session on mount
  useEffect(() => {
    if (!initialUser) {
      refresh();
    }
  }, [initialUser, refresh]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[VizPilot AuthContext] Logout request error:', err);
    } finally {
      clearZeroTraceClientState();
      setUser(null);
      setWorkspace(null);
      setLoading(false);
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        loading,
        setUser,
        setWorkspace,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
