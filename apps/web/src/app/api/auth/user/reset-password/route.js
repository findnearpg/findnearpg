import { getMongoDb } from '@/app/api/utils/mongodb';
import { requireRoles } from '@/app/api/utils/session';
import { updateUserPasswordById } from '@/app/api/utils/user-auth-db';
import { hash, verify } from 'argon2';

export async function POST(request) {
  const auth = await requireRoles(request, ['user']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const currentPassword = String(payload.currentPassword || '');
    const newPassword = String(payload.newPassword || '');
    if (!currentPassword || !newPassword) {
      return Response.json({ error: 'Current and new passwords are required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return Response.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const userId = Number(auth.session.userId || 0);
    if (!userId) return Response.json({ error: 'Invalid user session' }, { status: 403 });

    const db = await getMongoDb();
    const usersCol = db.collection('users');
    const user = await usersCol.findOne(
      { role: 'user', $or: [{ id: userId }, { userId }] },
      { projection: { _id: 0, passwordHash: 1 } }
    );
    if (!user?.passwordHash) {
      return Response.json({ error: 'User account not found' }, { status: 404 });
    }

    const valid = await verify(String(user.passwordHash), currentPassword).catch(() => false);
    if (!valid) {
      return Response.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const nextHash = await hash(newPassword);
    const updated = await updateUserPasswordById(userId, nextHash);
    if (!updated.ok)
      return Response.json({ error: updated.error || 'Failed to reset password' }, { status: 500 });

    return Response.json({ ok: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('User reset password failed:', error);
    return Response.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
