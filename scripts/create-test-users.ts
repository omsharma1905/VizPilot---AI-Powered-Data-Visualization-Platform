/**
 * VizPilot — Dedicated Test Users Setup Script
 *
 * Idempotently creates and verifies the two dedicated test accounts
 * in the real MongoDB Atlas database using existing schemas and bcrypt hashing.
 *
 * Test User 1:
 * Name: VizPilot Test User One
 * Email: testuser1@vizpilot.dev
 *
 * Test User 2:
 * Name: VizPilot Test User Two
 * Email: testuser2@vizpilot.dev
 *
 * Passwords are never logged or stored in plaintext.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load .env.local / .env into process.env if running standalone
try {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.resolve(__dirname, '..', file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const key = trimmed.substring(0, idx).trim();
            const val = trimmed.substring(idx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
} catch {}

import { getUsersCollection, getWorkspacesCollection } from '../src/lib/db/collections';
import { initializeDatabaseIndexes } from '../src/lib/db/init';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';
import { closeMongoConnection } from '../src/lib/db/mongodb';
import type { UserDocument, WorkspaceDocument } from '../src/types/auth';

export interface TestUserSpec {
  name: string;
  email: string;
  password: string;
}

export const TEST_USERS: TestUserSpec[] = [
  {
    name: 'VizPilot Test User One',
    email: 'testuser1@vizpilot.dev',
    password: process.env.TEST_USER_1_PASSWORD || 'VizPilotTest@123',
  },
  {
    name: 'VizPilot Test User Two',
    email: 'testuser2@vizpilot.dev',
    password: process.env.TEST_USER_2_PASSWORD || 'VizPilotTest@456',
  },
];

export interface ProvisionResult {
  email: string;
  userId: string;
  workspaceId: string;
  status: 'created' | 'verified_intact' | 'repaired';
  details: string[];
}

export async function provisionTestUsers(): Promise<ProvisionResult[]> {
  await initializeDatabaseIndexes();

  const usersCol = await getUsersCollection();
  const workspacesCol = await getWorkspacesCollection();
  const results: ProvisionResult[] = [];

  for (const spec of TEST_USERS) {
    const emailNormalized = spec.email.trim().toLowerCase();
    const details: string[] = [];
    let status: 'created' | 'verified_intact' | 'repaired' = 'verified_intact';

    const existingUser = await usersCol.findOne({ emailNormalized });

    if (!existingUser) {
      // Create new user and workspace
      const userId = `user_${crypto.randomUUID()}`;
      const workspaceId = `ws_${crypto.randomUUID()}`;
      const passwordHash = await hashPassword(spec.password);
      const now = new Date();

      const workspaceDoc: WorkspaceDocument = {
        id: workspaceId,
        name: `${spec.name.trim()}'s Workspace`,
        ownerUserId: userId,
        createdAt: now,
        updatedAt: now,
      };

      const userDoc: UserDocument = {
        id: userId,
        name: spec.name.trim(),
        email: spec.email.trim(),
        emailNormalized,
        passwordHash,
        defaultWorkspaceId: workspaceId,
        createdAt: now,
        updatedAt: now,
      };

      await workspacesCol.insertOne(workspaceDoc);
      await usersCol.insertOne(userDoc);

      results.push({
        email: spec.email,
        userId,
        workspaceId,
        status: 'created',
        details: ['User document created', 'Default workspace document created', 'Password securely hashed with bcrypt'],
      });
      continue;
    }

    // User already exists -> Verify and repair any discrepancies idempotently
    let targetUserId = existingUser.id;
    let targetWorkspaceId = existingUser.defaultWorkspaceId;
    let needsUserUpdate = false;
    const userUpdates: Partial<UserDocument> = {};

    // 1. Verify and repair name if needed
    if (existingUser.name !== spec.name.trim()) {
      userUpdates.name = spec.name.trim();
      needsUserUpdate = true;
      status = 'repaired';
      details.push('Updated display name to match spec');
    }

    // 2. Verify password hash validity
    const isPwValid = await verifyPassword(spec.password, existingUser.passwordHash);
    if (!isPwValid) {
      userUpdates.passwordHash = await hashPassword(spec.password);
      needsUserUpdate = true;
      status = 'repaired';
      details.push('Rehashed and updated password');
    } else {
      details.push('Password hash verified');
    }

    // 3. Verify workspace existence and ownership
    let workspace = await workspacesCol.findOne({ id: existingUser.defaultWorkspaceId });
    if (!workspace) {
      workspace = await workspacesCol.findOne({ ownerUserId: existingUser.id });
    }

    if (!workspace) {
      // Workspace missing: provision new default workspace
      const newWsId = `ws_${crypto.randomUUID()}`;
      const now = new Date();
      const newWs: WorkspaceDocument = {
        id: newWsId,
        name: `${spec.name.trim()}'s Workspace`,
        ownerUserId: existingUser.id,
        createdAt: now,
        updatedAt: now,
      };
      await workspacesCol.insertOne(newWs);
      targetWorkspaceId = newWsId;
      userUpdates.defaultWorkspaceId = newWsId;
      needsUserUpdate = true;
      status = 'repaired';
      details.push('Created missing default workspace');
    } else {
      targetWorkspaceId = workspace.id;
      // Ensure ownership integrity
      if (workspace.ownerUserId !== existingUser.id) {
        await workspacesCol.updateOne({ id: workspace.id }, { $set: { ownerUserId: existingUser.id, updatedAt: new Date() } });
        status = 'repaired';
        details.push('Corrected workspace ownerUserId link');
      } else {
        details.push('Workspace ownership verified');
      }

      if (existingUser.defaultWorkspaceId !== workspace.id) {
        userUpdates.defaultWorkspaceId = workspace.id;
        needsUserUpdate = true;
        status = 'repaired';
        details.push('Linked user defaultWorkspaceId to existing workspace');
      }
    }

    if (needsUserUpdate) {
      userUpdates.updatedAt = new Date();
      await usersCol.updateOne({ id: existingUser.id }, { $set: userUpdates });
    }

    if (status === 'verified_intact') {
      details.push('Account structurally valid and ready');
    }

    results.push({
      email: spec.email,
      userId: targetUserId,
      workspaceId: targetWorkspaceId,
      status,
      details,
    });
  }

  return results;
}

// Run standalone if executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log('Provisioning VizPilot test users in MongoDB Atlas...');
      const results = await provisionTestUsers();
      console.log('\n--- Provisioning Summary ---');
      for (const res of results) {
        console.log(`User: ${res.email}`);
        console.log(`  User ID:      ${res.userId}`);
        console.log(`  Workspace ID: ${res.workspaceId}`);
        console.log(`  Status:       ${res.status}`);
        console.log(`  Details:      ${res.details.join(', ')}\n`);
      }
      console.log('All test users are provisioned and verified.');
    } catch (err) {
      console.error('Error provisioning test users:', err);
      process.exit(1);
    } finally {
      await closeMongoConnection();
    }
  })();
}
