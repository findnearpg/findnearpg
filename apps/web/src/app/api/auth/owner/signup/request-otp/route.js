import { createDuplicateGuardLog } from '@/app/api/utils/duplicate-guard-logs';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { sendOwnerSignupOtpEmail } from '@/app/api/utils/otp-email';
import { getOwnerByEmail, getOwnerByMobile } from '@/app/api/utils/owner-auth-db';
import { saveSignupOtp } from '@/app/api/utils/owner-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { hash } from 'argon2';

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isMobileValid(mobile) {
  return /^[0-9]{10,15}$/.test(String(mobile || '').trim());
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'owner-signup-request-otp',
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const mobile = String(payload.mobile || '').trim();
    const password = String(payload.password || '');

    if (!name || !email || !mobile || !password) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!isEmailValid(email)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    if (!isMobileValid(mobile)) {
      return Response.json({ error: 'Please enter a valid mobile number' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await getOwnerByEmail(email);
    if (existing) {
      await createDuplicateGuardLog({
        entityType: 'owner',
        reasonCode: 'owner_email_exists',
        message: 'Owner signup blocked because email already exists.',
        actorRole: 'owner_signup',
        actorEmail: email,
        attempted: { email, mobile },
        conflict: { ownerId: existing.id, conflictEmail: existing.email },
        endpoint: '/api/auth/owner/signup/request-otp',
      });
      return Response.json(
        { error: 'Owner account already exists. Please sign in.' },
        { status: 409 }
      );
    }
    const existingMobile = await getOwnerByMobile(mobile);
    if (existingMobile && String(existingMobile.email || '').toLowerCase() !== email) {
      await createDuplicateGuardLog({
        entityType: 'owner',
        reasonCode: 'owner_mobile_exists',
        message: 'Owner signup blocked because mobile number is already linked with another owner.',
        actorRole: 'owner_signup',
        actorEmail: email,
        attempted: { email, mobile },
        conflict: {
          ownerId: existingMobile.id,
          conflictEmail: existingMobile.email,
          conflictMobile: existingMobile.mobile,
        },
        endpoint: '/api/auth/owner/signup/request-otp',
      });
      return Response.json(
        {
          error: `Mobile number already linked with ${existingMobile.email || 'another owner account'}`,
        },
        { status: 409 }
      );
    }

    const db = await getMongoDb();
    const pendingSignup = await db.collection('otp_codes').findOne({
      purpose: 'signup',
      mobile,
      email: { $ne: email },
      expiresAt: { $gt: new Date() },
    });
    if (pendingSignup) {
      await createDuplicateGuardLog({
        entityType: 'owner',
        reasonCode: 'owner_mobile_pending_signup',
        message:
          'Owner signup blocked because mobile number is already used in another pending signup.',
        actorRole: 'owner_signup',
        actorEmail: email,
        attempted: { email, mobile },
        conflict: {
          pendingEmail: pendingSignup.email || '',
          pendingMobile: pendingSignup.mobile || '',
        },
        endpoint: '/api/auth/owner/signup/request-otp',
      });
      return Response.json(
        { error: 'Mobile number already used in another pending owner signup request' },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password);
    const { otp } = await saveSignupOtp({
      name,
      email,
      mobile,
      passwordHash,
    });

    const sent = await sendOwnerSignupOtpEmail({
      email,
      otp,
      ownerName: name,
    });
    if (!sent.ok) {
      return Response.json({ error: sent.error }, { status: 500 });
    }

    return Response.json({
      ok: true,
      message: 'OTP sent to your email address',
    });
  } catch (error) {
    console.error('Owner signup request OTP failed:', error);
    return Response.json({ error: 'Failed to process signup request' }, { status: 500 });
  }
}
