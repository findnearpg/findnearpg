import { getMongoDb } from '@/app/api/utils/mongodb';
import { requireRoles } from '@/app/api/utils/session';

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').trim();
}

export async function POST(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const db = await getMongoDb();
    const usersCol = db.collection('users');
    const ownersCol = db.collection('owners');

    const legacyOwners = await usersCol
      .find({ role: 'owner' }, { projection: { _id: 0 } })
      .toArray();

    let migrated = 0;
    let updated = 0;
    let skipped = 0;

    for (const legacy of legacyOwners) {
      const ownerId = Number(legacy.ownerId || legacy.userId || legacy.id);
      const email = normalizeEmail(legacy.email);
      if (!Number.isFinite(ownerId) || !email) {
        skipped += 1;
        continue;
      }

      const mobile = normalizePhone(legacy.mobile || legacy.phone || '');
      const existing = await ownersCol.findOne({ ownerId });
      const payload = {
        ownerId,
        role: 'owner',
        name: String(legacy.name || '').trim(),
        email,
        mobile,
        isBlocked: Boolean(legacy.isBlocked),
        passwordHash: String(legacy.passwordHash || ''),
        verificationStatus: String(legacy.verificationStatus || 'not_submitted'),
        verificationRejectionReason: String(legacy.verificationRejectionReason || ''),
        govtIdType: String(legacy.govtIdType || ''),
        govtIdUrl: String(legacy.govtIdUrl || ''),
        govtIdNumber: String(legacy.govtIdNumber || '')
          .trim()
          .toUpperCase(),
        govtIdUploadedAt: legacy.govtIdUploadedAt || null,
        govtIdVerifiedAt: legacy.govtIdVerifiedAt || null,
        createdAt: legacy.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await ownersCol.updateOne(
        { ownerId },
        {
          $setOnInsert: { createdAt: payload.createdAt },
          $set: payload,
        },
        { upsert: true }
      );

      if (existing) updated += 1;
      else migrated += 1;
    }

    return Response.json({
      ok: true,
      totalLegacyOwners: legacyOwners.length,
      migrated,
      updated,
      skipped,
      message: 'Owner migration completed into owners collection',
    });
  } catch (error) {
    console.error('Owner migration failed:', error);
    return Response.json({ error: 'Failed to migrate owners' }, { status: 500 });
  }
}
