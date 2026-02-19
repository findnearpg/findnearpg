import { getOwnerByEmailInUsers, getUserByEmail } from '@/app/api/utils/user-auth-db';
import { verify } from 'argon2';

function cookieConfig({ key, value, maxAge = 60 * 60 * 24 * 30 }) {
  return `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(key) {
  return `${key}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function withCookieHeaders(cookies) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return headers;
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const password = String(payload.password || '');

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const ownerAccount = await getOwnerByEmailInUsers(email);
    if (ownerAccount) {
      return Response.json(
        { error: 'This account is owner-only. Please use owner sign in.' },
        { status: 403 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return Response.json({ error: 'User account not found' }, { status: 404 });
    }

    const valid = await verify(user.passwordHash, password).catch(() => false);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return new Response(JSON.stringify({ ok: true, user }), {
      headers: withCookieHeaders([
        cookieConfig({ key: 'findnearpg_role', value: 'user' }),
        cookieConfig({ key: 'findnearpg_user_id', value: String(user.id) }),
        cookieConfig({ key: 'findnearpg_email', value: user.email }),
        cookieConfig({ key: 'findnearpg_name', value: user.name }),
        clearCookie('findnearpg_admin_role'),
        clearCookie('findnearpg_admin_user_id'),
        clearCookie('findnearpg_admin_email'),
        clearCookie('findnearpg_admin_name'),
      ]),
    });
  } catch (error) {
    console.error('User signin failed:', error);
    return Response.json({ error: 'Failed to sign in' }, { status: 500 });
  }
}
