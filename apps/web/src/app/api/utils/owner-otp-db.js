import crypto from 'node:crypto';
import { getMongoDb } from '@/app/api/utils/mongodb';

let indexesReady = false;

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

async function otpCollection() {
  const db = await getMongoDb();
  const collection = db.collection('otp_codes');

  if (!indexesReady) {
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ email: 1, purpose: 1 }, { unique: true });
    indexesReady = true;
  }

  return collection;
}

export async function saveSignupOtp({ name, email, mobile, passwordHash }) {
  const otp = generateOtp();
  const normalizedEmail = normalizeEmail(email);
  const collection = await otpCollection();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await collection.updateOne(
    {
      email: normalizedEmail,
      purpose: 'signup',
    },
    {
      $set: {
        email: normalizedEmail,
        purpose: 'signup',
        otpHash: hashOtp(otp),
        attempts: 0,
        name: String(name || '').trim(),
        mobile: String(mobile || '').trim(),
        passwordHash: String(passwordHash || ''),
        createdAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );

  return { otp, expiresAt: expiresAt.getTime() };
}

export async function saveUserSignupOtp({ name, email, mobile, passwordHash }) {
  const otp = generateOtp();
  const normalizedEmail = normalizeEmail(email);
  const collection = await otpCollection();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await collection.updateOne(
    {
      email: normalizedEmail,
      purpose: 'user-signup',
    },
    {
      $set: {
        email: normalizedEmail,
        purpose: 'user-signup',
        otpHash: hashOtp(otp),
        attempts: 0,
        name: String(name || '').trim(),
        mobile: String(mobile || '').trim(),
        passwordHash: String(passwordHash || ''),
        createdAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );

  return { otp, expiresAt: expiresAt.getTime() };
}

export async function savePasswordResetOtp({ email }) {
  const otp = generateOtp();
  const normalizedEmail = normalizeEmail(email);
  const collection = await otpCollection();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await collection.updateOne(
    {
      email: normalizedEmail,
      purpose: 'password-reset',
    },
    {
      $set: {
        email: normalizedEmail,
        purpose: 'password-reset',
        otpHash: hashOtp(otp),
        attempts: 0,
        createdAt: now,
        expiresAt,
      },
    },
    { upsert: true }
  );

  return { otp, expiresAt: expiresAt.getTime() };
}

export async function verifyPendingOtp({ email, otp, purpose }) {
  const normalizedEmail = normalizeEmail(email);
  const collection = await otpCollection();

  const pending = await collection.findOne({
    email: normalizedEmail,
    purpose,
  });

  if (!pending) {
    return { ok: false, error: 'OTP request not found. Please request a new OTP.' };
  }

  if (new Date() > new Date(pending.expiresAt)) {
    await collection.deleteOne({ _id: pending._id });
    return { ok: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  const nextAttempts = Number(pending.attempts || 0) + 1;
  if (nextAttempts > 5) {
    await collection.deleteOne({ _id: pending._id });
    return { ok: false, error: 'Too many invalid attempts. Request a new OTP.' };
  }

  const providedHash = hashOtp(String(otp || '').trim());
  if (providedHash !== pending.otpHash) {
    await collection.updateOne({ _id: pending._id }, { $set: { attempts: nextAttempts } });
    return { ok: false, error: 'Invalid OTP. Please try again.' };
  }

  // Delete OTP immediately after successful verification.
  await collection.deleteOne({ _id: pending._id });

  return {
    ok: true,
    pending: {
      email: pending.email,
      name: pending.name || '',
      mobile: pending.mobile || '',
      passwordHash: pending.passwordHash || '',
    },
  };
}
