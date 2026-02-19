import { getNextSequence } from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { getOwnerByEmail } from '@/app/api/utils/owner-auth-db';

let indexesReady = false;
let indexesAttempted = false;

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

function mapUser(doc) {
  if (!doc) return null;
  return {
    id: Number(doc.userId || doc.id),
    name: String(doc.name || ''),
    email: String(doc.email || ''),
    mobile: String(doc.mobile || doc.phone || ''),
    passwordHash: String(doc.passwordHash || ''),
  };
}

async function usersCollection() {
  const db = await getMongoDb();
  const collection = db.collection('users');

  if (!indexesReady && !indexesAttempted) {
    indexesAttempted = true;
    try {
      await collection.createIndex(
        { email: 1, role: 1 },
        { unique: true, partialFilterExpression: { role: 'user' } }
      );
      await collection.createIndex(
        { mobile: 1, role: 1 },
        {
          unique: true,
          partialFilterExpression: {
            role: 'user',
            mobile: { $exists: true, $gt: '' },
          },
        }
      );
    } catch (error) {
      // Keep auth working for legacy datasets with duplicate values.
      console.error('User index setup warning:', error);
    } finally {
      indexesReady = true;
    }
  }

  return collection;
}

export async function getUserByEmail(email) {
  const collection = await usersCollection();
  const doc = await collection.findOne({ email: normalizeEmail(email), role: 'user' });
  return mapUser(doc);
}

export async function getOwnerByEmailInUsers(email) {
  return getOwnerByEmail(email);
}

export async function createUser({ name, email, mobile, passwordHash }) {
  const collection = await usersCollection();
  const normalizedEmail = normalizeEmail(email);
  const normalizedMobile = normalizePhone(mobile);

  const existingUser = await collection.findOne({ email: normalizedEmail, role: 'user' });
  if (existingUser) return { ok: false, error: 'User email already exists' };

  const ownerExists = await getOwnerByEmail(normalizedEmail);
  if (ownerExists) {
    return { ok: false, error: 'This email is already registered as owner. Use owner sign in.' };
  }

  if (normalizedMobile) {
    const existingMobile = await collection.findOne({ mobile: normalizedMobile, role: 'user' });
    if (existingMobile) return { ok: false, error: 'Mobile number already registered' };
  }

  const now = new Date().toISOString();
  const userId = await getNextSequence('users');

  const doc = {
    userId,
    id: userId,
    role: 'user',
    name: String(name || '').trim(),
    email: normalizedEmail,
    mobile: normalizedMobile,
    passwordHash: String(passwordHash || ''),
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(doc);
  return { ok: true, user: mapUser(doc) };
}

export async function updateUserPasswordById(userId, passwordHash) {
  const collection = await usersCollection();
  const normalizedId = Number(userId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return { ok: false, error: 'Invalid userId' };
  }

  const result = await collection.updateOne(
    {
      role: 'user',
      $or: [{ id: normalizedId }, { userId: normalizedId }],
    },
    {
      $set: {
        passwordHash: String(passwordHash || ''),
        updatedAt: new Date().toISOString(),
      },
    }
  );

  if (!result.matchedCount) {
    return { ok: false, error: 'User not found' };
  }
  return { ok: true };
}
