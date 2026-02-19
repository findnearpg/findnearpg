import { getPropertiesCollection, mapPropertyDoc } from '@/app/api/utils/mongo-collections';
import { sendOwnerListingStatusEmail } from '@/app/api/utils/otp-email';
import { getOwnerById } from '@/app/api/utils/owner-auth-db';
import { createOwnerNotification } from '@/app/api/utils/owner-notifications-db';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const properties = await getPropertiesCollection();
    const docs = await properties.find({}).sort({ created_at: 1, id: 1 }).limit(100).toArray();
    return Response.json(docs.map(mapPropertyDoc));
  } catch (error) {
    console.error('Error fetching admin properties:', error);
    return Response.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const id = Number(payload.id);
    const action = String(payload.action || '')
      .trim()
      .toLowerCase();
    const rejectionReason = String(payload.rejectionReason || '').trim();

    if (!id) {
      return Response.json({ error: 'Property id is required' }, { status: 400 });
    }
    if (!['approve', 'review', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (action === 'reject' && rejectionReason.length < 5) {
      return Response.json(
        { error: 'Rejection reason is required (minimum 5 chars)' },
        { status: 400 }
      );
    }

    const nextIsApproved = action === 'approve';
    const nextStatus =
      action === 'approve' ? 'live' : action === 'reject' ? 'rejected' : 'under_review';
    const statusLabel =
      action === 'approve' ? 'Approved / Live' : action === 'reject' ? 'Rejected' : 'Under Review';

    const properties = await getPropertiesCollection();
    const existing = await properties.findOne({ id });
    if (!existing) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const ownerId = Number(existing.owner_id);
      if (Number.isFinite(ownerId)) {
        const owner = await getOwnerById(ownerId);
        if (owner?.isBlocked) {
          return Response.json(
            { error: 'Cannot approve listing for a blocked owner. Unblock owner first.' },
            { status: 403 }
          );
        }
      }
    }

    const updated = await properties.findOneAndUpdate(
      { id },
      {
        $set: {
          is_approved: nextIsApproved,
          listing_status: nextStatus,
          legal_verification_status:
            action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending',
          rejection_reason: action === 'reject' ? rejectionReason : '',
          updated_at: new Date().toISOString(),
        },
      },
      { returnDocument: 'after' }
    );

    const doc = updated?.value || updated;
    if (!doc) return Response.json({ error: 'Property not found' }, { status: 404 });

    const ownerId = Number(existing.owner_id);
    if (Number.isFinite(ownerId)) {
      const notificationTitle =
        action === 'reject'
          ? `Listing Rejected: ${existing.title}`
          : action === 'approve'
            ? `Listing Approved: ${existing.title}`
            : `Listing Moved to Review: ${existing.title}`;
      const notificationMessage =
        action === 'reject'
          ? `Your listing was rejected. Reason: ${rejectionReason}`
          : action === 'approve'
            ? 'Your listing is approved and now live.'
            : 'Your listing was moved back to under review.';

      await createOwnerNotification({
        ownerId,
        type: `listing_${nextStatus}`,
        title: notificationTitle,
        message: notificationMessage,
        meta: {
          propertyId: Number(existing.id),
          propertyTitle: existing.title,
          listingStatus: nextStatus,
          rejectionReason: action === 'reject' ? rejectionReason : '',
        },
      });

      const owner = await getOwnerById(ownerId);
      if (owner?.email) {
        await sendOwnerListingStatusEmail({
          email: owner.email,
          ownerName: owner.name,
          propertyTitle: existing.title,
          statusLabel,
          reason: action === 'reject' ? rejectionReason : '',
        });
      }
    }

    return Response.json(mapPropertyDoc(doc));
  } catch (error) {
    console.error('Error approving property:', error);
    return Response.json({ error: 'Failed to update property status' }, { status: 500 });
  }
}
