'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context';

/**
 * Hook that ensures a page is accessed by an authenticated user.
 * If user is not authenticated and auth check is done, redirects to /login with next param.
 */
export function useProtectedRoute(currentPath: string) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, router, currentPath]);

  return { user, loading };
}
