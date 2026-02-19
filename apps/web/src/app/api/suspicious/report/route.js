import { toNumber } from '@/app/api/utils/mongo-collections';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { getSessionFromRequest } from '@/app/api/utils/session';
import { recomputeOwnerRisk, trackSuspiciousEvent } from '@/app/api/utils/suspicious-monitor';

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'suspicious:report',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const propertyId = toNumber(payload.propertyId);
    const ownerId = toNumber(payload.ownerId);
    const reason = String(payload.reason || 'direct_contact_attempt').trim();
    const details = String(payload.details || '').trim();
    const session = await getSessionFromRequest(request);
    const userId = session?.userId ? Number(session.userId) : toNumber(payload.userId);

    if (!propertyId || !ownerId || !userId) {
      return Response.json(
        { error: 'propertyId, ownerId and user context are required' },
        { status: 400 }
      );
    }

    await trackSuspiciousEvent({
      eventType: reason,
      ownerId,
      userId,
      propertyId,
      severity: 18,
      details: {
        source: 'tenant-report',
        details,
      },
    });
    await recomputeOwnerRisk(ownerId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to report suspicious activity:', error);
    return Response.json({ error: 'Failed to report suspicious activity' }, { status: 500 });
  }
}
