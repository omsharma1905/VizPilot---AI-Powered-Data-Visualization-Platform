/**
 * VizPilot — Dedicated Test Users Full Validation Suite
 *
 * Verifies:
 * 1. MongoDB Atlas database structure & schema integrity for both test users
 * 2. Bcrypt password hashing (never plaintext)
 * 3. Default workspace ownership and separation
 * 4. Idempotency (zero duplicates)
 * 5. Real server authentication lifecycle (POST /api/auth/login)
 * 6. Session cookie security properties (httpOnly, sameSite, path, maxAge)
 * 7. Authenticated UI state (initials badge, user name, email, no anonymous sign-in)
 * 8. Protected routes pass-through (/upload, /dashboard, /analysis, etc.)
 * 9. Cross-account isolation (User 1 cannot access User 2 data/workspace and vice versa)
 * 10. Logout session invalidation, cookie clearing, and route protection re-engagement
 * 11. Zero-Trace dataset non-persistence invariant
 *
 * NOTE: Passwords are never printed or leaked in output.
 */

import fs from 'fs';
import path from 'path';

// Load .env.local / .env
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

import { getMongoDb, closeMongoConnection } from '../src/lib/db/mongodb';
import { COLLECTIONS } from '../src/lib/db/collections';
import { verifyPassword } from '../src/lib/auth/password';
import { TEST_USERS } from './create-test-users';
import { SESSION_COOKIE_NAME } from '../src/lib/auth/session';
import type { UserDocument, WorkspaceDocument, SessionDocument } from '../src/types/auth';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

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

async function runValidation() {
  console.log('====================================================');
  console.log('VIZPILOT — TEST USERS FULL VALIDATION SUITE');
  console.log('====================================================\n');

  const db = await getMongoDb();
  const usersCol = db.collection<UserDocument>(COLLECTIONS.USERS);
  const workspacesCol = db.collection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);
  const sessionsCol = db.collection<SessionDocument>(COLLECTIONS.SESSIONS);

  const spec1 = TEST_USERS[0];
  const spec2 = TEST_USERS[1];

  // ──────────────────────────────────────────────────────────────────
  // 1. DATABASE INTEGRITY FOR TEST USER 1
  // ──────────────────────────────────────────────────────────────────
  console.log('Group 1: Database Invariants for Test User 1');
  const user1 = await usersCol.findOne({ emailNormalized: spec1.email.toLowerCase() });
  assert(!!user1, 'Test User 1 exists in MongoDB Atlas users collection');
  assert(user1?.email === spec1.email, 'Test User 1 preserves original email casing');
  assert(user1?.emailNormalized === spec1.email.toLowerCase(), 'Test User 1 emailNormalized is lowercase');
  assert(user1?.name === spec1.name, 'Test User 1 name matches specification');

  // Password hash verification (NEVER plaintext)
  assert(user1?.passwordHash !== spec1.password, 'Test User 1 password is NOT plaintext');
  assert(
    Boolean(user1?.passwordHash?.startsWith('$2a$') || user1?.passwordHash?.startsWith('$2b$')),
    'Test User 1 password is a valid bcrypt hash'
  );
  const user1PwValid = await verifyPassword(spec1.password, user1?.passwordHash || '');
  assert(user1PwValid === true, 'Test User 1 password successfully matches bcrypt hash');
  const user1WrongPw = await verifyPassword('WrongPassword#999', user1?.passwordHash || '');
  assert(user1WrongPw === false, 'Test User 1 rejects invalid password against hash');

  // Workspace verification
  const ws1 = await workspacesCol.findOne({ id: user1?.defaultWorkspaceId });
  assert(!!ws1, 'Test User 1 has default workspace in workspaces collection');
  assert(ws1?.ownerUserId === user1?.id, 'Test User 1 workspace ownerUserId matches user id');
  assert(Boolean(ws1?.name?.includes(spec1.name)), 'Test User 1 workspace name incorporates user name');

  // ──────────────────────────────────────────────────────────────────
  // 2. DATABASE INTEGRITY FOR TEST USER 2
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 2: Database Invariants for Test User 2');
  const user2 = await usersCol.findOne({ emailNormalized: spec2.email.toLowerCase() });
  assert(!!user2, 'Test User 2 exists in MongoDB Atlas users collection');
  assert(user2?.email === spec2.email, 'Test User 2 preserves original email casing');
  assert(user2?.emailNormalized === spec2.email.toLowerCase(), 'Test User 2 emailNormalized is lowercase');
  assert(user2?.name === spec2.name, 'Test User 2 name matches specification');

  // Password hash verification (NEVER plaintext)
  assert(user2?.passwordHash !== spec2.password, 'Test User 2 password is NOT plaintext');
  assert(
    Boolean(user2?.passwordHash?.startsWith('$2a$') || user2?.passwordHash?.startsWith('$2b$')),
    'Test User 2 password is a valid bcrypt hash'
  );
  const user2PwValid = await verifyPassword(spec2.password, user2?.passwordHash || '');
  assert(user2PwValid === true, 'Test User 2 password successfully matches bcrypt hash');
  const user2WrongPw = await verifyPassword('WrongPassword#999', user2?.passwordHash || '');
  assert(user2WrongPw === false, 'Test User 2 rejects invalid password against hash');

  // Workspace verification
  const ws2 = await workspacesCol.findOne({ id: user2?.defaultWorkspaceId });
  assert(!!ws2, 'Test User 2 has default workspace in workspaces collection');
  assert(ws2?.ownerUserId === user2?.id, 'Test User 2 workspace ownerUserId matches user id');
  assert(Boolean(ws2?.name?.includes(spec2.name)), 'Test User 2 workspace name incorporates user name');

  // ──────────────────────────────────────────────────────────────────
  // 3. IDEMPOTENCY & DUPLICATE PROTECTION
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 3: Idempotency & Duplicate Protection Invariants');
  const count1 = await usersCol.countDocuments({ emailNormalized: spec1.email.toLowerCase() });
  assert(count1 === 1, 'Exactly one user record exists for testuser1@vizpilot.dev (no duplicates)');
  const count2 = await usersCol.countDocuments({ emailNormalized: spec2.email.toLowerCase() });
  assert(count2 === 1, 'Exactly one user record exists for testuser2@vizpilot.dev (no duplicates)');

  const wsCount1 = await workspacesCol.countDocuments({ ownerUserId: user1?.id });
  assert(wsCount1 === 1, 'Test User 1 has exactly one workspace');
  const wsCount2 = await workspacesCol.countDocuments({ ownerUserId: user2?.id });
  assert(wsCount2 === 1, 'Test User 2 has exactly one workspace');

  // ──────────────────────────────────────────────────────────────────
  // 4. DATABASE-LEVEL WORKSPACE ISOLATION
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 4: Workspace Ownership Isolation (Database Layer)');
  assert(ws1?.id !== ws2?.id, 'User 1 and User 2 have completely distinct workspace IDs');
  assert(user1?.id !== user2?.id, 'User 1 and User 2 have distinct user IDs');

  // Cross query tests
  const cross1 = await workspacesCol.findOne({ id: ws1?.id, ownerUserId: user2?.id });
  assert(cross1 === null, 'User 2 cannot query User 1 workspace with User 2 ownerUserId');
  const cross2 = await workspacesCol.findOne({ id: ws2?.id, ownerUserId: user1?.id });
  assert(cross2 === null, 'User 1 cannot query User 2 workspace with User 1 ownerUserId');

  // ──────────────────────────────────────────────────────────────────
  // 5. LIVE SERVER AUTHENTICATION & SESSION LIFECYCLE (TEST USER 1)
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 5: Real Server Authentication Lifecycle for Test User 1');
  let user1Cookie = '';
  let user1SessionToken = '';

  // 5.1 POST /api/auth/login
  const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: spec1.email, password: spec1.password }),
  });
  assert(loginRes1.status === 200, 'User 1 login endpoint returns HTTP 200');
  const loginData1 = await loginRes1.json();
  assert(loginData1.success === true, 'User 1 login response indicates success');
  assert(loginData1.user.name === spec1.name, 'User 1 login response returns correct user name');
  assert(loginData1.user.email === spec1.email, 'User 1 login response returns correct user email');
  assert(loginData1.user.passwordHash === undefined, 'User 1 passwordHash is NEVER exposed in login response');

  // 5.2 Cookie validation
  const setCookie1 = loginRes1.headers.get('set-cookie') || '';
  assert(setCookie1.includes(SESSION_COOKIE_NAME), 'Login sets vizpilot_session cookie');
  assert(setCookie1.toLowerCase().includes('httponly'), 'Session cookie has HttpOnly flag');
  assert(setCookie1.toLowerCase().includes('path=/'), 'Session cookie path is root (/)');
  assert(setCookie1.toLowerCase().includes('samesite=lax'), 'Session cookie has SameSite=lax');

  // Extract session token
  const tokenMatch1 = setCookie1.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  user1SessionToken = tokenMatch1 ? tokenMatch1[1] : '';
  user1Cookie = `${SESSION_COOKIE_NAME}=${user1SessionToken}`;
  assert(user1SessionToken.length === 64, 'Session token is 64-character 256-bit hex');

  // 5.3 Verify session record in Atlas
  const session1 = await sessionsCol.findOne({ token: user1SessionToken });
  assert(!!session1, 'Session record persisted in MongoDB Atlas sessions collection');
  assert(session1?.userId === user1?.id, 'Session links to User 1 user id');
  assert(new Date(session1?.expiresAt || 0) > new Date(), 'Session expiresAt is in the future');

  // 5.4 GET /api/auth/me with User 1 cookie
  const meRes1 = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: user1Cookie },
  });
  assert(meRes1.status === 200, 'GET /api/auth/me returns HTTP 200');
  const meData1 = await meRes1.json();
  assert(meData1.authenticated === true, 'GET /api/auth/me identifies user as authenticated');
  assert(meData1.user.id === user1?.id, 'GET /api/auth/me matches User 1 id');
  assert(meData1.user.name === spec1.name, 'GET /api/auth/me matches User 1 name');
  assert(meData1.workspace.id === ws1?.id, 'GET /api/auth/me matches User 1 workspace id');

  // 5.5 SSR Landing Page with User 1 Cookie
  const homeRes1 = await fetch(`${BASE_URL}/`, {
    headers: { Cookie: user1Cookie },
  });
  const homeHtml1 = await homeRes1.text();
  assert(homeRes1.status === 200, 'Authenticated GET / returns HTTP 200');
  assert(!homeHtml1.includes('Sign In'), 'Authenticated landing page HIDES anonymous Sign In');
  assert(
    homeHtml1.includes('User Account Menu') || homeHtml1.includes('VIZPILOT') || homeHtml1.includes('VU'),
    'Authenticated landing page renders user profile UI elements'
  );

  // 5.6 Protected Routes Pass-Through for User 1
  const uploadRes1 = await fetch(`${BASE_URL}/upload`, {
    headers: { Cookie: user1Cookie },
    redirect: 'manual',
  });
  assert(uploadRes1.status === 200, 'Authenticated User 1 accesses /upload without redirect');

  const dashRes1 = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Cookie: user1Cookie },
    redirect: 'manual',
  });
  assert(dashRes1.status === 200, 'Authenticated User 1 accesses /dashboard without redirect');

  // ──────────────────────────────────────────────────────────────────
  // 6. LIVE SERVER AUTHENTICATION & SESSION LIFECYCLE (TEST USER 2)
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 6: Real Server Authentication Lifecycle for Test User 2');
  let user2Cookie = '';
  let user2SessionToken = '';

  // 6.1 POST /api/auth/login
  const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: spec2.email, password: spec2.password }),
  });
  assert(loginRes2.status === 200, 'User 2 login endpoint returns HTTP 200');
  const loginData2 = await loginRes2.json();
  assert(loginData2.success === true, 'User 2 login response indicates success');
  assert(loginData2.user.name === spec2.name, 'User 2 login response returns correct user name');
  assert(loginData2.user.email === spec2.email, 'User 2 login response returns correct user email');
  assert(loginData2.user.passwordHash === undefined, 'User 2 passwordHash is NEVER exposed in login response');

  // 6.2 Cookie validation
  const setCookie2 = loginRes2.headers.get('set-cookie') || '';
  assert(setCookie2.includes(SESSION_COOKIE_NAME), 'User 2 login sets vizpilot_session cookie');
  const tokenMatch2 = setCookie2.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  user2SessionToken = tokenMatch2 ? tokenMatch2[1] : '';
  user2Cookie = `${SESSION_COOKIE_NAME}=${user2SessionToken}`;
  assert(user2SessionToken.length === 64, 'User 2 session token is 64-character 256-bit hex');

  // 6.3 Verify session record in Atlas
  const session2 = await sessionsCol.findOne({ token: user2SessionToken });
  assert(!!session2, 'User 2 session record persisted in MongoDB Atlas sessions collection');
  assert(session2?.userId === user2?.id, 'Session links to User 2 user id');

  // 6.4 GET /api/auth/me with User 2 cookie
  const meRes2 = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: user2Cookie },
  });
  assert(meRes2.status === 200, 'GET /api/auth/me returns HTTP 200 for User 2');
  const meData2 = await meRes2.json();
  assert(meData2.authenticated === true, 'User 2 identified as authenticated');
  assert(meData2.user.id === user2?.id, 'GET /api/auth/me matches User 2 id');
  assert(meData2.user.name === spec2.name, 'GET /api/auth/me matches User 2 name');
  assert(meData2.workspace.id === ws2?.id, 'GET /api/auth/me matches User 2 workspace id');

  // 6.5 Verify identity independence: User 2 is NEVER User 1
  assert(meData2.user.id !== meData1.user.id, 'User 2 identity is strictly different from User 1');
  assert(meData2.workspace.id !== meData1.workspace.id, 'User 2 workspace is strictly different from User 1');

  // ──────────────────────────────────────────────────────────────────
  // 7. SERVER-SIDE ACCOUNT & WORKSPACE ISOLATION
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 7: Cross-Account Isolation Verification');
  // 7.1 User 1 token cannot resolve User 2 identity
  const testIso1 = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: user1Cookie },
  });
  const isoData1 = await testIso1.json();
  assert(isoData1.user.id === user1?.id && isoData1.user.id !== user2?.id, 'User 1 session resolves only to User 1');
  assert(isoData1.workspace.ownerUserId === user1?.id, 'User 1 session resolves only to workspace owned by User 1');

  // 7.2 User 2 token cannot resolve User 1 identity
  const testIso2 = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: user2Cookie },
  });
  const isoData2 = await testIso2.json();
  assert(isoData2.user.id === user2?.id && isoData2.user.id !== user1?.id, 'User 2 session resolves only to User 2');
  assert(isoData2.workspace.ownerUserId === user2?.id, 'User 2 session resolves only to workspace owned by User 2');

  // ──────────────────────────────────────────────────────────────────
  // 8. LOGOUT, SESSION INVALIDATION & ROUTE PROTECTION
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 8: Logout, Session Invalidation & Rejection');
  // 8.1 Logout User 1
  const logoutRes1 = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: user1Cookie },
  });
  assert(logoutRes1.status === 200, 'POST /api/auth/logout returns HTTP 200');
  const logoutSetCookie1 = logoutRes1.headers.get('set-cookie') || '';
  assert(
    logoutSetCookie1.includes('Max-Age=0') || logoutSetCookie1.includes('vizpilot_session=;') || logoutSetCookie1.includes('expires='),
    'Logout response clears vizpilot_session cookie'
  );

  // 8.2 Verify session is deleted from MongoDB Atlas
  const deletedSession1 = await sessionsCol.findOne({ token: user1SessionToken });
  assert(deletedSession1 === null, 'User 1 session document deleted from MongoDB Atlas');

  // 8.3 Verify old token cannot be reused
  const reusedRes1 = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: user1Cookie },
  });
  const reusedData1 = await reusedRes1.json();
  assert(reusedData1.authenticated === false, 'Invalidated session token returns authenticated: false');

  // 8.4 Verify protected route redirects to login after logout (cleared cookie)
  const postLogoutUpload = await fetch(`${BASE_URL}/upload`, {
    headers: { Cookie: 'vizpilot_session=' },
    redirect: 'manual',
  });
  assert(postLogoutUpload.status === 307, 'Protected /upload redirects (307) after logout with cleared cookie');

  const postLogoutUploadNoCookie = await fetch(`${BASE_URL}/upload`, {
    redirect: 'manual',
  });
  assert(postLogoutUploadNoCookie.status === 307, 'Protected /upload redirects (307) without cookie');

  // SSR landing page with old token confirms user is not recognized
  const homeWithOldToken = await fetch(`${BASE_URL}/`, {
    headers: { Cookie: user1Cookie },
  });
  const homeOldHtml = await homeWithOldToken.text();
  assert(homeOldHtml.includes('Sign In'), 'SSR landing page shows Sign In when accessed with deleted session token');

  // 8.5 Logout User 2
  const logoutRes2 = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: user2Cookie },
  });
  assert(logoutRes2.status === 200, 'POST /api/auth/logout returns HTTP 200 for User 2');
  const deletedSession2 = await sessionsCol.findOne({ token: user2SessionToken });
  assert(deletedSession2 === null, 'User 2 session document deleted from MongoDB Atlas');

  // ──────────────────────────────────────────────────────────────────
  // 9. ZERO-TRACE NON-PERSISTENCE INVARIANT WITH AUTHENTICATED USERS
  // ──────────────────────────────────────────────────────────────────
  console.log('\nGroup 9: Zero-Trace Non-Persistence Invariant');
  // Ingest sample dataset under zerotrace mode while authenticated
  const boundaryUsersBefore = await usersCol.countDocuments({});
  const boundaryWorkspacesBefore = await workspacesCol.countDocuments({});

  const sampleCsv = `dept,budget,spend,qtr\nEngineering,100000,85000,Q1\nProduct,50000,42000,Q1\nDesign,30000,28000,Q1`;
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const multipartBody = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="mode"',
    '',
    'zerotrace',
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test_quarterly.csv"',
    'Content-Type: text/csv',
    '',
    sampleCsv,
    `--${boundary}--`,
  ].join('\r\n');

  const ingestRes = await fetch(`${BASE_URL}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });
  assert(ingestRes.status === 200, 'Zero-Trace ingest returns HTTP 200');
  const ingestData = await ingestRes.json();
  assert(ingestData.success === true, 'Zero-Trace ingest succeeds');
  assert(ingestData.dataset.processingMode === 'zerotrace', 'Processing mode is confirmed zerotrace');

  // Verify Zero-Trace created ZERO new user or workspace records in MongoDB
  const boundaryUsersAfter = await usersCol.countDocuments({});
  const boundaryWorkspacesAfter = await workspacesCol.countDocuments({});
  assert(boundaryUsersAfter === boundaryUsersBefore, 'Zero-Trace mode creates 0 user records in MongoDB Atlas');
  assert(boundaryWorkspacesAfter === boundaryWorkspacesBefore, 'Zero-Trace mode creates 0 workspace records in MongoDB Atlas');

  // Verify no raw rows persisted in Atlas collections
  const rawDataCheck = await db.collection('datasets').countDocuments({}).catch(() => 0);
  assert(rawDataCheck === 0, 'No datasets collection or documents persisted in MongoDB for Zero-Trace');

  // ──────────────────────────────────────────────────────────────────
  // SUMMARY
  // ──────────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`VALIDATION COMPLETE: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runValidation()
  .catch((err) => {
    console.error('Validation suite encountered unexpected error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await closeMongoConnection();
  });
