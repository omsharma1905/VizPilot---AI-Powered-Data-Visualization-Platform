import type { Collection } from 'mongodb';
import { getMongoDb } from './mongodb';
import type { UserDocument, WorkspaceDocument, SessionDocument, EmailVerificationDocument } from '@/src/types/auth';

export const COLLECTIONS = {
  USERS: 'users',
  WORKSPACES: 'workspaces',
  SESSIONS: 'sessions',
  EMAIL_VERIFICATIONS: 'email_verifications',
} as const;

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getMongoDb();
  return db.collection<UserDocument>(COLLECTIONS.USERS);
}

export async function getWorkspacesCollection(): Promise<Collection<WorkspaceDocument>> {
  const db = await getMongoDb();
  return db.collection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);
}

export async function getSessionsCollection(): Promise<Collection<SessionDocument>> {
  const db = await getMongoDb();
  return db.collection<SessionDocument>(COLLECTIONS.SESSIONS);
}

export async function getEmailVerificationsCollection(): Promise<Collection<EmailVerificationDocument>> {
  const db = await getMongoDb();
  return db.collection<EmailVerificationDocument>(COLLECTIONS.EMAIL_VERIFICATIONS);
}
