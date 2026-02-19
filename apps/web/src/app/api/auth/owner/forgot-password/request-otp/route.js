import { sendOwnerPasswordResetOtpEmail } from '@/app/api/utils/otp-email';
import { getOwnerByEmail } from '@/app/api/utils/owner-auth-db';
import { savePasswordResetOtp } from '@/app/api/utils/owner-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'owner-forgot-password-request-otp',
    limit: 10,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();

    if (!email || !isEmailValid(email)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const owner = await getOwnerByEmail(email);
    if (!owner) {
      return Response.json({ error: 'Owner account not found' }, { status: 404 });
    }

    const { otp } = await savePasswordResetOtp({ email });
    const sent = await sendOwnerPasswordResetOtpEmail({
      email,
      otp,
      ownerName: owner.name,
    });
    if (!sent.ok) {
      return Response.json({ error: sent.error }, { status: 500 });
    }

    return Response.json({
      ok: true,
      message: 'Password reset OTP sent',
    });
  } catch (error) {
    console.error('Owner forgot-password request OTP failed:', error);
    return Response.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
