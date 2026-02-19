import {
  getPropertiesCollection,
  getReviewsCollection,
  mapPropertyDoc,
} from '@/app/api/utils/mongo-collections';
import { getBookingsCollection } from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { getOwnerById } from '@/app/api/utils/owner-auth-db';
import { getSessionFromRequest, requireRoles } from '@/app/api/utils/session';
import { recomputeOwnerRisk, recordPropertyView } from '@/app/api/utils/suspicious-monitor';

let likeIndexesReady = false;
let saveIndexesReady = false;

async function getPropertyLikesCollection() {
  const db = await getMongoDb();
  const collection = db.collection('property_likes');
  if (!likeIndexesReady) {
    await Promise.all([
      collection.createIndex({ property_id: 1 }),
      collection.createIndex({ property_id: 1, user_id: 1 }, { unique: true }),
    ]);
    likeIndexesReady = true;
  }
  return collection;
}

async function getPropertySavesCollection() {
  const db = await getMongoDb();
  const collection = db.collection('property_saves');
  if (!saveIndexesReady) {
    await Promise.all([
      collection.createIndex({ property_id: 1 }),
      collection.createIndex({ user_id: 1 }),
      collection.createIndex({ property_id: 1, user_id: 1 }, { unique: true }),
    ]);
    saveIndexesReady = true;
  }
  return collection;
}

export async function GET(request, { params }) {
  const { slug } = params;
  const includeUnapproved = new URL(request.url).searchParams.get('includeUnapproved') === 'true';

  try {
    const properties = await getPropertiesCollection();
    const query = includeUnapproved ? { slug } : { slug, is_approved: true };
    const property = await properties.findOne(query);

    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    const mapped = mapPropertyDoc(property);
    const session = await getSessionFromRequest(request);
    const viewerRole = String(session?.role || 'guest');
    const viewerId = session?.userId ? Number(session.userId) : null;
    let canRevealContact = false;

    if (viewerId) {
      const bookings = await getBookingsCollection();
      const bookedEntry = await bookings.findOne({
        user_id: viewerId,
        property_id: Number(property.id),
        booking_status: { $in: ['booked', 'confirmed', 'pending'] },
      });
      canRevealContact = Boolean(bookedEntry);

      if (!canRevealContact) {
        const db = await getMongoDb();
        const enquiries = db.collection('enquiries');
        const verifiedInquiry = await enquiries.findOne({
          user_id: viewerId,
          property_id: Number(property.id),
          verification_status: 'verified',
        });
        canRevealContact = Boolean(verifiedInquiry);
      }
    }

    const owner = await getOwnerById(property.owner_id);
    mapped.owner_contact = {
      name: owner?.name || 'Owner',
      mobile: canRevealContact ? owner?.mobile || null : null,
      whatsapp: canRevealContact ? owner?.mobile || null : null,
      revealed: canRevealContact,
      message: canRevealContact
        ? 'Contact details unlocked'
        : 'Contact after booking/inquiry verification',
    };

    const reviewsCol = await getReviewsCollection();
    const latestReviews = await reviewsCol
      .find(
        { property_id: Number(property.id) },
        {
          projection: {
            _id: 0,
            id: 1,
            rating: 1,
            comment: 1,
            user_name: 1,
            user_id: 1,
            created_at: 1,
          },
        }
      )
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();
    const reviewUserIds = [
      ...new Set(latestReviews.map((item) => Number(item.user_id)).filter(Number.isFinite)),
    ];
    const db = await getMongoDb();
    const userDocs = reviewUserIds.length
      ? await db
          .collection('users')
          .find(
            { $or: [{ userId: { $in: reviewUserIds } }, { id: { $in: reviewUserIds } }] },
            { projection: { _id: 0, userId: 1, id: 1, name: 1 } }
          )
          .toArray()
      : [];
    const userById = new Map(
      userDocs
        .map((user) => [Number(user.userId || user.id), String(user.name || '')])
        .filter(([id, name]) => Number.isFinite(id) && name)
    );
    const reviewsWithName = latestReviews.map((item) => ({
      ...item,
      user_name:
        userById.get(Number(item.user_id)) || item.user_name || `User #${item.user_id || ''}`,
    }));
    const statsAgg = await reviewsCol
      .aggregate([
        { $match: { property_id: Number(property.id) } },
        { $group: { _id: '$property_id', total: { $sum: 1 }, avg: { $avg: '$rating' } } },
      ])
      .toArray();
    const stat = statsAgg[0] || { total: 0, avg: 0 };
    mapped.reviews = {
      total: Number(stat.total || 0),
      averageRating: Number(Number(stat.avg || 0).toFixed(1)),
      items: reviewsWithName,
    };

    const likesCol = await getPropertyLikesCollection();
    const likeCount = await likesCol.countDocuments({ property_id: Number(property.id) });
    const likedByMe =
      viewerRole === 'user' && viewerId
        ? Boolean(
            await likesCol.findOne({
              property_id: Number(property.id),
              user_id: Number(viewerId),
            })
          )
        : false;
    mapped.likes = {
      count: Number(likeCount || 0),
      likedByMe,
    };

    const savesCol = await getPropertySavesCollection();
    const savedByMe =
      viewerRole === 'user' && viewerId
        ? Boolean(
            await savesCol.findOne({
              property_id: Number(property.id),
              user_id: Number(viewerId),
            })
          )
        : false;
    mapped.saves = {
      savedByMe,
    };

    await recordPropertyView({
      propertyId: Number(property.id),
      ownerId: Number(property.owner_id),
      userId: viewerId || null,
    });
    await recomputeOwnerRisk(Number(property.owner_id));

    return Response.json(mapped);
  } catch (error) {
    console.error('Error fetching property detail:', error);
    return Response.json({ error: 'Failed to fetch property detail' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const auth = await requireRoles(request, ['user', 'owner', 'admin']);
  if (!auth.ok) return auth.response;

  const { slug } = params;

  try {
    const payload = await request.json().catch(() => ({}));
    const action = String(payload.action || 'toggle').toLowerCase();

    const properties = await getPropertiesCollection();
    const property = await properties.findOne({ slug }, { projection: { id: 1 } });
    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    const userId = Number(auth.session.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return Response.json({ error: 'Invalid session user' }, { status: 400 });
    }

    const isLikeAction = ['toggle', 'like', 'unlike'].includes(action);
    const isSaveAction = ['save', 'unsave', 'save_toggle'].includes(action);
    if ((isLikeAction || isSaveAction) && String(auth.session.role) !== 'user') {
      return Response.json(
        { error: 'Only user accounts can like or save properties' },
        { status: 403 }
      );
    }

    if (isLikeAction) {
      const likesCol = await getPropertyLikesCollection();
      const filter = { property_id: Number(property.id), user_id: userId };

      if (action === 'like') {
        await likesCol.updateOne(
          filter,
          { $setOnInsert: { ...filter, created_at: new Date().toISOString() } },
          { upsert: true }
        );
      } else if (action === 'unlike') {
        await likesCol.deleteOne(filter);
      } else {
        const exists = await likesCol.findOne(filter, { projection: { _id: 1 } });
        if (exists) {
          await likesCol.deleteOne(filter);
        } else {
          await likesCol.insertOne({ ...filter, created_at: new Date().toISOString() });
        }
      }

      const likeCount = await likesCol.countDocuments({ property_id: Number(property.id) });
      const likedByMe = Boolean(await likesCol.findOne(filter, { projection: { _id: 1 } }));

      return Response.json({
        ok: true,
        type: 'like',
        propertyId: Number(property.id),
        likeCount: Number(likeCount || 0),
        likedByMe,
      });
    }

    if (isSaveAction) {
      const savesCol = await getPropertySavesCollection();
      const filter = { property_id: Number(property.id), user_id: userId };
      if (action === 'save') {
        await savesCol.updateOne(
          filter,
          { $setOnInsert: { ...filter, created_at: new Date().toISOString() } },
          { upsert: true }
        );
      } else if (action === 'unsave') {
        await savesCol.deleteOne(filter);
      } else {
        const exists = await savesCol.findOne(filter, { projection: { _id: 1 } });
        if (exists) {
          await savesCol.deleteOne(filter);
        } else {
          await savesCol.insertOne({ ...filter, created_at: new Date().toISOString() });
        }
      }
      const savedByMe = Boolean(await savesCol.findOne(filter, { projection: { _id: 1 } }));
      return Response.json({
        ok: true,
        type: 'save',
        propertyId: Number(property.id),
        savedByMe,
      });
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating property likes:', error);
    return Response.json({ error: 'Failed to update like status' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const { slug } = params;

  try {
    const payload = await request.json();
    const availability = payload.availableRooms;
    const approved = payload.isApproved;

    const properties = await getPropertiesCollection();
    const current = await properties.findOne({ slug });

    if (!current) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }

    const userId = auth.session.userId ? Number(auth.session.userId) : null;
    const ownsProperty = userId && Number(current.owner_id) === userId;

    if (auth.session.role === 'owner' && !ownsProperty) {
      return Response.json({ error: 'You can only update your own properties' }, { status: 403 });
    }

    if (approved !== undefined && auth.session.role !== 'admin') {
      return Response.json({ error: 'Only admin can approve listings' }, { status: 403 });
    }

    const set = {
      updated_at: new Date().toISOString(),
    };

    if (availability !== undefined && availability !== null) {
      const nextAvailability = Number(availability);
      if (!Number.isFinite(nextAvailability) || nextAvailability < 0) {
        return Response.json(
          { error: 'availableRooms must be a non-negative number' },
          { status: 400 }
        );
      }
      set.available_rooms = nextAvailability;
    }

    if (approved !== undefined) {
      const isApproved = Boolean(approved);
      set.is_approved = isApproved;
      set.listing_status = isApproved ? 'live' : 'under_review';
    }

    const updated = await properties.findOneAndUpdate(
      { slug },
      { $set: set },
      { returnDocument: 'after' }
    );

    const doc = updated?.value || updated;
    return Response.json(mapPropertyDoc(doc));
  } catch (error) {
    console.error('Error updating property:', error);
    return Response.json({ error: 'Failed to update property' }, { status: 500 });
  }
}
