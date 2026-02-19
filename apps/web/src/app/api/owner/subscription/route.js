import { getMongoDb } from '@/app/api/utils/mongodb';
import {
  OWNER_PLAN_CATALOG,
  getOwnerSubscription,
  getPlanByCode,
  isSubscriptionActive,
  updateOwnerSubscription,
} from '@/app/api/utils/owner-subscription-store';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const ownerId = Number(auth.session.userId);
  if (!Number.isFinite(ownerId)) {
    return Response.json({ error: 'Owner context missing' }, { status: 400 });
  }

  const subscription = await getOwnerSubscription(ownerId);
  const db = await getMongoDb();
  const propertyCount = await db.collection('properties').countDocuments({ owner_id: ownerId });
  const ownerProperties = await db
    .collection('properties')
    .find({ owner_id: ownerId }, { projection: { id: 1 } })
    .toArray();
  const propertyIds = ownerProperties.map((item) => Number(item.id)).filter(Number.isFinite);
  const bookingCount = propertyIds.length
    ? await db.collection('bookings').countDocuments({ property_id: { $in: propertyIds } })
    : 0;
  const active = isSubscriptionActive(subscription);
  const freePropertyLimit = Number(subscription?.freePropertyLimit ?? 1);
  const freeBookingDetailsLimit = Number(subscription?.freeBookingDetailsLimit ?? 1);
  const planPropertyLimit = active
    ? Number(subscription?.propertyLimit ?? freePropertyLimit)
    : freePropertyLimit;
  const canAddProperty = propertyCount < planPropertyLimit;
  const canViewAllBookingDetails = active || bookingCount <= freeBookingDetailsLimit;

  return Response.json({
    ...subscription,
    active,
    plans: OWNER_PLAN_CATALOG,
    propertyCount,
    bookingCount,
    canAddProperty,
    canViewAllBookingDetails,
    planPropertyLimit,
    freePropertyLimit,
    freeBookingDetailsLimit,
  });
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const ownerId =
      auth.session.role === 'admin' ? Number(payload.ownerId) : Number(auth.session.userId);
    if (!Number.isFinite(ownerId) || ownerId <= 0) {
      return Response.json({ error: 'Valid ownerId is required' }, { status: 400 });
    }

    const action = String(payload.action || 'activate')
      .trim()
      .toLowerCase();
    if (!['activate', 'cancel'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'cancel') {
      const updated = await updateOwnerSubscription(ownerId, {
        status: 'inactive',
        planCode: 'free',
        planName: 'Free Starter',
        durationMonths: 0,
        priceInr: 0,
        originalPriceInr: 0,
        propertyLimit: 1,
        startsAt: null,
        expiresAt: null,
        updatedAt: new Date().toISOString(),
      });
      if (!updated.ok) {
        return Response.json({ error: updated.error }, { status: 400 });
      }
      return Response.json({ ok: true, subscription: updated.subscription });
    }

    const planCode = String(payload.planCode || '')
      .trim()
      .toLowerCase();
    const plan = getPlanByCode(planCode);
    if (!plan) {
      return Response.json({ error: 'Invalid planCode' }, { status: 400 });
    }
    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setMonth(expiresAt.getMonth() + Number(plan.durationMonths));

    const updated = await updateOwnerSubscription(ownerId, {
      status: 'active',
      planCode: plan.code,
      planName: plan.name,
      durationMonths: Number(plan.durationMonths),
      priceInr: Number(plan.priceInr),
      originalPriceInr: Number(plan.originalPriceInr || plan.priceInr),
      propertyLimit: Number(plan.propertyLimit || 1),
      startsAt: startsAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    if (!updated.ok) {
      return Response.json({ error: updated.error }, { status: 400 });
    }

    return Response.json({ ok: true, subscription: updated.subscription });
  } catch (error) {
    console.error('Failed to update owner subscription:', error);
    return Response.json({ error: 'Failed to update owner subscription' }, { status: 500 });
  }
}
