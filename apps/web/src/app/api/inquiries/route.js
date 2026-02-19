import { getNextSequence, toNumber } from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { getSessionFromRequest } from '@/app/api/utils/session';

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'inquiries:create',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const propertyId = toNumber(payload.propertyId);
    const message = String(payload.message || '').trim();
    const session = await getSessionFromRequest(request);
    const userId = session?.userId ? Number(session.userId) : toNumber(payload.userId);

    if (!propertyId || !userId || !message) {
      return Response.json(
        { error: 'propertyId, user context, and message are required' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const inquiries = db.collection('enquiries');
    const now = new Date().toISOString();
    const id = await getNextSequence('enquiries');

    const document = {
      id,
      property_id: Number(propertyId),
      user_id: Number(userId),
      message,
      verification_status: 'verified',
      status: 'open',
      created_at: now,
      updated_at: now,
    };

    await inquiries.insertOne(document);
    return Response.json(
      { ok: true, inquiryId: id, verificationStatus: 'verified' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return Response.json({ error: 'Failed to create inquiry' }, { status: 500 });
  }
}
