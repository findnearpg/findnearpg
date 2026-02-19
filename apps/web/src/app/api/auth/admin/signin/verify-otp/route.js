import { getAdminByEmail } from '@/app/api/utils/admin-auth-db';
import { verifyAdminSigninOtp } from '@/app/api/utils/admin-otp-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';

function cookieConfig({ key, value, maxAge = 60 * 60 * 8 }) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Strict; HttpOnly${secure}`;
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

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'admin-signin-verify-otp',
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

    if (!email || !otp || !isEmailValid(email)) {
      return Response.json({ error: 'Valid email and OTP are required' }, { status: 400 });
    }

    const admin = await getAdminByEmail(email);
    if (!admin || !admin.isActive) {
      return Response.json({ error: 'Admin account not found' }, { status: 404 });
    }

    const verified = await verifyAdminSigninOtp({ email, otp });
    if (!verified.ok) {
      return Response.json({ error: verified.error }, { status: 400 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
      }),
      {
        headers: withCookieHeaders([
          cookieConfig({ key: 'findnearpg_role', value: 'admin' }),
          cookieConfig({ key: 'findnearpg_user_id', value: String(admin.id) }),
          cookieConfig({ key: 'findnearpg_email', value: admin.email }),
          cookieConfig({ key: 'findnearpg_name', value: admin.name }),
          cookieConfig({ key: 'findnearpg_admin_role', value: 'admin' }),
          cookieConfig({ key: 'findnearpg_admin_user_id', value: String(admin.id) }),
          cookieConfig({ key: 'findnearpg_admin_email', value: admin.email }),
          cookieConfig({ key: 'findnearpg_admin_name', value: admin.name }),
        ]),
      }
    );
  } catch (error) {
    console.error('Admin signin verify OTP failed:', error);
    return Response.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
