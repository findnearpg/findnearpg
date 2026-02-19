import { getMongoDb } from '@/app/api/utils/mongodb';
import { ObjectId } from 'mongodb';

let indexesReady = false;

async function notificationsCollection() {
  const db = await getMongoDb();
  const collection = db.collection('notifications');
  if (!indexesReady) {
    await collection.createIndex({ owner_id: 1, created_at: -1 });
    await collection.createIndex({ is_read: 1 });
    indexesReady = true;
  }
  return collection;
}

export async function createOwnerNotification({ ownerId, type, title, message, meta = {} }) {
  const owner_id = Number(ownerId);
  if (!Number.isFinite(owner_id)) return { ok: false, error: 'Invalid owner id' };

  const collection = await notificationsCollection();
  const now = new Date().toISOString();
  const doc = {
    owner_id,
    type: String(type || 'general'),
    title: String(title || 'Notification'),
    message: String(message || ''),
    meta,
    is_read: false,
    created_at: now,
    updated_at: now,
  };

  await collection.insertOne(doc);
  return { ok: true };
}

export async function listOwnerNotifications(ownerId, limit = 50) {
  const owner_id = Number(ownerId);
  if (!Number.isFinite(owner_id)) return [];
  const collection = await notificationsCollection();
  const docs = await collection.find({ owner_id }).sort({ created_at: -1 }).limit(limit).toArray();
  return docs.map((doc) => ({
    id: String(doc._id),
    owner_id: Number(doc.owner_id),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    meta: doc.meta || {},
    is_read: Boolean(doc.is_read),
    created_at: doc.created_at,
    updated_at: doc.updated_at || doc.created_at,
  }));
}

export async function markAllOwnerNotificationsRead(ownerId) {
  const owner_id = Number(ownerId);
  if (!Number.isFinite(owner_id)) return { ok: false, error: 'Invalid owner id' };
  const collection = await notificationsCollection();
  const result = await collection.updateMany(
    { owner_id, is_read: false },
    { $set: { is_read: true, updated_at: new Date().toISOString() } }
  );
  return {
    ok: true,
    matched: Number(result.matchedCount || 0),
    modified: Number(result.modifiedCount || 0),
  };
}

export async function markOwnerNotificationRead(ownerId, notificationId) {
  const owner_id = Number(ownerId);
  if (!Number.isFinite(owner_id)) return { ok: false, error: 'Invalid owner id' };
  const id = String(notificationId || '').trim();
  if (!id) return { ok: false, error: 'Notification id is required' };
  if (!ObjectId.isValid(id)) return { ok: false, error: 'Invalid notification id' };

  const collection = await notificationsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id), owner_id },
    { $set: { is_read: true, updated_at: new Date().toISOString() } }
  );

  if (!result.matchedCount) return { ok: false, error: 'Notification not found' };
  return {
    ok: true,
    matched: Number(result.matchedCount || 0),
    modified: Number(result.modifiedCount || 0),
  };
}
