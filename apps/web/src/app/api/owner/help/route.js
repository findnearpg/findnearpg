import { sendOwnerHelpQueryEmail } from '@/app/api/utils/otp-email';
import { getOwnerById } from '@/app/api/utils/owner-auth-db';
import { requireRoles } from '@/app/api/utils/session';

export async function POST(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const subject = String(payload.subject || '').trim();
    const message = String(payload.message || '').trim();
    const category = String(payload.category || 'general').trim();
    if (!subject || subject.length < 5) {
      return Response.json({ error: 'Subject must be at least 5 characters' }, { status: 400 });
    }
    if (!message || message.length < 15) {
      return Response.json({ error: 'Message must be at least 15 characters' }, { status: 400 });
    }

    const owner = await getOwnerById(auth.session.userId);
    if (!owner) {
      return Response.json({ error: 'Owner account not found' }, { status: 404 });
    }

    const sent = await sendOwnerHelpQueryEmail({
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerMobile: owner.mobile,
      subject,
      category,
      message,
      to: 'Findnearpg@gmail.com',
    });
    if (!sent.ok) {
      return Response.json({ error: sent.error || 'Failed to send help request' }, { status: 500 });
    }

    return Response.json({ ok: true, message: 'Your query has been sent to support.' });
  } catch (error) {
    console.error('Owner help request failed:', error);
    return Response.json({ error: 'Failed to send help request' }, { status: 500 });
  }
}
