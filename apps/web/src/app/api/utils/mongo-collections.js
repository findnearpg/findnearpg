import { getMongoDb } from '@/app/api/utils/mongodb';

let indexesReady = false;

async function ensureIndexes() {
  if (indexesReady) return;

  const db = await getMongoDb();
  await Promise.all([
    db.collection('properties').createIndex({ id: 1 }, { unique: true }),
    db.collection('properties').createIndex({ slug: 1 }, { unique: true }),
    db.collection('properties').createIndex({ owner_id: 1 }),
    db.collection('properties').createIndex({ is_approved: 1 }),
    db
      .collection('properties')
      .createIndex({ normalized_title: 1, normalized_city: 1, normalized_area: 1 }),
    db.collection('properties').createIndex({ property_license_number: 1 }, { sparse: true }),
    db.collection('bookings').createIndex({ id: 1 }, { unique: true }),
    db.collection('bookings').createIndex({ user_id: 1 }),
    db.collection('bookings').createIndex({ property_id: 1 }),
    db.collection('bookings').createIndex({ transaction_id: 1 }, { sparse: true }),
    db.collection('reviews').createIndex({ id: 1 }, { unique: true }),
    db.collection('reviews').createIndex({ property_id: 1, created_at: -1 }),
    db.collection('reviews').createIndex({ booking_id: 1 }, { unique: true, sparse: true }),
    // _id index already exists and is unique by default in MongoDB.
    db
      .collection('counters')
      .createIndex({ _id: 1 }),
  ]);

  indexesReady = true;
}

export async function getPropertiesCollection() {
  await ensureIndexes();
  const db = await getMongoDb();
  return db.collection('properties');
}

export async function getBookingsCollection() {
  await ensureIndexes();
  const db = await getMongoDb();
  return db.collection('bookings');
}

export async function getReviewsCollection() {
  await ensureIndexes();
  const db = await getMongoDb();
  return db.collection('reviews');
}

export async function getNextSequence(counterName) {
  await ensureIndexes();
  const db = await getMongoDb();
  const counters = db.collection('counters');
  const updated = await counters.findOneAndUpdate(
    { _id: String(counterName) },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );

  const value = updated?.value || updated;
  const seq = Number(value?.seq || 1);
  return seq;
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function mapPropertyDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  const isApproved = Boolean(rest.is_approved);
  return {
    ...rest,
    id: Number(rest.id),
    listing_status: rest.listing_status || (isApproved ? 'live' : 'under_review'),
  };
}

export function mapBookingDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: Number(rest.id),
  };
}
