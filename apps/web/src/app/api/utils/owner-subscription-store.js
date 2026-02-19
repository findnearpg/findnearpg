import { getMongoDb } from '@/app/api/utils/mongodb';

export const OWNER_PLAN_CATALOG = [
  {
    code: 'monthly',
    name: 'Monthly Saver',
    durationMonths: 1,
    priceInr: 199,
    originalPriceInr: 299,
    propertyLimit: 1,
  },
  {
    code: 'quarterly',
    name: 'Quarterly Plus',
    durationMonths: 3,
    priceInr: 499,
    originalPriceInr: 799,
    propertyLimit: 2,
  },
  {
    code: 'yearly',
    name: 'Yearly Max',
    durationMonths: 12,
    priceInr: 999,
    originalPriceInr: 1499,
    propertyLimit: 3,
  },
];

function defaultSubscription(ownerId) {
  return {
    ownerId,
    status: 'inactive',
    planCode: 'free',
    planName: 'Free Starter',
    durationMonths: 0,
    priceInr: 0,
    startsAt: null,
    expiresAt: null,
    freePropertyLimit: 1,
    propertyLimit: 1,
    freeBookingDetailsLimit: 1,
    features: {
      canAddProperties: true,
      fullBookingDetails: false,
      prioritySupport: false,
    },
    updatedAt: new Date().toISOString(),
  };
}

async function collection() {
  const db = await getMongoDb();
  const col = db.collection('subscriptions');
  await col.createIndex({ ownerId: 1 }, { unique: true });
  return col;
}

export async function getOwnerSubscription(ownerId) {
  const normalizedOwnerId = Number(ownerId);
  if (!Number.isFinite(normalizedOwnerId)) return null;

  const col = await collection();
  const existing = await col.findOne({ ownerId: normalizedOwnerId });
  if (existing) {
    const { _id, ...rest } = existing;
    return rest;
  }

  const initial = defaultSubscription(normalizedOwnerId);
  await col.insertOne(initial);
  return initial;
}

export async function updateOwnerSubscription(ownerId, updates) {
  const current = await getOwnerSubscription(ownerId);
  if (!current) {
    return { ok: false, error: 'Invalid owner id' };
  }

  const next = {
    ...current,
    ...updates,
    ownerId: current.ownerId,
    updatedAt: new Date().toISOString(),
  };

  const col = await collection();
  await col.updateOne({ ownerId: current.ownerId }, { $set: next }, { upsert: true });
  return { ok: true, subscription: next };
}

export function isSubscriptionActive(subscription) {
  if (!subscription) return false;
  if (String(subscription.status || '').toLowerCase() !== 'active') return false;
  if (!subscription.expiresAt) return true;
  const expiresAt = new Date(subscription.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() >= Date.now();
}

export function getPlanByCode(planCode) {
  const code = String(planCode || '')
    .trim()
    .toLowerCase();
  return OWNER_PLAN_CATALOG.find((plan) => plan.code === code) || null;
}
