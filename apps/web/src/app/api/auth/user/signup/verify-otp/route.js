import { verifyPendingOtp } from '@/app/api/utils/owner-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { createUser } from '@/app/api/utils/user-auth-db';

function cookieConfig({ key, value, maxAge = 60 * 60 * 24 * 30 }) {
  return `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(key) {
  return `${key}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function withCookieHeaders(cookies) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  for (const cookie of cookies) {
    headers.append('Set-Cookie', cookie);
  }
  return headers;
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'user-signup-verify-otp',
    limit: 15,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const otp = String(payload.otp || '').trim();

    if (!email || !otp) {
      return Response.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const verified = await verifyPendingOtp({ email, otp, purpose: 'user-signup' });
    if (!verified.ok) {
      return Response.json({ error: verified.error }, { status: 400 });
    }

    const created = await createUser({
      name: verified.pending.name,
      email: verified.pending.email,
      mobile: verified.pending.mobile,
      passwordHash: verified.pending.passwordHash,
    });

    if (!created.ok) {
      return Response.json({ error: created.error }, { status: 409 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user: {
          id: created.user.id,
          name: created.user.name,
          email: created.user.email,
          mobile: created.user.mobile,
        },
      }),
      {
        headers: withCookieHeaders([
          cookieConfig({ key: 'findnearpg_role', value: 'user' }),
          cookieConfig({ key: 'findnearpg_user_id', value: String(created.user.id) }),
          cookieConfig({ key: 'findnearpg_email', value: created.user.email }),
          cookieConfig({ key: 'findnearpg_name', value: created.user.name }),
          clearCookie('findnearpg_admin_role'),
          clearCookie('findnearpg_admin_user_id'),
          clearCookie('findnearpg_admin_email'),
          clearCookie('findnearpg_admin_name'),
        ]),
      }
    );
  } catch (error) {
    console.error('User signup verify OTP failed:', error);
    return Response.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
