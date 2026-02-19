import { getAdminByEmail } from '@/app/api/utils/admin-auth-db';
import { saveAdminSigninOtp } from '@/app/api/utils/admin-otp-db';
import { sendAdminSigninOtpEmail } from '@/app/api/utils/otp-email';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { verify } from 'argon2';

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'admin-signin-request-otp',
    limit: 8,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const password = String(payload.password || '');
    if (!email || !password || !isEmailValid(email)) {
      return Response.json({ error: 'Valid email and password are required' }, { status: 400 });
    }

    const admin = await getAdminByEmail(email);
    if (!admin || !admin.isActive || !admin.passwordHash) {
      return Response.json({ error: 'Admin account not found' }, { status: 404 });
    }

    const validPassword = await verify(admin.passwordHash, password).catch(() => false);
    if (!validPassword) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { otp } = await saveAdminSigninOtp({ email });
    const sent = await sendAdminSigninOtpEmail({
      email,
      otp,
      adminName: admin.name,
    });
    if (!sent.ok) {
      return Response.json({ error: sent.error || 'Failed to send OTP' }, { status: 500 });
    }

    return Response.json({
      ok: true,
      message: 'OTP sent to admin email',
      maskedEmail: email.replace(/(^.).+(@.*$)/, '$1***$2'),
    });
  } catch (error) {
    console.error('Admin signin request OTP failed:', error);
    return Response.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
