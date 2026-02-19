import { createDuplicateGuardLog } from '@/app/api/utils/duplicate-guard-logs';
import { getMongoDb } from '@/app/api/utils/mongodb';

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

function generateOwnerId(email) {
  const normalized = normalizeEmail(email);
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return (hash % 900000) + 100000;
}

function mapOwner(doc) {
  if (!doc) return null;
  return {
    id: Number(doc.ownerId || doc.id),
    name: doc.name,
    email: doc.email,
    mobile: doc.mobile,
    isBlocked: Boolean(doc.isBlocked),
    passwordHash: doc.passwordHash,
    verificationStatus: String(doc.verificationStatus || 'not_submitted'),
    verificationRejectionReason: doc.verificationRejectionReason || '',
    govtIdType: doc.govtIdType || '',
    govtIdUrl: doc.govtIdUrl || '',
    govtIdNumber: doc.govtIdNumber || '',
    govtIdUploadedAt: doc.govtIdUploadedAt || null,
    govtIdVerifiedAt: doc.govtIdVerifiedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toOwnerDocument(input) {
  const ownerId = Number(input.ownerId || input.userId || input.id);
  const now = new Date().toISOString();
  return {
    ownerId,
    role: 'owner',
    name: String(input.name || '').trim(),
    email: normalizeEmail(input.email || ''),
    mobile: normalizePhone(input.mobile || input.phone || ''),
    isBlocked: Boolean(input.isBlocked),
    passwordHash: String(input.passwordHash || ''),
    verificationStatus: String(input.verificationStatus || 'not_submitted'),
    verificationRejectionReason: String(input.verificationRejectionReason || ''),
    govtIdType: String(input.govtIdType || ''),
    govtIdUrl: String(input.govtIdUrl || ''),
    govtIdNumber: String(input.govtIdNumber || '')
      .trim()
      .toUpperCase(),
    govtIdUploadedAt: input.govtIdUploadedAt || null,
    govtIdVerifiedAt: input.govtIdVerifiedAt || null,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
}

async function ownersCollection() {
  const db = await getMongoDb();
  const collection = db.collection('owners');
  if (!indexesReady && !indexesAttempted) {
    indexesAttempted = true;
    try {
      await collection.createIndex({ ownerId: 1 }, { unique: true });
      await collection.createIndex({ email: 1 }, { unique: true });
      await collection.createIndex(
        { mobile: 1 },
        {
          unique: true,
          partialFilterExpression: { mobile: { $exists: true, $type: 'string', $ne: '' } },
        }
      );
      await collection.createIndex(
        { govtIdNumber: 1 },
        {
          unique: true,
          partialFilterExpression: { govtIdNumber: { $exists: true, $type: 'string', $ne: '' } },
        }
      );
      await collection.createIndex({ createdAt: -1 });
    } catch (error) {
      // Legacy datasets can have duplicate values; do not block auth/runtime.
      console.error('Owner index setup warning:', error);
    } finally {
      indexesReady = true;
    }
  }
  return collection;
}

async function legacyOwnersCollection() {
  const db = await getMongoDb();
  return db.collection('users');
}

async function migrateLegacyOwnerDoc(legacyDoc) {
  if (!legacyDoc) return null;
  const owners = await ownersCollection();
  const ownerDoc = toOwnerDocument(legacyDoc);
  if (!Number.isFinite(ownerDoc.ownerId)) return null;

  await owners.updateOne(
    { ownerId: ownerDoc.ownerId },
    {
      $setOnInsert: {
        createdAt: ownerDoc.createdAt,
      },
      $set: {
        role: 'owner',
        name: ownerDoc.name,
        email: ownerDoc.email,
        mobile: ownerDoc.mobile,
        isBlocked: ownerDoc.isBlocked,
        passwordHash: ownerDoc.passwordHash,
        verificationStatus: ownerDoc.verificationStatus,
        verificationRejectionReason: ownerDoc.verificationRejectionReason,
        govtIdType: ownerDoc.govtIdType,
        govtIdUrl: ownerDoc.govtIdUrl,
        govtIdNumber: ownerDoc.govtIdNumber,
        govtIdUploadedAt: ownerDoc.govtIdUploadedAt,
        govtIdVerifiedAt: ownerDoc.govtIdVerifiedAt,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  const saved = await owners.findOne({ ownerId: ownerDoc.ownerId });
  return mapOwner(saved);
}

async function fallbackFromLegacy(query) {
  const legacy = await legacyOwnersCollection();
  const doc = await legacy.findOne({ role: 'owner', ...query });
  if (!doc) return null;
  return migrateLegacyOwnerDoc(doc);
}

export async function listOwners() {
  const owners = await ownersCollection();
  const docs = await owners
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  const mapped = docs.map(mapOwner);
  if (mapped.length > 0) return mapped;

  // Fallback for older DBs where owners are still stored in users collection.
  const legacy = await legacyOwnersCollection();
  const legacyDocs = await legacy
    .find({ role: 'owner' }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  const migrated = await Promise.all(legacyDocs.map((doc) => migrateLegacyOwnerDoc(doc)));
  return migrated.filter(Boolean);
}

export async function getOwnerByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const collection = await ownersCollection();
  const doc = await collection.findOne({ email: normalizedEmail });
  if (doc) return mapOwner(doc);
  return fallbackFromLegacy({ email: normalizedEmail });
}

export async function getOwnerByMobile(mobile) {
  const normalizedMobile = normalizePhone(mobile);
  const collection = await ownersCollection();
  const doc = await collection.findOne({ mobile: normalizedMobile });
  if (doc) return mapOwner(doc);
  return fallbackFromLegacy({ mobile: normalizedMobile });
}

export async function getOwnerById(ownerId) {
  const id = Number(ownerId);
  if (!Number.isFinite(id)) return null;
  const collection = await ownersCollection();
  const doc = await collection.findOne({ ownerId: id });
  if (doc) return mapOwner(doc);
  return fallbackFromLegacy({ $or: [{ ownerId: id }, { userId: id }, { id }] });
}

export async function createOwner({ name, email, mobile, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedMobile = normalizePhone(mobile);
  const collection = await ownersCollection();

  const existing = await collection.findOne({ email: normalizedEmail });
  if (existing) {
    await createDuplicateGuardLog({
      entityType: 'owner',
      reasonCode: 'owner_email_exists',
      message: 'Owner create blocked because email already exists.',
      actorRole: 'owner_signup',
      actorEmail: normalizedEmail,
      attempted: { email: normalizedEmail, mobile: normalizedMobile },
      conflict: { ownerId: Number(existing.ownerId), conflictEmail: existing.email },
      endpoint: 'owner-auth-db:createOwner',
    });
    return { ok: false, error: 'Owner already exists' };
  }

  const existingByMobile = normalizedMobile
    ? await collection.findOne({ mobile: normalizedMobile })
    : null;
  if (existingByMobile) {
    await createDuplicateGuardLog({
      entityType: 'owner',
      reasonCode: 'owner_mobile_exists',
      message: 'Owner create blocked because mobile already exists under another owner.',
      actorRole: 'owner_signup',
      actorEmail: normalizedEmail,
      attempted: { email: normalizedEmail, mobile: normalizedMobile },
      conflict: {
        ownerId: Number(existingByMobile.ownerId),
        conflictEmail: existingByMobile.email,
        conflictMobile: existingByMobile.mobile,
      },
      endpoint: 'owner-auth-db:createOwner',
    });
    return {
      ok: false,
      error: `Mobile number already linked with ${existingByMobile.email || 'another owner account'}`,
    };
  }

  const ownerId = generateOwnerId(normalizedEmail);
  const now = new Date().toISOString();
  const document = {
    ownerId,
    role: 'owner',
    name: String(name || '').trim(),
    email: normalizedEmail,
    mobile: normalizedMobile,
    isBlocked: false,
    passwordHash: String(passwordHash || ''),
    verificationStatus: 'not_submitted',
    verificationRejectionReason: '',
    govtIdType: '',
    govtIdUrl: '',
    govtIdNumber: '',
    govtIdUploadedAt: null,
    govtIdVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await collection.insertOne(document);
  return { ok: true, owner: mapOwner(document) };
}

export async function updateOwnerPassword({ email, passwordHash }) {
  const normalizedEmail = normalizeEmail(email);
  const collection = await ownersCollection();

  const result = await collection.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        passwordHash: String(passwordHash || ''),
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );
  const updated = result?.value || result;

  if (!updated) {
    return { ok: false, error: 'Owner account not found' };
  }

  return { ok: true, owner: mapOwner(updated) };
}

export async function updateOwnerProfile({ ownerId, name, mobile }) {
  const id = Number(ownerId);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Owner account not found' };
  }

  const collection = await ownersCollection();
  const normalizedMobile = normalizePhone(mobile);
  const existingByMobile = normalizedMobile
    ? await collection.findOne({
        mobile: normalizedMobile,
        ownerId: { $ne: id },
      })
    : null;
  if (existingByMobile) {
    return {
      ok: false,
      error: `Mobile number already linked with ${existingByMobile.email || 'another owner account'}`,
    };
  }

  const result = await collection.findOneAndUpdate(
    { ownerId: id },
    {
      $set: {
        name: String(name || '').trim(),
        mobile: normalizedMobile,
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: 'after' }
  );
  const updated = result?.value || result;

  if (!updated) {
    return { ok: false, error: 'Owner account not found' };
  }
  return { ok: true, owner: mapOwner(updated) };
}

export async function updateOwnerVerificationSubmission({
  ownerId,
  govtIdType,
  govtIdUrl,
  govtIdNumber = '',
}) {
  const id = Number(ownerId);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Owner account not found' };
  }

  const collection = await ownersCollection();
  const normalizedGovtIdNumber = String(govtIdNumber || '')
    .trim()
    .toUpperCase();
  if (normalizedGovtIdNumber) {
    const duplicateGovtId = await collection.findOne({
      govtIdNumber: normalizedGovtIdNumber,
      ownerId: { $ne: id },
    });
    if (duplicateGovtId) {
      await createDuplicateGuardLog({
        entityType: 'owner_kyc',
        reasonCode: 'govt_id_number_exists',
        message:
          'Owner KYC submission blocked because government document number is already linked.',
        actorRole: 'owner',
        actorId: id,
        attempted: {
          govtIdType: String(govtIdType || '').trim(),
          govtIdNumber: normalizedGovtIdNumber,
        },
        conflict: {
          ownerId: Number(duplicateGovtId.ownerId),
          conflictGovtIdType: duplicateGovtId.govtIdType || '',
        },
        endpoint: 'owner-auth-db:updateOwnerVerificationSubmission',
      });
      return {
        ok: false,
        error: 'This government document number is already linked with another owner.',
      };
    }
  }
  const now = new Date().toISOString();
  const result = await collection.findOneAndUpdate(
    { ownerId: id },
    {
      $set: {
        govtIdType: String(govtIdType || '').trim(),
        govtIdUrl: String(govtIdUrl || '').trim(),
        govtIdNumber: normalizedGovtIdNumber,
        govtIdUploadedAt: now,
        verificationStatus: 'pending',
        verificationRejectionReason: '',
        govtIdVerifiedAt: null,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  );
  const updated = result?.value || result;
  if (!updated) {
    return { ok: false, error: 'Owner account not found' };
  }
  return { ok: true, owner: mapOwner(updated) };
}

export async function setOwnerVerificationStatus({ ownerId, status, rejectionReason = '' }) {
  const id = Number(ownerId);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Owner account not found' };
  }
  const normalizedStatus = String(status || '')
    .trim()
    .toLowerCase();
  if (!['approved', 'rejected', 'pending'].includes(normalizedStatus)) {
    return { ok: false, error: 'Invalid verification status' };
  }

  const collection = await ownersCollection();
  const now = new Date().toISOString();
  const result = await collection.findOneAndUpdate(
    { ownerId: id },
    {
      $set: {
        verificationStatus: normalizedStatus,
        verificationRejectionReason:
          normalizedStatus === 'rejected' ? String(rejectionReason || '').trim() : '',
        govtIdVerifiedAt: normalizedStatus === 'approved' ? now : null,
        updatedAt: now,
      },
    },
    { returnDocument: 'after' }
  );
  const updated = result?.value || result;
  if (!updated) {
    return { ok: false, error: 'Owner account not found' };
  }
  return { ok: true, owner: mapOwner(updated) };
}
