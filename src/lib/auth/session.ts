import crypto from 'crypto';
import type { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionsCollection, getUsersCollection, getWorkspacesCollection } from '@/src/lib/db/collections';
import type { AuthContext, SafeUser, SafeWorkspace, SessionDocument } from '@/src/types/auth';

export const SESSION_COOKIE_NAME = 'vizpilot_session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/**
 * Generate a cryptographically secure 256-bit session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates and stores a new session in MongoDB.
 */
export async function createSession(
  userId: string,
  metadata?: { userAgent?: string; ip?: string }
): Promise<string> {
  const token = generateSessionToken();
  const sessionsCol = await getSessionsCollection();

  const sessionDoc: SessionDocument = {
    token,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
    userAgent: metadata?.userAgent,
    ip: metadata?.ip,
  };

  await sessionsCol.insertOne(sessionDoc);
  return token;
}

/**
 * Validates a session token against MongoDB and returns the authenticated user and workspace.
 */
export async function validateSession(token: string): Promise<AuthContext | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const sessionsCol = await getSessionsCollection();
    const session = await sessionsCol.findOne({ token });

    if (!session) {
      return null;
    }

    // Check expiration
    if (new Date() > new Date(session.expiresAt)) {
      await sessionsCol.deleteOne({ token });
      return null;
    }

    const usersCol = await getUsersCollection();
    const userDoc = await usersCol.findOne({ id: session.userId });

    if (!userDoc) {
      await sessionsCol.deleteOne({ token });
      return null;
    }

    const workspacesCol = await getWorkspacesCollection();
    let workspaceDoc = await workspacesCol.findOne({ id: userDoc.defaultWorkspaceId });

    if (!workspaceDoc) {
      workspaceDoc = await workspacesCol.findOne({ ownerUserId: userDoc.id });
    }

    const safeUser: SafeUser = {
      id: userDoc.id,
      name: userDoc.name,
      email: userDoc.email,
      defaultWorkspaceId: userDoc.defaultWorkspaceId,
      emailVerifiedAt: userDoc.emailVerifiedAt ? (userDoc.emailVerifiedAt instanceof Date ? userDoc.emailVerifiedAt.toISOString() : userDoc.emailVerifiedAt) : null,
      createdAt: userDoc.createdAt,
    };

    const safeWorkspace: SafeWorkspace = {
      id: workspaceDoc?.id || userDoc.defaultWorkspaceId || `ws_${userDoc.id}`,
      name: workspaceDoc?.name || `${userDoc.name}'s Workspace`,
      ownerUserId: workspaceDoc?.ownerUserId || userDoc.id,
      createdAt: workspaceDoc?.createdAt || userDoc.createdAt,
    };

    return {
      user: safeUser,
      workspace: safeWorkspace,
    };
  } catch (err) {
    console.error('[VizPilot Auth] Session validation error:', err);
    return null;
  }
}

/**
 * Invalidates and deletes a session token.
 */
export async function destroySession(token: string): Promise<void> {
  if (!token) return;
  try {
    const sessionsCol = await getSessionsCollection();
    await sessionsCol.deleteOne({ token });
  } catch (err) {
    console.error('[VizPilot Auth] Session deletion error:', err);
  }
}

/**
 * Server-only helper: inspects request headers or cookie jar to resolve authenticated user.
 */
export async function getAuthenticatedUser(req?: Request): Promise<AuthContext | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    token = match ? decodeURIComponent(match[1]) : undefined;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // cookies() may throw outside of request contexts
      token = undefined;
    }
  }

  if (!token) {
    return null;
  }

  return validateSession(token);
}

/**
 * Applies the session cookie to an outgoing NextResponse.
 */
export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    ...COOKIE_OPTIONS,
    value: token,
  });
}

/**
 * Clears the session cookie on an outgoing NextResponse.
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    ...COOKIE_OPTIONS,
    value: '',
    maxAge: 0,
  });
}
