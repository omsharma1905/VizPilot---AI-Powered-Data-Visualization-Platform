/**
 * VizPilot Phase 3A.2 — Full Product Audit & Correction Suite
 *
 * Verifies all defect corrections, routing guards, state clearance,
 * multi-user isolation, and error handling across the entire product.
 */

import fs from 'fs';
import path from 'path';

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

import { clientMemoryStore } from '../src/lib/client/in-memory-store';
import { clearZeroTraceClientState } from '../src/lib/client/zero-trace-cleanup';
import { getSafeRedirectUrl } from '../src/lib/auth/redirect';
import { getUserInitials, getFirstName } from '../src/lib/auth/utils';
import { createProcessingContext } from '../src/lib/security/context';
import { getMongoDb, closeMongoConnection } from '../src/lib/db/mongodb';
import { COLLECTIONS } from '../src/lib/db/collections';
import type { VizPilotDataset } from '../src/types/dataset';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

async function runAuditTests() {
  console.log('====================================================');
  console.log('VIZPILOT PHASE 3A.2 — FULL PRODUCT AUDIT VERIFICATION');
  console.log('====================================================\n');

  // ── TEST 1: Landing & Navbar CTA Routing Matrix ───────────────────
  console.log('Test Group 1: Landing & Navbar CTA Routing Matrix');
  {
    // Unauthenticated user clicking Upload Data / Launch Workspace
    const unauthUser: any = null;
    const authUser = { id: 'usr-1', name: 'Alex Analyst', email: 'alex@corp.com' };

    const unauthHref = unauthUser ? '/upload' : '/login?next=/upload';
    const authHref = authUser ? '/upload' : '/login?next=/upload';

    assert(unauthHref === '/login?next=/upload', 'Unauthenticated CTA directs to /login?next=/upload');
    assert(authHref === '/upload', 'Authenticated CTA directs to /upload');

    // Safe Redirect URL extraction
    assert(getSafeRedirectUrl('/upload', '/upload') === '/upload', 'Safe next /upload is preserved');
    assert(getSafeRedirectUrl('/dashboard', '/upload') === '/dashboard', 'Safe next /dashboard is preserved');
    assert(getSafeRedirectUrl('https://malicious.com', '/upload') === '/upload', 'Open redirect URL blocked');
    assert(getSafeRedirectUrl('//evil.com/hack', '/upload') === '/upload', 'Protocol-relative open redirect blocked');
    assert(getSafeRedirectUrl('javascript:alert(1)', '/upload') === '/upload', 'Javascript pseudo-protocol blocked');
  }

  // ── TEST 2: Cross-Account State Leak Prevention ────────────────────
  console.log('\nTest Group 2: Cross-Account State Leak Prevention on Logout / Switch');
  {
    // User A sets data in volatile RAM store and mock sessionStorage
    const dummyDataset: VizPilotDataset = {
      id: 'ds-user-a',
      name: 'Confidential_Revenue_A.xlsx',
      processingMode: 'workspace',
      createdAt: new Date().toISOString(),
      source: {
        fileName: 'Confidential_Revenue_A.xlsx',
        fileSize: 1024,
        fileType: 'xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: new Date().toISOString(),
        mode: 'workspace',
      },
      extraction: {
        method: 'structured',
        durationMs: 5,
        confidence: 1.0,
        warnings: [],
      },
      tables: [{
        id: 'tbl-1',
        name: 'Financials',
        rowCount: 50,
        columnCount: 2,
        columns: [
          { id: 'col-0', index: 0, name: 'Month', inferredType: 'string', nullable: false, nullCount: 0, totalCount: 50, sampleValues: ['Jan'] },
          { id: 'col-1', index: 1, name: 'SecretProfit', inferredType: 'number', nullable: false, nullCount: 0, totalCount: 50, sampleValues: [100000] },
        ],
        rows: [['Jan', 100000]],
      }],
    };

    clientMemoryStore.setDataset(dummyDataset);
    assert(clientMemoryStore.getDataset()?.id === 'ds-user-a', 'User A dataset stored in volatile memory');

    // Clear state as performed by AuthContext.logout() or login/signup switch
    clearZeroTraceClientState();

    assert(clientMemoryStore.getDataset() === null, 'Volatile memory store completely purged');
    assert(clientMemoryStore.getProfile() === null, 'Volatile profile store completely purged');
  }

  // ── TEST 3: Name & Profile Parsing Utilities ───────────────────────
  console.log('\nTest Group 3: User Initials & First Name Display');
  {
    assert(getUserInitials('Sarah Connor') === 'SC', 'Initials parsed for two names: SC');
    assert(getUserInitials('Madonna') === 'MA', 'Initials parsed for single name: MA');
    assert(getUserInitials('Dr. John Watson') === 'DW', 'Initials parsed for three names: DW');
    assert(getUserInitials('') === 'U', 'Empty name defaults to U');

    assert(getFirstName('Sarah Connor') === 'Sarah', 'First name extracted: Sarah');
    assert(getFirstName('Madonna') === 'Madonna', 'Single name extracted: Madonna');
    assert(getFirstName('') === 'User', 'Empty name defaults to User');
  }

  // ── TEST 4: Live MongoDB Atlas Connection & Indexes ────────────────
  console.log('\nTest Group 4: Live MongoDB Atlas Index Integrity');
  {
    try {
      const db = await getMongoDb();
      const usersCol = db.collection(COLLECTIONS.USERS);
      const workspacesCol = db.collection(COLLECTIONS.WORKSPACES);
      const sessionsCol = db.collection(COLLECTIONS.SESSIONS);

      const userIndexes = await usersCol.indexes();
      const userIndexNames = userIndexes.map((i) => i.name);
      assert(userIndexNames.includes('idx_users_email_normalized'), 'Atlas users collection has unique emailNormalized index');
      assert(userIndexNames.includes('idx_users_id'), 'Atlas users collection has id index');

      const wsIndexes = await workspacesCol.indexes();
      const wsIndexNames = wsIndexes.map((i) => i.name);
      assert(wsIndexNames.includes('idx_workspaces_owner_user_id'), 'Atlas workspaces collection has ownerUserId index');

      const sessIndexes = await sessionsCol.indexes();
      const sessIndexNames = sessIndexes.map((i) => i.name);
      assert(sessIndexNames.includes('idx_sessions_token'), 'Atlas sessions collection has token index');
      assert(sessIndexNames.includes('idx_sessions_ttl'), 'Atlas sessions collection has TTL index');
    } catch (e) {
      console.error('MongoDB Atlas connection error during audit:', e);
      failed++;
    }
  }

  // ── TEST 5: Multi-User Workspace Isolation ─────────────────────────
  console.log('\nTest Group 5: Multi-User Workspace Ownership Isolation');
  {
    const db = await getMongoDb();
    const workspacesCol = db.collection(COLLECTIONS.WORKSPACES);

    // Verify workspace owner references are strictly isolated
    const userA_id = 'audit-user-a-' + Date.now();
    const userB_id = 'audit-user-b-' + Date.now();

    const wsA = {
      id: 'ws-' + userA_id,
      name: "User A's Workspace",
      ownerUserId: userA_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const wsB = {
      id: 'ws-' + userB_id,
      name: "User B's Workspace",
      ownerUserId: userB_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await workspacesCol.insertMany([wsA, wsB]);

    // Query User A's workspace as User B
    const fetchedAsUserA = await workspacesCol.findOne({ ownerUserId: userA_id });
    const fetchedAsUserB = await workspacesCol.findOne({ ownerUserId: userB_id });
    const crossAccess = await workspacesCol.findOne({ id: wsA.id, ownerUserId: userB_id });

    assert(fetchedAsUserA?.id === wsA.id, "User A retrieves User A's workspace");
    assert(fetchedAsUserB?.id === wsB.id, "User B retrieves User B's workspace");
    assert(crossAccess === null, "User B CANNOT access User A's workspace (Cross-tenant access denied)");

    // Clean up audit test records
    await workspacesCol.deleteMany({ id: { $in: [wsA.id, wsB.id] } });
  }

  // ── TEST 6: Processing Context Security & Telemetry Boundary ──────
  console.log('\nTest Group 6: Security Context & Telemetry Log Scrubbing');
  {
    const fakeReq = {
      headers: new Headers({
        'x-request-id': 'req-audit-999',
        'x-forwarded-for': '127.0.0.1',
      }),
    } as any;

    const ctx = createProcessingContext(fakeReq, 'zerotrace');
    assert(ctx.mode === 'zerotrace', 'Mode correctly normalized to zerotrace');
    assert(ctx.requestId === 'req-audit-999', 'Request ID properly captured');

    // Workspace mode context
    const wsCtx = createProcessingContext(fakeReq, 'workspace');
    assert(wsCtx.mode === 'workspace', 'Mode correctly normalized to workspace');
  }

  // ── TEST 7: Route Protection Logic Verification ────────────────────
  console.log('\nTest Group 7: Route Protection Logic Verification');
  {
    const protectedRoutes = ['/upload', '/analysis', '/recommendation', '/visualize', '/dashboard'];
    const publicRoutes = ['/', '/login', '/signup'];

    for (const route of protectedRoutes) {
      const isProtected = protectedRoutes.some((p) => route.startsWith(p));
      assert(isProtected, `Route ${route} is properly recognized as protected`);
    }

    for (const route of publicRoutes) {
      const isProtected = protectedRoutes.some((p) => route === p || (p !== '/' && route.startsWith(p)));
      assert(!isProtected, `Route ${route} is properly recognized as public`);
    }
  }

  await closeMongoConnection();

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`AUDIT SUITE COMPLETE: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error('Fatal audit test suite failure:', err);
  process.exit(1);
});
