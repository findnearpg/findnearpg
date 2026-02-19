import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbNameFromEnv = process.env.MONGODB_DB || '';

if (!uri) {
  throw new Error('MONGODB_URI is required');
}

const dbNameFromUri = (() => {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname || '';
    return pathname.replace(/^\//, '') || 'findnearpg';
  } catch {
    return 'findnearpg';
  }
})();

const dbName = dbNameFromEnv || dbNameFromUri;

if (!globalThis.__findnearpgMongoClientPromise) {
  const client = new MongoClient(uri, {
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 80),
    minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 5),
    maxIdleTimeMS: Number(process.env.MONGODB_MAX_IDLE_MS || 30_000),
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10_000),
    connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS || 10_000),
  });
  globalThis.__findnearpgMongoClientPromise = client.connect();
}
const clientPromise = globalThis.__findnearpgMongoClientPromise;

export async function getMongoDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
