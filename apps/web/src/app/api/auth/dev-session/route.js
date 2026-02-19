const allowedRoles = ['user', 'owner', 'tenant'];

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

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const k = decodeURIComponent(part.slice(0, idx));
      const v = decodeURIComponent(part.slice(idx + 1));
      acc[k] = v;
      return acc;
    }, {});
}

function readSession(request) {
  const url = new URL(request.url);
  const scope = String(url.searchParams.get('scope') || '').toLowerCase();
  const cookies = parseCookies(request.headers.get('cookie'));

  const adminRoleRaw = cookies.findnearpg_admin_role || '';
  const adminRole = adminRoleRaw === 'tenant' ? 'user' : adminRoleRaw;
  const adminUserId = cookies.findnearpg_admin_user_id
    ? Number(cookies.findnearpg_admin_user_id)
    : null;
  const adminEmail = cookies.findnearpg_admin_email || null;
  const adminName = cookies.findnearpg_admin_name || null;

  const roleRaw = cookies.findnearpg_role || 'guest';
  const role = roleRaw === 'tenant' ? 'user' : roleRaw;
  const userId = cookies.findnearpg_user_id ? Number(cookies.findnearpg_user_id) : null;
  const email = cookies.findnearpg_email || null;
  const name = cookies.findnearpg_name || null;

  if (scope === 'admin' && adminRole === 'admin' && Number.isFinite(adminUserId)) {
    return {
      role: 'admin',
      userId: adminUserId,
      email: adminEmail,
      name: adminName,
    };
  }

  return {
    role,
    userId: Number.isFinite(userId) ? userId : null,
    email,
    name,
  };
}

export async function GET(request) {
  const session = readSession(request);
  return Response.json({
    ok: true,
    authenticated: session.role !== 'guest' && !!session.userId,
    ...session,
  });
}

export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Dev session route is disabled in production' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const incomingRole = String(payload.role || 'user').toLowerCase();
    const role = incomingRole === 'tenant' ? 'user' : incomingRole;
    const userId = Number(payload.userId || 1);
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();

    if (!allowedRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (!Number.isFinite(userId) || userId <= 0) {
      return Response.json({ error: 'Invalid userId' }, { status: 400 });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        role,
        userId,
      }),
      {
        headers: withCookieHeaders([
          cookieConfig({ key: 'findnearpg_role', value: role }),
          cookieConfig({ key: 'findnearpg_user_id', value: String(userId) }),
          cookieConfig({ key: 'findnearpg_email', value: email || 'owner@local.dev' }),
        ]),
      }
    );
  } catch {
    return Response.json({ error: 'Failed to set dev session' }, { status: 500 });
  }
}

export async function DELETE() {
  return new Response(
    JSON.stringify({
      ok: true,
    }),
    {
      headers: withCookieHeaders([
        clearCookie('findnearpg_role'),
        clearCookie('findnearpg_user_id'),
        clearCookie('findnearpg_email'),
        clearCookie('findnearpg_name'),
        clearCookie('findnearpg_mobile'),
        clearCookie('findnearpg_admin_role'),
        clearCookie('findnearpg_admin_user_id'),
        clearCookie('findnearpg_admin_email'),
        clearCookie('findnearpg_admin_name'),
      ]),
    }
  );
}
