import { MongoClient, type Db } from 'mongodb';

const DEFAULT_DB_NAME = 'vizpilot';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim().length > 0);
}

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim().length === 0) {
    throw new Error(
      'MONGODB_URI environment variable is not defined. Please set MONGODB_URI in your .env configuration.'
    );
  }
  return uri.trim();
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || DEFAULT_DB_NAME;
}

/**
 * Returns the cached MongoClient promise or creates a new reusable client.
 * In development, utilizes globalThis to preserve connection across HMR.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = getMongoUri();

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      global._mongoClient = client;
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // Production environment
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });
    global._mongoClient = client;
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

/**
 * Returns a handle to the MongoDB Database instance.
 */
export async function getMongoDb(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName || getDbName());
}

/**
 * Gracefully close the MongoDB client connection (useful for testing or shutdown).
 */
export async function closeMongoConnection(): Promise<void> {
  if (global._mongoClient) {
    await global._mongoClient.close();
    global._mongoClient = undefined;
    global._mongoClientPromise = undefined;
  }
}
