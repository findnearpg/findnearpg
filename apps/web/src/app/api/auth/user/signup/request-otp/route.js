import { sendUserSignupOtpEmail } from '@/app/api/utils/otp-email';
import { saveUserSignupOtp } from '@/app/api/utils/owner-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { getOwnerByEmailInUsers, getUserByEmail } from '@/app/api/utils/user-auth-db';
import { hash } from 'argon2';

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isMobileValid(mobile) {
  if (!mobile) return true;
  return /^[0-9]{10,15}$/.test(String(mobile || '').trim());
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'user-signup-request-otp',
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

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (!isEmailValid(email)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    if (!isMobileValid(mobile)) {
      return Response.json({ error: 'Please enter a valid mobile number' }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const ownerAccount = await getOwnerByEmailInUsers(email);
    if (ownerAccount) {
      return Response.json(
        { error: 'This email is owner-only. Please use owner sign in.' },
        { status: 409 }
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return Response.json(
        { error: 'User account already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password);
    const { otp } = await saveUserSignupOtp({
      name,
      email,
      mobile,
      passwordHash,
    });

    const sent = await sendUserSignupOtpEmail({
      email,
      otp,
      userName: name,
    });
    if (!sent.ok) {
      return Response.json({ error: sent.error || 'Failed to send OTP' }, { status: 500 });
    }

    return Response.json({
      ok: true,
      message: 'OTP sent to your email address',
    });
  } catch (error) {
    console.error('User signup request OTP failed:', error);
    return Response.json({ error: 'Failed to process signup request' }, { status: 500 });
  }
}
