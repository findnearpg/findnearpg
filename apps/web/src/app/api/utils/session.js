import { getOwnerById } from '@/app/api/utils/owner-auth-db';
import { getToken } from '@auth/core/jwt';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf('=');
      if (index === -1) return cookies;
      const key = decodeURIComponent(part.slice(0, index));
      const value = decodeURIComponent(part.slice(index + 1));
      cookies[key] = value;
      return cookies;
    }, {});
}

function parseNumber(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeRole(role) {
  if (role === null || role === undefined || String(role).trim() === '') return '';
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'tenant') return 'user';
  return normalized || 'user';
}

export async function getSessionFromRequest(request) {
  const headers = request.headers;
  const requestUrl = new URL(request.url);
  const pathname = requestUrl.pathname || '';
  const isAdminScoped = pathname.startsWith('/api/admin');
  const cookies = parseCookies(headers.get('cookie'));

  const rawRoleFromHeader = headers.get('x-user-role');
  const roleFromHeader = rawRoleFromHeader ? normalizeRole(rawRoleFromHeader) : '';
  const idFromHeader = parseNumber(headers.get('x-user-id'));

  const roleFromCookie = cookies.findnearpg_role;
  const idFromCookie = parseNumber(cookies.findnearpg_user_id);
  const adminRoleFromCookie = normalizeRole(cookies.findnearpg_admin_role || '');
  const adminIdFromCookie = parseNumber(cookies.findnearpg_admin_user_id);

  const canUseHeaderSession = Boolean(roleFromHeader && idFromHeader && roleFromHeader !== 'admin');
  if (canUseHeaderSession) {
    return {
      role: roleFromHeader,
      userId: idFromHeader,
      source: 'headers',
      token: null,
    };
  }

  if (isAdminScoped && adminRoleFromCookie === 'admin' && adminIdFromCookie) {
    return {
      role: 'admin',
      userId: adminIdFromCookie,
      source: 'admin-cookies',
      token: null,
    };
  }

  if (roleFromCookie || idFromCookie) {
    return {
      role: normalizeRole(roleFromCookie || 'user'),
      userId: idFromCookie,
      source: 'cookies',
      token: null,
    };
  }

  if (!process.env.AUTH_SECRET) {
    return {
      role: 'guest',
      userId: null,
      source: 'none',
      token: null,
    };
  }

  try {
    const authUrl = process.env.AUTH_URL || '';
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: authUrl.startsWith('https'),
    });

    return {
      role: normalizeRole(token?.role || 'user'),
      userId: token?.sub ? Number(token.sub) || token.sub : null,
      source: 'auth-token',
      token,
    };
  } catch {
    return {
      role: 'guest',
      userId: null,
      source: 'none',
      token: null,
    };
  }
}

export async function requireRoles(request, allowedRoles) {
  const session = await getSessionFromRequest(request);

  if (session.role === 'owner' && session.userId && allowedRoles.includes('owner')) {
    const owner = await getOwnerById(session.userId);
    if (owner?.isBlocked) {
      return {
        ok: false,
        session,
        response: Response.json({ error: 'Owner account is blocked' }, { status: 403 }),
      };
    }
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      ok: false,
      session,
      response: Response.json({ error: 'Forbidden', requiredRoles: allowedRoles }, { status: 403 }),
    };
  }

  return { ok: true, session, response: null };
}
