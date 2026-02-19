import { getMongoDb } from '@/app/api/utils/mongodb';
import { sendOwnerVerificationStatusEmail } from '@/app/api/utils/otp-email';
import { listOwners, setOwnerVerificationStatus } from '@/app/api/utils/owner-auth-db';
import { createOwnerNotification } from '@/app/api/utils/owner-notifications-db';
import { requireRoles } from '@/app/api/utils/session';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const db = await getMongoDb();
    const owners = await listOwners();
    const propertiesCol = db.collection('properties');
    const bookingsCol = db.collection('bookings');

    const ownerIds = owners.map((owner) => Number(owner.id)).filter(Number.isFinite);
    const [propertyCounts, bookingCounts] = await Promise.all([
      propertiesCol
        .aggregate([
          { $match: { owner_id: { $in: ownerIds } } },
          { $group: { _id: '$owner_id', total: { $sum: 1 } } },
        ])
        .toArray(),
      bookingsCol
        .aggregate([
          {
            $lookup: {
              from: 'properties',
              localField: 'property_id',
              foreignField: 'id',
              as: 'property',
            },
          },
          { $unwind: '$property' },
          { $match: { 'property.owner_id': { $in: ownerIds } } },
          { $group: { _id: '$property.owner_id', total: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    const propertyMap = new Map(
      propertyCounts.map((item) => [Number(item._id), Number(item.total || 0)])
    );
    const bookingMap = new Map(
      bookingCounts.map((item) => [Number(item._id), Number(item.total || 0)])
    );

    const result = owners.map((owner) => ({
      id: Number(owner.id),
      name: owner.name || '-',
      email: owner.email || '-',
      mobile: owner.mobile || '-',
      isBlocked: Boolean(owner.isBlocked),
      verificationStatus: String(owner.verificationStatus || 'not_submitted'),
      verificationRejectionReason: owner.verificationRejectionReason || '',
      govtIdType: owner.govtIdType || '',
      govtIdUrl: owner.govtIdUrl || '',
      govtIdNumber: owner.govtIdNumber || '',
      govtIdUploadedAt: owner.govtIdUploadedAt || null,
      govtIdVerifiedAt: owner.govtIdVerifiedAt || null,
      properties: propertyMap.get(Number(owner.id)) || 0,
      bookings: bookingMap.get(Number(owner.id)) || 0,
      createdAt: owner.createdAt || null,
      updatedAt: owner.updatedAt || null,
    }));

    return Response.json(result);
  } catch (error) {
    console.error('Failed to fetch owner details:', error);
    return Response.json({ error: 'Failed to fetch owner details' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const ownerId = Number(payload.ownerId);
    const action = String(payload.action || '')
      .trim()
      .toLowerCase();
    const adminMessage = String(payload.message || '').trim();
    if (!Number.isFinite(ownerId) || ownerId <= 0) {
      return Response.json({ error: 'Valid ownerId is required' }, { status: 400 });
    }
    if (!['edit', 'block', 'unblock', 'verify', 'reject-verification'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = await getMongoDb();
    const ownersCol = db.collection('owners');
    const propertiesCol = db.collection('properties');
    const query = { ownerId };
    const existing = await ownersCol.findOne(query);
    if (!existing) {
      return Response.json({ error: 'Owner not found' }, { status: 404 });
    }

    if (action === 'edit') {
      const name = String(payload.name || '').trim();
      const email = normalizeEmail(payload.email);
      const mobile = String(payload.mobile || '').trim();

      if (!name || !email || !mobile) {
        return Response.json({ error: 'Name, email and mobile are required' }, { status: 400 });
      }
      if (!isValidEmail(email)) {
        return Response.json({ error: 'Invalid email format' }, { status: 400 });
      }
      if (!/^[0-9]{10,15}$/.test(mobile)) {
        return Response.json({ error: 'Invalid mobile number' }, { status: 400 });
      }

      const emailOwner = await ownersCol.findOne({
        email,
        ownerId: { $ne: ownerId },
      });
      if (emailOwner) {
        return Response.json({ error: 'Email already used by another owner' }, { status: 409 });
      }
      const mobileOwner = await ownersCol.findOne({
        mobile,
        ownerId: { $ne: ownerId },
      });
      if (mobileOwner) {
        return Response.json(
          { error: `Mobile number already linked with ${mobileOwner.email || 'another owner'}` },
          { status: 409 }
        );
      }

      await ownersCol.updateOne(query, {
        $set: {
          name,
          email,
          mobile,
          updatedAt: new Date().toISOString(),
        },
      });
    } else if (action === 'block' || action === 'unblock') {
      const shouldBlock = action === 'block';
      await ownersCol.updateOne(query, {
        $set: {
          isBlocked: shouldBlock,
          updatedAt: new Date().toISOString(),
        },
      });

      if (shouldBlock) {
        // Enforce: blocked owners cannot keep listings live.
        await propertiesCol.updateMany(
          { owner_id: ownerId },
          {
            $set: {
              is_approved: false,
              listing_status: 'under_review',
              updated_at: new Date().toISOString(),
            },
          }
        );
      }

      const defaultMessage =
        action === 'block'
          ? 'Your owner account has been blocked by admin due to policy or risk concerns.'
          : 'Your owner account has been unblocked by admin. You can continue using owner features.';
      await createOwnerNotification({
        ownerId,
        type: action === 'block' ? 'account_blocked' : 'account_unblocked',
        title: action === 'block' ? 'Account Blocked by Admin' : 'Account Unblocked by Admin',
        message: adminMessage || defaultMessage,
        meta: {
          action,
          ownerId,
        },
      });
    } else {
      if (action === 'verify') {
        if (!existing.govtIdUrl) {
          return Response.json(
            { error: 'Owner has not uploaded a government ID document yet.' },
            { status: 400 }
          );
        }
        const verificationUpdated = await setOwnerVerificationStatus({
          ownerId,
          status: 'approved',
        });
        if (!verificationUpdated.ok) {
          return Response.json({ error: verificationUpdated.error }, { status: 400 });
        }

        await createOwnerNotification({
          ownerId,
          type: 'owner_verification_approved',
          title: 'Owner Verification Approved',
          message: 'Your government ID has been approved. You can now add properties.',
          meta: { action: 'verify', ownerId },
        });

        if (existing.email) {
          await sendOwnerVerificationStatusEmail({
            email: existing.email,
            ownerName: existing.name,
            statusLabel: 'Approved',
            reason: '',
          });
        }
      } else {
        const reason = String(payload.reason || payload.rejectionReason || '').trim();
        if (reason.length < 5) {
          return Response.json(
            { error: 'Rejection reason is required (minimum 5 characters)' },
            { status: 400 }
          );
        }
        const verificationUpdated = await setOwnerVerificationStatus({
          ownerId,
          status: 'rejected',
          rejectionReason: reason,
        });
        if (!verificationUpdated.ok) {
          return Response.json({ error: verificationUpdated.error }, { status: 400 });
        }

        await createOwnerNotification({
          ownerId,
          type: 'owner_verification_rejected',
          title: 'Owner Verification Rejected',
          message: `Verification rejected. Reason: ${reason}`,
          meta: { action: 'reject-verification', ownerId, reason },
        });

        if (existing.email) {
          await sendOwnerVerificationStatusEmail({
            email: existing.email,
            ownerName: existing.name,
            statusLabel: 'Rejected',
            reason,
          });
        }
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to update owner:', error);
    return Response.json({ error: 'Failed to update owner' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const ownerIdFromQuery = Number(url.searchParams.get('ownerId'));
    const body = await request.json().catch(() => ({}));
    const ownerId = Number(body.ownerId ?? ownerIdFromQuery);
    if (!Number.isFinite(ownerId) || ownerId <= 0) {
      return Response.json({ error: 'Valid ownerId is required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const ownersCol = db.collection('owners');
    const propertiesCol = db.collection('properties');
    const bookingsCol = db.collection('bookings');
    const notificationsCol = db.collection('notifications');
    const subscriptionsCol = db.collection('subscriptions');

    const owner = await ownersCol.findOne({ ownerId });
    if (!owner) {
      return Response.json({ error: 'Owner not found' }, { status: 404 });
    }

    const ownerProperties = await propertiesCol
      .find({ owner_id: ownerId }, { projection: { id: 1 } })
      .toArray();
    const propertyIds = ownerProperties.map((item) => Number(item.id)).filter(Number.isFinite);
    const bookingCount = propertyIds.length
      ? await bookingsCol.countDocuments({ property_id: { $in: propertyIds } })
      : 0;

    if (propertyIds.length > 0 || bookingCount > 0) {
      return Response.json(
        {
          error: 'Cannot delete owner with existing properties/bookings. Use block option instead.',
        },
        { status: 400 }
      );
    }

    await ownersCol.deleteOne({ ownerId });
    await notificationsCol.deleteMany({ owner_id: ownerId });
    await subscriptionsCol.deleteMany({ ownerId });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete owner:', error);
    return Response.json({ error: 'Failed to delete owner' }, { status: 500 });
  }
}
