import { updateOwnerPassword } from '@/app/api/utils/owner-auth-db';
import { verifyPendingOtp } from '@/app/api/utils/owner-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { hash } from 'argon2';

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'owner-forgot-password-reset',
    limit: 12,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const otp = String(payload.otp || '').trim();
    const newPassword = String(payload.newPassword || '');

    if (!email || !otp || !newPassword) {
      return Response.json({ error: 'Email, OTP and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const verified = await verifyPendingOtp({ email, otp, purpose: 'password-reset' });
    if (!verified.ok) {
      return Response.json({ error: verified.error }, { status: 400 });
    }

    const passwordHash = await hash(newPassword);
    const updated = await updateOwnerPassword({ email, passwordHash });
    if (!updated.ok) {
      return Response.json({ error: updated.error }, { status: 404 });
    }

    return Response.json({
      ok: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Owner password reset failed:', error);
    return Response.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
