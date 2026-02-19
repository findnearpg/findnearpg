import { getMongoDb } from '@/app/api/utils/mongodb';
import { sendUserHelpQueryEmail } from '@/app/api/utils/otp-email';
import { requireRoles } from '@/app/api/utils/session';

export async function POST(request) {
  const auth = await requireRoles(request, ['user']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || '').trim();
    const category = String(payload.category || 'general')
      .trim()
      .toLowerCase();

    if (subject.length < 5) {
      return Response.json({ error: 'Subject must be at least 5 characters' }, { status: 400 });
    }
    if (message.length < 15) {
      return Response.json({ error: 'Message must be at least 15 characters' }, { status: 400 });
    }

    const userId = Number(auth.session.userId || 0);
    if (!userId) {
      return Response.json({ error: 'Invalid user session' }, { status: 403 });
    }

    const db = await getMongoDb();
    const usersCol = db.collection('users');
    const user = await usersCol.findOne(
      {
        role: 'user',
        $or: [{ id: userId }, { userId }],
      },
      { projection: { _id: 0, name: 1, email: 1, mobile: 1, phone: 1 } }
    );

    if (!user) {
      return Response.json({ error: 'User account not found' }, { status: 404 });
    }

    const sent = await sendUserHelpQueryEmail({
      userName: String(user.name || `User #${userId}`),
      userEmail: String(user.email || ''),
      userMobile: String(user.mobile || user.phone || ''),
      subject,
      category,
      message,
      to: 'Findnearpg@gmail.com',
    });

    if (!sent.ok) {
      return Response.json(
        { error: sent.error || 'Failed to send support request' },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, message: 'Support request sent successfully.' });
  } catch (error) {
    console.error('User support request failed:', error);
    return Response.json({ error: 'Failed to send support request' }, { status: 500 });
  }
}
