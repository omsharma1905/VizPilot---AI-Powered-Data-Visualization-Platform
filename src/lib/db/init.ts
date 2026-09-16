import { getUsersCollection, getWorkspacesCollection, getSessionsCollection, getEmailVerificationsCollection } from './collections';

let _indexesInitialized = false;

/**
 * Initializes database indexes idempotently.
 */
export async function initializeDatabaseIndexes(): Promise<void> {
  if (_indexesInitialized) return;

  try {
    const [usersCol, workspacesCol, sessionsCol, emailVerificationsCol] = await Promise.all([
      getUsersCollection(),
      getWorkspacesCollection(),
      getSessionsCollection(),
      getEmailVerificationsCollection(),
    ]);

    await Promise.all([
      // Users indexes
      usersCol.createIndex(
        { emailNormalized: 1 },
        { unique: true, name: 'idx_users_email_normalized' }
      ),
      usersCol.createIndex(
        { id: 1 },
        { unique: true, name: 'idx_users_id' }
      ),

      // Workspaces indexes
      workspacesCol.createIndex(
        { id: 1 },
        { unique: true, name: 'idx_workspaces_id' }
      ),
      workspacesCol.createIndex(
        { ownerUserId: 1 },
        { name: 'idx_workspaces_owner_user_id' }
      ),

      // Sessions indexes
      sessionsCol.createIndex(
        { token: 1 },
        { unique: true, name: 'idx_sessions_token' }
      ),
      sessionsCol.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: 'idx_sessions_ttl' }
      ),
      sessionsCol.createIndex(
        { userId: 1 },
        { name: 'idx_sessions_user_id' }
      ),

      // Email verifications indexes
      emailVerificationsCol.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: 'idx_email_verifications_ttl' }
      ),
      emailVerificationsCol.createIndex(
        { userId: 1, purpose: 1 },
        { name: 'idx_email_verifications_user_purpose' }
      ),
      emailVerificationsCol.createIndex(
        { emailNormalized: 1 },
        { name: 'idx_email_verifications_email_norm' }
      ),
    ]);

    _indexesInitialized = true;
  } catch (err) {
    // If connection isn't available or already running, propagate or log
    console.error('[VizPilot DB] Failed to initialize database indexes:', err);
    throw err;
  }
}
