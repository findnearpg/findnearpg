import { createOwner } from '@/app/api/utils/owner-auth-db';
import { verifyPendingOtp } from '@/app/api/utils/owner-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';

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
    namespace: 'owner-signup-verify-otp',
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

    const verified = await verifyPendingOtp({ email, otp, purpose: 'signup' });
    if (!verified.ok) {
      return Response.json({ error: verified.error }, { status: 400 });
    }

    const created = await createOwner({
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
        owner: {
          id: created.owner.id,
          name: created.owner.name,
          email: created.owner.email,
          mobile: created.owner.mobile,
        },
      }),
      {
        headers: withCookieHeaders([
          cookieConfig({ key: 'findnearpg_role', value: 'owner' }),
          cookieConfig({ key: 'findnearpg_user_id', value: String(created.owner.id) }),
          cookieConfig({ key: 'findnearpg_email', value: created.owner.email }),
          cookieConfig({ key: 'findnearpg_mobile', value: created.owner.mobile }),
          cookieConfig({ key: 'findnearpg_name', value: created.owner.name }),
          clearCookie('findnearpg_admin_role'),
          clearCookie('findnearpg_admin_user_id'),
          clearCookie('findnearpg_admin_email'),
          clearCookie('findnearpg_admin_name'),
        ]),
      }
    );
  } catch (error) {
    console.error('Owner signup verify OTP failed:', error);
    return Response.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
