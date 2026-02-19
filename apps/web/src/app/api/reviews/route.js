import {
  getBookingsCollection,
  getNextSequence,
  getPropertiesCollection,
  getReviewsCollection,
  toNumber,
} from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const propertyId = toNumber(searchParams.get('propertyId'));
  const limit = Math.max(1, Math.min(100, toNumber(searchParams.get('limit')) || 20));
  const minRating = Math.max(1, Math.min(5, toNumber(searchParams.get('minRating')) || 1));

  try {
    const reviewsCol = await getReviewsCollection();
    if (!propertyId) {
      const items = await reviewsCol
        .find(
          { rating: { $gte: minRating } },
          {
            projection: {
              _id: 0,
              id: 1,
              rating: 1,
              comment: 1,
              user_name: 1,
              user_id: 1,
              booking_id: 1,
              property_id: 1,
              created_at: 1,
            },
          }
        )
        .sort({ rating: -1, created_at: -1 })
        .limit(limit)
        .toArray();

      const propertyIds = [
        ...new Set(items.map((item) => Number(item.property_id)).filter(Boolean)),
      ];
      const propertiesCol = await getPropertiesCollection();
      const propertyDocs = propertyIds.length
        ? await propertiesCol
            .find(
              { id: { $in: propertyIds } },
              { projection: { _id: 0, id: 1, title: 1, area: 1, city: 1 } }
            )
            .toArray()
        : [];
      const propertyById = new Map(propertyDocs.map((property) => [Number(property.id), property]));
      const userIds = [
        ...new Set(items.map((item) => Number(item.user_id)).filter(Number.isFinite)),
      ];
      const db = await getMongoDb();
      const userDocs = userIds.length
        ? await db
            .collection('users')
            .find(
              { $or: [{ userId: { $in: userIds } }, { id: { $in: userIds } }] },
              { projection: { _id: 0, userId: 1, id: 1, name: 1 } }
            )
            .toArray()
        : [];
      const userById = new Map(
        userDocs
          .map((user) => [Number(user.userId || user.id), String(user.name || '')])
          .filter(([id, name]) => Number.isFinite(id) && name)
      );

      return Response.json({
        items: items.map((item) => {
          const property = propertyById.get(Number(item.property_id));
          const resolvedName = userById.get(Number(item.user_id));
          return {
            ...item,
            user_name: resolvedName || item.user_name || `User #${item.user_id || ''}`,
            property_title: property?.title || 'PG Listing',
            city: property?.city || '',
            area: property?.area || '',
          };
        }),
        stats: {
          total: items.length,
          averageRating: items.length
            ? Number(
                (
                  items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / items.length
                ).toFixed(1)
              )
            : 0,
        },
      });
    }

    const items = await reviewsCol
      .find(
        { property_id: Number(propertyId) },
        {
          projection: {
            _id: 0,
            id: 1,
            rating: 1,
            comment: 1,
            user_name: 1,
            user_id: 1,
            booking_id: 1,
            created_at: 1,
          },
        }
      )
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    const statsAgg = await reviewsCol
      .aggregate([
        { $match: { property_id: Number(propertyId) } },
        { $group: { _id: '$property_id', total: { $sum: 1 }, avg: { $avg: '$rating' } } },
      ])
      .toArray();
    const stat = statsAgg[0] || { total: 0, avg: 0 };
    const userIds = [...new Set(items.map((item) => Number(item.user_id)).filter(Number.isFinite))];
    const db = await getMongoDb();
    const userDocs = userIds.length
      ? await db
          .collection('users')
          .find(
            { $or: [{ userId: { $in: userIds } }, { id: { $in: userIds } }] },
            { projection: { _id: 0, userId: 1, id: 1, name: 1 } }
          )
          .toArray()
      : [];
    const userById = new Map(
      userDocs
        .map((user) => [Number(user.userId || user.id), String(user.name || '')])
        .filter(([id, name]) => Number.isFinite(id) && name)
    );

    return Response.json({
      items: items.map((item) => ({
        ...item,
        user_name:
          userById.get(Number(item.user_id)) || item.user_name || `User #${item.user_id || ''}`,
      })),
      stats: {
        total: Number(stat.total || 0),
        averageRating: Number(Number(stat.avg || 0).toFixed(1)),
      },
    });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRoles(request, ['user', 'owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const bookingId = toNumber(payload.bookingId);
    const rating = toNumber(payload.rating);
    const comment = String(payload.comment || '').trim();
    if (!bookingId || !rating || rating < 1 || rating > 5 || comment.length < 3) {
      return Response.json(
        { error: 'bookingId, rating(1-5), comment are required' },
        { status: 400 }
      );
    }

    const bookingsCol = await getBookingsCollection();
    const booking = await bookingsCol.findOne({ id: Number(bookingId) });
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const propertiesCol = await getPropertiesCollection();
    const property = await propertiesCol.findOne(
      { id: Number(booking.property_id) },
      { projection: { id: 1, owner_id: 1 } }
    );
    if (!property) return Response.json({ error: 'Property not found' }, { status: 404 });

    const actorId = Number(auth.session.userId);
    if (auth.session.role === 'owner' && Number(property.owner_id) !== actorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (auth.session.role === 'user' && Number(booking.user_id) !== actorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ownerActionStatus = String(booking.owner_action_status || 'pending').toLowerCase();
    if (auth.session.role === 'user' && !['attended', 'rejected'].includes(ownerActionStatus)) {
      return Response.json(
        { error: 'Review is enabled only after owner marks booking as attended or rejected' },
        { status: 400 }
      );
    }

    const reviewsCol = await getReviewsCollection();
    const exists = await reviewsCol.findOne(
      { booking_id: Number(bookingId) },
      { projection: { id: 1 } }
    );
    if (exists)
      return Response.json({ error: 'Review already submitted for this booking' }, { status: 409 });
    const db = await getMongoDb();
    const userDoc = await db
      .collection('users')
      .findOne(
        { $or: [{ userId: Number(booking.user_id) }, { id: Number(booking.user_id) }] },
        { projection: { _id: 0, name: 1 } }
      );

    const id = await getNextSequence('reviews');
    const document = {
      id: Number(id),
      booking_id: Number(bookingId),
      property_id: Number(booking.property_id),
      user_id: Number(booking.user_id),
      user_name: String(
        userDoc?.name || payload.userName || booking.user_name || `User #${booking.user_id}`
      ),
      rating: Number(rating),
      comment,
      owner_is_read: false,
      owner_read_at: null,
      created_at: new Date().toISOString(),
    };
    await reviewsCol.insertOne(document);
    await bookingsCol.updateOne(
      { id: Number(bookingId) },
      { $set: { review_submitted: true, updated_at: new Date().toISOString() } }
    );

    return Response.json({ ok: true, review: document });
  } catch (error) {
    console.error('Failed to submit review:', error);
    return Response.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
