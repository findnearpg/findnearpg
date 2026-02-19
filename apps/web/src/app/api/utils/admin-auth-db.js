import { getMongoDb } from '@/app/api/utils/mongodb';

let indexesReady = false;

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function mapAdmin(doc) {
  if (!doc) return null;
  return {
    id: Number(doc.adminId),
    name: String(doc.name || 'Admin'),
    email: normalizeEmail(doc.email),
    passwordHash: String(doc.passwordHash || ''),
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function adminsCollection() {
  const db = await getMongoDb();
  const collection = db.collection('admins');
  if (!indexesReady) {
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ adminId: 1 }, { unique: true });
    indexesReady = true;
  }
  return collection;
}

function generateAdminId(email) {
  const normalized = normalizeEmail(email);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return (hash % 900000) + 100000;
}

export async function getAdminByEmail(email) {
  const collection = await adminsCollection();
  const doc = await collection.findOne({ email: normalizeEmail(email) });
  return mapAdmin(doc);
}

export async function createAdmin({ name, email, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);
  const collection = await adminsCollection();
  const existing = await collection.findOne({ email: normalizedEmail });
  if (existing) {
    return { ok: false, error: 'Admin already exists' };
  }

  const adminId = generateAdminId(normalizedEmail);
  const now = new Date().toISOString();
  const doc = {
    adminId,
    name: String(name || 'Admin').trim(),
    email: normalizedEmail,
    passwordHash: String(passwordHash || ''),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  return { ok: true, admin: mapAdmin(doc) };
}

export async function updateAdminPassword({ email, passwordHash }) {
  const collection = await adminsCollection();
  const result = await collection.findOneAndUpdate(
    { email: normalizeEmail(email) },
    {
      $set: {
        passwordHash: String(passwordHash || ''),
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );
  const updated = result?.value || result;
  if (!updated) return { ok: false, error: 'Admin not found' };
  return { ok: true, admin: mapAdmin(updated) };
}
