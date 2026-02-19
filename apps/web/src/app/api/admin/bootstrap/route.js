import { createAdmin, getAdminByEmail } from '@/app/api/utils/admin-auth-db';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { hash } from 'argon2';

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'admin-bootstrap',
    limit: 5,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const setupKey = String(request.headers.get('x-admin-bootstrap-key') || '');
    const expectedKey = String(process.env.ADMIN_BOOTSTRAP_KEY || '');
    if (!expectedKey || setupKey !== expectedKey) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await request.json();
    const name = String(payload.name || 'Admin').trim();
    const email = String(payload.email || '')
      .trim()
      .toLowerCase();
    const password = String(payload.password || '');

    if (!isEmailValid(email) || password.length < 8) {
      return Response.json(
        { error: 'Valid email and minimum 8-char password are required' },
        { status: 400 }
      );
    }

    const exists = await getAdminByEmail(email);
    if (exists) {
      return Response.json({ error: 'Admin already exists' }, { status: 409 });
    }

    const passwordHash = await hash(password);
    const created = await createAdmin({ name, email, passwordHash });
    if (!created.ok) {
      return Response.json({ error: created.error || 'Failed to create admin' }, { status: 400 });
    }

    return Response.json({
      ok: true,
      admin: {
        id: created.admin.id,
        name: created.admin.name,
        email: created.admin.email,
      },
      message: 'Admin created in admins collection',
    });
  } catch (error) {
    console.error('Admin bootstrap failed:', error);
    return Response.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
