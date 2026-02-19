import {
  getBookingsCollection,
  getNextSequence,
  getPropertiesCollection,
  getReviewsCollection,
  mapBookingDoc,
  toNumber,
} from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import { getOwnerById } from '@/app/api/utils/owner-auth-db';
import { createOwnerNotification } from '@/app/api/utils/owner-notifications-db';
import {
  getOwnerSubscription,
  isSubscriptionActive,
} from '@/app/api/utils/owner-subscription-store';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { verifyRecaptchaToken } from '@/app/api/utils/recaptcha';
import { requireRoles } from '@/app/api/utils/session';
import { recomputeOwnerRisk, trackSuspiciousEvent } from '@/app/api/utils/suspicious-monitor';

function mergeBookingWithProperty(booking, property) {
  return {
    ...booking,
    title: property?.title || null,
    city: property?.city || null,
    area: property?.area || null,
    slug: property?.slug || null,
    images: property?.images || [],
  };
}

function roomTypeToSharingKey(roomType) {
  const normalized = String(roomType || '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized === '1' || normalized.includes('single')) return '1';
  if (normalized === '2' || normalized.includes('double')) return '2';
  if (normalized === '3' || normalized.includes('triple')) return '3';
  return null;
}

function sharingKeyToRoomTypeLabel(key) {
  if (key === '1') return 'Single Sharing';
  if (key === '2') return 'Double Sharing';
  if (key === '3') return 'Triple Sharing';
  return 'Single Sharing';
}

async function attachPropertyFields(bookings) {
  const propertyIds = [
    ...new Set(bookings.map((item) => Number(item.property_id)).filter(Number.isFinite)),
  ];
  if (propertyIds.length === 0) return bookings;

  const properties = await getPropertiesCollection();
  const docs = await properties
    .find(
      { id: { $in: propertyIds } },
      { projection: { id: 1, title: 1, city: 1, area: 1, slug: 1, images: 1 } }
    )
    .toArray();
  const map = new Map(docs.map((doc) => [Number(doc.id), doc]));

  return bookings.map((booking) =>
    mergeBookingWithProperty(booking, map.get(Number(booking.property_id)))
  );
}

async function attachUserFields(bookings) {
  const userIds = [
    ...new Set(bookings.map((item) => Number(item.user_id)).filter(Number.isFinite)),
  ];
  if (userIds.length === 0) return bookings;

  const db = await getMongoDb();
  const usersCol = db.collection('users');
  const users = await usersCol
    .find(
      { $or: [{ userId: { $in: userIds } }, { id: { $in: userIds } }] },
      { projection: { userId: 1, id: 1, name: 1, email: 1, phone: 1, mobile: 1 } }
    )
    .toArray();
  const userMap = new Map(
    users
      .map((user) => [Number(user.userId || user.id), user])
      .filter(([id]) => Number.isFinite(id))
  );

  return bookings.map((booking) => {
    const user = userMap.get(Number(booking.user_id));
    return {
      ...booking,
      user_name: user?.name || null,
      user_email: user?.email || null,
      user_phone: user?.phone || user?.mobile || null,
    };
  });
}

async function attachOwnerFieldsForUser(bookings) {
  const propertyIds = [
    ...new Set(bookings.map((item) => Number(item.property_id)).filter(Number.isFinite)),
  ];
  if (propertyIds.length === 0) return bookings;

  const propertiesCol = await getPropertiesCollection();
  const propertyDocs = await propertiesCol
    .find({ id: { $in: propertyIds } }, { projection: { id: 1, owner_id: 1, title: 1 } })
    .toArray();
  const propertyMap = new Map(propertyDocs.map((doc) => [Number(doc.id), doc]));

  const ownerIds = [
    ...new Set(propertyDocs.map((doc) => Number(doc.owner_id)).filter(Number.isFinite)),
  ];
  const owners = await Promise.all(ownerIds.map((ownerId) => getOwnerById(ownerId)));
  const ownerMap = new Map(
    owners
      .filter(Boolean)
      .map((owner) => [Number(owner.id), owner])
      .filter(([id]) => Number.isFinite(id))
  );

  return bookings.map((booking) => {
    const property = propertyMap.get(Number(booking.property_id));
    const owner = ownerMap.get(Number(property?.owner_id));
    return {
      ...booking,
      owner_id: Number(property?.owner_id || 0) || null,
      owner_name: owner?.name || null,
      owner_email: owner?.email || null,
      owner_mobile: owner?.mobile || null,
    };
  });
}

async function attachReviewFields(bookings) {
  const bookingIds = [...new Set(bookings.map((item) => Number(item.id)).filter(Number.isFinite))];
  if (bookingIds.length === 0) return bookings;

  const reviewsCol = await getReviewsCollection();
  const reviewDocs = await reviewsCol
    .find(
      { booking_id: { $in: bookingIds } },
      {
        projection: {
          _id: 0,
          booking_id: 1,
          rating: 1,
          comment: 1,
          created_at: 1,
        },
      }
    )
    .toArray();

  const reviewMap = new Map(
    reviewDocs.map((doc) => [Number(doc.booking_id), doc]).filter(([id]) => Number.isFinite(id))
  );

  return bookings.map((booking) => {
    const review = reviewMap.get(Number(booking.id));
    return {
      ...booking,
      review_rating: review ? Number(review.rating || 0) : null,
      review_comment: review ? String(review.comment || '') : null,
      review_created_at: review?.created_at || null,
      review_submitted: Boolean(booking.review_submitted || review),
    };
  });
}

export async function GET(request) {
  const auth = await requireRoles(request, ['user', 'owner', 'admin']);
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit({
    request,
    namespace: 'bookings:list',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  const { searchParams } = new URL(request.url);
  const userIdParam = toNumber(searchParams.get('userId'));
  const ownerIdParam = toNumber(searchParams.get('ownerId'));
  const limit = toNumber(searchParams.get('limit')) || 20;
  const offset = toNumber(searchParams.get('offset')) || 0;

  const sessionUserId = auth.session.userId ? Number(auth.session.userId) : null;

  try {
    const bookingsCol = await getBookingsCollection();
    let docs = [];

    if (auth.session.role === 'user') {
      const userId = sessionUserId || userIdParam;
      if (!userId) {
        return Response.json({ error: 'User userId missing' }, { status: 400 });
      }

      docs = await bookingsCol
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
    } else if (auth.session.role === 'owner') {
      const ownerId = sessionUserId || ownerIdParam;
      if (!ownerId) {
        return Response.json({ error: 'Owner userId missing' }, { status: 400 });
      }

      const propertiesCol = await getPropertiesCollection();
      const ownerProperties = await propertiesCol
        .find({ owner_id: ownerId }, { projection: { id: 1 } })
        .toArray();
      const propertyIds = ownerProperties.map((item) => Number(item.id));

      docs = propertyIds.length
        ? await bookingsCol
            .find({ property_id: { $in: propertyIds } })
            .sort({ created_at: -1 })
            .skip(offset)
            .limit(limit)
            .toArray()
        : [];

      const subscription = await getOwnerSubscription(ownerId);
      const hasActiveSubscription = isSubscriptionActive(subscription);
      const freeDetailsLimit = Number(subscription?.freeBookingDetailsLimit ?? 1);

      if (!hasActiveSubscription && docs.length > freeDetailsLimit) {
        const oldestDocs = [...docs].sort(
          (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );
        const unlockedIds = new Set(
          oldestDocs.slice(0, Math.max(0, freeDetailsLimit)).map((item) => Number(item.id))
        );
        docs = docs.map((doc) =>
          unlockedIds.has(Number(doc.id))
            ? doc
            : {
                ...doc,
                user_id: null,
                room_type: doc.room_type || null,
                details_locked: true,
              }
        );
      }
    } else {
      docs = await bookingsCol
        .find({})
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .toArray();
    }

    const bookings = docs.map(mapBookingDoc);
    const withProperties = await attachPropertyFields(bookings);
    const withUsers =
      auth.session.role === 'owner' || auth.session.role === 'admin'
        ? await attachUserFields(withProperties)
        : withProperties;
    const enriched =
      auth.session.role === 'user' ? await attachOwnerFieldsForUser(withUsers) : withUsers;
    const withReviews =
      auth.session.role === 'user' ? await attachReviewFields(enriched) : enriched;
    return Response.json(withReviews);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return Response.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireRoles(request, ['user', 'owner', 'admin']);
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit({
    request,
    namespace: 'bookings:create',
    limit: 20,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const { userId, propertyId, roomType, amount, recaptchaToken, acceptedTerms } =
      await request.json();

    const recaptcha = await verifyRecaptchaToken({ token: recaptchaToken, action: 'booking' });
    if (!recaptcha.ok) {
      return Response.json({ error: recaptcha.error }, { status: 400 });
    }

    if (auth.session.role === 'owner' || auth.session.role === 'admin') {
      return Response.json(
        { error: 'Only user accounts can create bookings. Owners can only browse properties.' },
        { status: 403 }
      );
    }

    const effectiveUserId = auth.session.userId ? Number(auth.session.userId) : toNumber(userId);
    const propertyIdNum = toNumber(propertyId);
    if (!effectiveUserId || !propertyIdNum) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const propertiesCol = await getPropertiesCollection();
    const property = await propertiesCol.findOne({ id: propertyIdNum });

    if (!property) {
      return Response.json({ error: 'Property not found' }, { status: 404 });
    }
    if (!acceptedTerms) {
      await trackSuspiciousEvent({
        eventType: 'terms_not_accepted',
        ownerId: Number(property.owner_id),
        userId: Number(effectiveUserId),
        propertyId: Number(property.id),
        severity: 2,
      });
      await recomputeOwnerRisk(Number(property.owner_id));
      return Response.json({ error: 'You must accept booking terms to continue' }, { status: 400 });
    }
    if (!property.is_approved) {
      return Response.json({ error: 'Property is not approved yet' }, { status: 400 });
    }
    if (Number(property.available_rooms || 0) <= 0) {
      return Response.json({ error: 'No rooms available' }, { status: 400 });
    }

    const sharingKey = roomTypeToSharingKey(roomType) || roomTypeToSharingKey(property.sharing);
    if (!sharingKey) {
      return Response.json({ error: 'Invalid room type' }, { status: 400 });
    }

    const availableSharing =
      property.sharing === 'all123' ? ['1', '2', '3'] : [String(property.sharing || '')];
    if (!availableSharing.includes(sharingKey)) {
      return Response.json(
        { error: 'Selected room type is not available for this property' },
        { status: 400 }
      );
    }

    const sharingPrices = property.sharing_prices || {};
    const serverAmount =
      toNumber(sharingPrices[sharingKey]) ?? toNumber(amount) ?? toNumber(property.price);
    if (!serverAmount || serverAmount <= 0) {
      return Response.json({ error: 'Invalid room price for selected sharing' }, { status: 400 });
    }
    const bookingTokenAmount = 0;
    const remainingAmount = Math.max(Number(serverAmount) - Number(bookingTokenAmount), 0);

    const bookingsCol = await getBookingsCollection();
    const existingActiveBooking = await bookingsCol.findOne(
      {
        user_id: Number(effectiveUserId),
        property_id: Number(propertyIdNum),
        booking_status: { $nin: ['cancelled', 'failed'] },
      },
      { projection: { id: 1, booking_status: 1, created_at: 1 } }
    );
    if (existingActiveBooking) {
      return Response.json(
        {
          error: 'You already have an active booking for this property.',
          bookingId: Number(existingActiveBooking.id),
        },
        { status: 409 }
      );
    }

    const id = await getNextSequence('bookings');
    const now = new Date().toISOString();

    const document = {
      id,
      user_id: Number(effectiveUserId),
      property_id: propertyIdNum,
      room_type: sharingKeyToRoomTypeLabel(sharingKey),
      amount: Number(serverAmount),
      rent_amount: Number(serverAmount),
      token_amount: Number(bookingTokenAmount),
      remaining_amount: Number(remainingAmount),
      terms_accepted: true,
      payment_status: 'pay_at_property',
      booking_status: 'booked',
      owner_action_status: 'pending',
      owner_action_updated_at: null,
      owner_action_note: '',
      review_submitted: false,
      transaction_id: null,
      created_at: now,
      updated_at: now,
    };

    await bookingsCol.insertOne(document);
    await createOwnerNotification({
      ownerId: Number(property.owner_id),
      type: 'booking_action_required',
      title: `Action Required for Booking #${id}`,
      message: 'New booking received. Mark tenant as Attended or Rejected from booking operations.',
      meta: {
        bookingId: Number(id),
        propertyId: Number(property.id),
        actionRequired: true,
      },
    });
    return Response.json(mapBookingDoc(document));
  } catch (error) {
    console.error('Error creating booking:', error);
    return Response.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const bookingId = toNumber(payload.bookingId);
    const action = String(payload.action || '')
      .trim()
      .toLowerCase();
    if (!bookingId || !['attended', 'rejected'].includes(action)) {
      return Response.json({ error: 'Valid bookingId and action are required' }, { status: 400 });
    }

    const bookingsCol = await getBookingsCollection();
    const booking = await bookingsCol.findOne({ id: Number(bookingId) });
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const propertiesCol = await getPropertiesCollection();
    const property = await propertiesCol.findOne(
      { id: Number(booking.property_id) },
      { projection: { owner_id: 1 } }
    );
    if (!property) {
      return Response.json({ error: 'Booking property not found' }, { status: 404 });
    }

    const ownerId = Number(property.owner_id);
    const actorId = Number(auth.session.userId);
    if (auth.session.role === 'owner' && ownerId !== actorId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const nextBookingStatus =
      action === 'rejected' ? 'cancelled' : String(booking.booking_status || 'booked');
    await bookingsCol.updateOne(
      { id: Number(bookingId) },
      {
        $set: {
          owner_action_status: action,
          owner_action_updated_at: now,
          booking_status: nextBookingStatus,
          updated_at: now,
        },
      }
    );

    await createOwnerNotification({
      ownerId,
      type: action === 'attended' ? 'booking_attended' : 'booking_rejected',
      title:
        action === 'attended'
          ? `Booking #${bookingId} marked attended`
          : `Booking #${bookingId} marked rejected`,
      message:
        action === 'attended'
          ? 'Attendance recorded successfully. You can add a tenant review from bookings.'
          : 'Booking has been rejected successfully.',
      meta: { bookingId: Number(bookingId), action },
    });

    return Response.json({ ok: true, bookingId: Number(bookingId), action });
  } catch (error) {
    console.error('Error updating booking owner action:', error);
    return Response.json({ error: 'Failed to update booking action' }, { status: 500 });
  }
}
