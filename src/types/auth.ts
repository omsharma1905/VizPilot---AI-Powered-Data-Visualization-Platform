import type { ObjectId } from 'mongodb';

export interface UserDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  defaultWorkspaceId: string;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  defaultWorkspaceId: string;
  emailVerifiedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface EmailVerificationDocument {
  _id?: ObjectId;
  id: string;
  userId: string;
  email: string;
  emailNormalized: string;
  codeHash: string;
  purpose: 'signup_verification' | 'email_change';
  targetEmail?: string;
  targetEmailNormalized?: string;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
  resendAvailableAt: Date;
}

export interface WorkspaceDocument {
  _id?: ObjectId;
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeWorkspace {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string | Date;
}

export interface SessionDocument {
  _id?: ObjectId;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ip?: string;
}

export interface AuthContext {
  user: SafeUser;
  workspace: SafeWorkspace;
}

export interface AuthResponse {
  success: boolean;
  user?: SafeUser;
  workspace?: SafeWorkspace;
  error?: {
    code: string;
    message: string;
  };
}
