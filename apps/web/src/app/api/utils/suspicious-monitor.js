import { getBookingsCollection, getPropertiesCollection } from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';

function nowIso() {
  return new Date().toISOString();
}

function thirtyDaysAgoIso() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

async function collections() {
  const db = await getMongoDb();
  return {
    db,
    events: db.collection('suspicious_events'),
    views: db.collection('property_views'),
    ownerRisk: db.collection('owner_risk'),
  };
}

export async function trackSuspiciousEvent({
  eventType,
  ownerId,
  userId = null,
  propertyId = null,
  severity = 1,
  details = {},
}) {
  if (!eventType || !ownerId) return;
  const { events } = await collections();
  await events.insertOne({
    event_type: String(eventType),
    owner_id: Number(ownerId),
    user_id: userId ? Number(userId) : null,
    property_id: propertyId ? Number(propertyId) : null,
    severity: Number(severity) || 1,
    details,
    created_at: nowIso(),
  });
}

async function applyOwnerPenalty(ownerId, riskScore) {
  const properties = await getPropertiesCollection();
  let rankingPenaltyLevel = 'none';
  let featuredEligible = true;

  if (riskScore >= 60) {
    rankingPenaltyLevel = 'high';
    featuredEligible = false;
  } else if (riskScore >= 30) {
    rankingPenaltyLevel = 'medium';
    featuredEligible = false;
  } else if (riskScore >= 15) {
    rankingPenaltyLevel = 'low';
  }

  await properties.updateMany(
    { owner_id: Number(ownerId) },
    {
      $set: {
        ranking_penalty_level: rankingPenaltyLevel,
        featured_eligible: featuredEligible,
        updated_at: nowIso(),
      },
    }
  );

  return { rankingPenaltyLevel, featuredEligible };
}

export async function recomputeOwnerRisk(ownerId) {
  const normalizedOwnerId = Number(ownerId);
  if (!Number.isFinite(normalizedOwnerId)) return null;

  const { events, views, ownerRisk } = await collections();
  const properties = await getPropertiesCollection();
  const bookings = await getBookingsCollection();
  const since = thirtyDaysAgoIso();

  const ownerProperties = await properties
    .find({ owner_id: normalizedOwnerId }, { projection: { id: 1 } })
    .toArray();
  const propertyIds = ownerProperties.map((item) => Number(item.id)).filter(Number.isFinite);

  const recentEvents = await events
    .find({ owner_id: normalizedOwnerId, created_at: { $gte: since } })
    .toArray();

  const recentViews = propertyIds.length
    ? await views.countDocuments({ property_id: { $in: propertyIds }, created_at: { $gte: since } })
    : 0;

  const bookingDocs = propertyIds.length
    ? await bookings
        .find(
          { property_id: { $in: propertyIds }, created_at: { $gte: since } },
          { projection: { payment_status: 1, booking_status: 1, user_id: 1 } }
        )
        .toArray()
    : [];

  const paidBookings = bookingDocs.filter(
    (item) => String(item.payment_status || '').toLowerCase() === 'paid'
  ).length;
  const cancelledBookings = bookingDocs.filter((item) => {
    const status = String(item.booking_status || '').toLowerCase();
    return status === 'cancelled' || status === 'failed';
  });

  const conversionRate = recentViews > 0 ? paidBookings / recentViews : 0;
  const eventScore = recentEvents.reduce((sum, item) => sum + Number(item.severity || 1), 0);
  const highViewsNoConversion = recentViews >= 30 && paidBookings === 0;
  const weakConversion = recentViews >= 50 && conversionRate < 0.02;

  const pairCancelMap = new Map();
  for (const row of cancelledBookings) {
    const key = `${normalizedOwnerId}:${Number(row.user_id)}`;
    pairCancelMap.set(key, (pairCancelMap.get(key) || 0) + 1);
  }
  const repeatedPairCancels = [...pairCancelMap.values()].filter((count) => count >= 3).length;

  let riskScore = eventScore;
  if (highViewsNoConversion || weakConversion) riskScore += 20;
  if (cancelledBookings.length >= 5) riskScore += 12;
  if (repeatedPairCancels > 0) riskScore += repeatedPairCancels * 10;
  riskScore = Math.min(100, riskScore);

  const penalty = await applyOwnerPenalty(normalizedOwnerId, riskScore);
  const summary = {
    owner_id: normalizedOwnerId,
    risk_score: riskScore,
    risk_level:
      riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : riskScore >= 15 ? 'low' : 'normal',
    metrics: {
      recent_views: recentViews,
      paid_bookings: paidBookings,
      cancelled_or_failed_bookings: cancelledBookings.length,
      repeated_pair_cancels: repeatedPairCancels,
      conversion_rate: Number(conversionRate.toFixed(4)),
      suspicious_events_30d: recentEvents.length,
    },
    penalties: penalty,
    updated_at: nowIso(),
  };

  await ownerRisk.updateOne({ owner_id: normalizedOwnerId }, { $set: summary }, { upsert: true });

  return summary;
}

export async function getAdminRiskDashboard(limit = 20) {
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const { events, ownerRisk } = await collections();

  const topOwners = await ownerRisk
    .find({})
    .sort({ risk_score: -1, updated_at: -1 })
    .limit(normalizedLimit)
    .toArray();

  const recentEvents = await events.find({}).sort({ created_at: -1 }).limit(50).toArray();
  return { topOwners, recentEvents };
}

export async function recordPropertyView({ propertyId, ownerId, userId = null }) {
  const { views } = await collections();
  await views.insertOne({
    property_id: Number(propertyId),
    owner_id: Number(ownerId),
    user_id: userId ? Number(userId) : null,
    created_at: nowIso(),
  });
}
