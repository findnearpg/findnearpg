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

async function collection() {
  const db = await getMongoDb();
  const col = db.collection('admin_otps');
  if (!indexesReady) {
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await col.createIndex({ email: 1, purpose: 1 }, { unique: true });
    indexesReady = true;
  }
  return col;
}

export async function saveAdminSigninOtp({ email }) {
  const otp = generateOtp();
  const normalizedEmail = normalizeEmail(email);
  const col = await collection();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await col.updateOne(
    { email: normalizedEmail, purpose: 'signin' },
    {
      $set: {
        email: normalizedEmail,
        purpose: 'signin',
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

export async function verifyAdminSigninOtp({ email, otp }) {
  const normalizedEmail = normalizeEmail(email);
  const col = await collection();
  const pending = await col.findOne({ email: normalizedEmail, purpose: 'signin' });

  if (!pending) {
    return { ok: false, error: 'OTP request not found. Request a new OTP.' };
  }

  if (new Date() > new Date(pending.expiresAt)) {
    await col.deleteOne({ _id: pending._id });
    return { ok: false, error: 'OTP expired. Request a new OTP.' };
  }

  const nextAttempts = Number(pending.attempts || 0) + 1;
  if (nextAttempts > 5) {
    await col.deleteOne({ _id: pending._id });
    return { ok: false, error: 'Too many invalid attempts. Request a new OTP.' };
  }

  const providedHash = hashOtp(String(otp || '').trim());
  if (providedHash !== pending.otpHash) {
    await col.updateOne({ _id: pending._id }, { $set: { attempts: nextAttempts } });
    return { ok: false, error: 'Invalid OTP. Please try again.' };
  }

  await col.deleteOne({ _id: pending._id });
  return { ok: true };
}
