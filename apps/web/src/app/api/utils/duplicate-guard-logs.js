import { getMongoDb } from '@/app/api/utils/mongodb';

let duplicateLogIndexesReady = false;

async function getDuplicateGuardLogsCollection() {
  const db = await getMongoDb();
  const collection = db.collection('duplicate_guard_logs');

  if (!duplicateLogIndexesReady) {
    await Promise.all([
      collection.createIndex({ created_at: -1 }),
      collection.createIndex({ entity_type: 1, reason_code: 1, created_at: -1 }),
      collection.createIndex({ actor_id: 1, created_at: -1 }),
    ]);
    duplicateLogIndexesReady = true;
  }

  return collection;
}

function mapLog(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    created_at: doc.created_at || null,
    entity_type: doc.entity_type || '',
    reason_code: doc.reason_code || '',
    message: doc.message || '',
    actor_role: doc.actor_role || '',
    actor_id: doc.actor_id ?? null,
    actor_email: doc.actor_email || '',
    attempted: doc.attempted || {},
    conflict: doc.conflict || {},
    endpoint: doc.endpoint || '',
  };
}

export async function createDuplicateGuardLog({
  entityType,
  reasonCode,
  message,
  actorRole = '',
  actorId = null,
  actorEmail = '',
  attempted = {},
  conflict = {},
  endpoint = '',
}) {
  try {
    const collection = await getDuplicateGuardLogsCollection();
    await collection.insertOne({
      created_at: new Date().toISOString(),
      entity_type: String(entityType || '').trim(),
      reason_code: String(reasonCode || '').trim(),
      message: String(message || '').trim(),
      actor_role: String(actorRole || '').trim(),
      actor_id: Number.isFinite(Number(actorId)) ? Number(actorId) : null,
      actor_email: String(actorEmail || '')
        .trim()
        .toLowerCase(),
      attempted: attempted && typeof attempted === 'object' ? attempted : {},
      conflict: conflict && typeof conflict === 'object' ? conflict : {},
      endpoint: String(endpoint || '').trim(),
    });
  } catch (error) {
    console.error('Failed to create duplicate guard log:', error);
  }
}

export async function listDuplicateGuardLogs({
  limit = 50,
  entityType = '',
  reasonCode = '',
} = {}) {
  const collection = await getDuplicateGuardLogsCollection();
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));

  const query = {};
  if (entityType) query.entity_type = String(entityType).trim();
  if (reasonCode) query.reason_code = String(reasonCode).trim();

  const docs = await collection.find(query).sort({ created_at: -1 }).limit(safeLimit).toArray();
  return docs.map(mapLog);
}
