import {
  getPropertiesCollection,
  getReviewsCollection,
  toNumber,
} from '@/app/api/utils/mongo-collections';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const ownerId = Number(auth.session.userId);
    if (!Number.isFinite(ownerId)) {
      return Response.json({ error: 'Owner session missing' }, { status: 400 });
    }

    const propertiesCol = await getPropertiesCollection();
    const propertyDocs = await propertiesCol
      .find({ owner_id: ownerId }, { projection: { id: 1, title: 1 } })
      .toArray();

    const propertyIds = propertyDocs.map((doc) => Number(doc.id)).filter(Number.isFinite);
    if (propertyIds.length === 0) {
      return Response.json({ items: [], unreadCount: 0 });
    }

    const propertyTitleById = new Map(
      propertyDocs.map((doc) => [Number(doc.id), doc.title || 'Property'])
    );
    const reviewsCol = await getReviewsCollection();
    const docs = await reviewsCol
      .find(
        { property_id: { $in: propertyIds } },
        {
          projection: {
            _id: 0,
            id: 1,
            booking_id: 1,
            property_id: 1,
            user_name: 1,
            rating: 1,
            comment: 1,
            created_at: 1,
            owner_is_read: 1,
          },
        }
      )
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();

    const items = docs.map((doc) => ({
      id: Number(doc.id),
      booking_id: Number(doc.booking_id || 0) || null,
      property_id: Number(doc.property_id || 0) || null,
      propertyTitle: propertyTitleById.get(Number(doc.property_id)) || 'Property',
      user_name: doc.user_name || 'Tenant',
      rating: Number(doc.rating || 0),
      comment: String(doc.comment || ''),
      is_read: Boolean(doc.owner_is_read),
      created_at: doc.created_at || null,
    }));

    return Response.json({
      items,
      unreadCount: items.filter((item) => !item.is_read).length,
    });
  } catch (error) {
    console.error('Failed to fetch owner reviews:', error);
    return Response.json({ error: 'Failed to fetch owner reviews' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const ownerId = Number(auth.session.userId);
    if (!Number.isFinite(ownerId)) {
      return Response.json({ error: 'Owner session missing' }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const markAll = Boolean(payload.markAll);
    const reviewId = toNumber(payload.reviewId);

    const propertiesCol = await getPropertiesCollection();
    const propertyDocs = await propertiesCol
      .find({ owner_id: ownerId }, { projection: { id: 1 } })
      .toArray();
    const propertyIds = propertyDocs.map((doc) => Number(doc.id)).filter(Number.isFinite);

    if (propertyIds.length === 0) {
      return Response.json({ ok: true, modified: 0 });
    }

    const reviewsCol = await getReviewsCollection();
    const filter = markAll
      ? { property_id: { $in: propertyIds }, owner_is_read: { $ne: true } }
      : { id: Number(reviewId), property_id: { $in: propertyIds } };

    if (!markAll && !reviewId) {
      return Response.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const result = markAll
      ? await reviewsCol.updateMany(filter, { $set: { owner_is_read: true, owner_read_at: now } })
      : await reviewsCol.updateOne(filter, { $set: { owner_is_read: true, owner_read_at: now } });

    return Response.json({
      ok: true,
      modified: Number(result.modifiedCount || 0),
      matched: Number(result.matchedCount || 0),
    });
  } catch (error) {
    console.error('Failed to update owner reviews:', error);
    return Response.json({ error: 'Failed to update owner reviews' }, { status: 500 });
  }
}
