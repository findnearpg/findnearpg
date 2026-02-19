import { getOwnerByEmail } from '@/app/api/utils/owner-auth-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { verify } from 'argon2';

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
    namespace: 'owner-signin',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const password = String(payload.password || '');

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const owner = await getOwnerByEmail(email);
    if (!owner) {
      return Response.json({ error: 'Owner account not found' }, { status: 404 });
    }
    if (owner.isBlocked) {
      return Response.json({ error: 'Owner account is blocked by admin' }, { status: 403 });
    }

    const hashValue = String(owner.passwordHash || '');
    const isArgonHash = hashValue.startsWith('$argon2');
    const validPassword = isArgonHash
      ? await verify(hashValue, password).catch(() => false)
      : hashValue === password;
    if (!validPassword) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        owner: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          mobile: owner.mobile,
        },
      }),
      {
        headers: withCookieHeaders([
          cookieConfig({ key: 'findnearpg_role', value: 'owner' }),
          cookieConfig({ key: 'findnearpg_user_id', value: String(owner.id) }),
          cookieConfig({ key: 'findnearpg_email', value: owner.email }),
          cookieConfig({ key: 'findnearpg_mobile', value: owner.mobile }),
          cookieConfig({ key: 'findnearpg_name', value: owner.name }),
          clearCookie('findnearpg_admin_role'),
          clearCookie('findnearpg_admin_user_id'),
          clearCookie('findnearpg_admin_email'),
          clearCookie('findnearpg_admin_name'),
        ]),
      }
    );
  } catch (error) {
    console.error('Owner signin failed:', error);
    return Response.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
