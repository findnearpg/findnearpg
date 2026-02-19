import {
  listOwnerNotifications,
  markAllOwnerNotificationsRead,
  markOwnerNotificationRead,
} from '@/app/api/utils/owner-notifications-db';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['owner']);
  if (!auth.ok) return auth.response;

  try {
    const ownerId = Number(auth.session.userId);
    const notifications = await listOwnerNotifications(ownerId, 100);
    return Response.json(notifications);
  } catch (error) {
    console.error('Failed to fetch owner notifications:', error);
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['owner']);
  if (!auth.ok) return auth.response;

  try {
    const ownerId = Number(auth.session.userId);
    const payload = await request.json().catch(() => ({}));
    const notificationId = String(payload?.notificationId || '').trim();
    const updated = notificationId
      ? await markOwnerNotificationRead(ownerId, notificationId)
      : await markAllOwnerNotificationsRead(ownerId);
    if (!updated.ok) return Response.json({ error: updated.error }, { status: 400 });
    return Response.json({
      ok: true,
      mode: notificationId ? 'single' : 'all',
      matched: updated.matched || 0,
      modified: updated.modified || 0,
    });
  } catch (error) {
    console.error('Failed to update owner notifications:', error);
    return Response.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
