import { getBookingsCollection, getPropertiesCollection } from '@/app/api/utils/mongo-collections';
import { getMongoDb } from '@/app/api/utils/mongodb';
import {
  getOwnerSubscription,
  isSubscriptionActive,
} from '@/app/api/utils/owner-subscription-store';
import { requireRoles } from '@/app/api/utils/session';

export async function GET(request) {
  const auth = await requireRoles(request, ['owner', 'admin']);
  if (!auth.ok) return auth.response;

  const sessionOwnerId = auth.session.userId ? Number(auth.session.userId) : null;
  const ownerIdParam = Number(new URL(request.url).searchParams.get('ownerId'));
  const ownerId = sessionOwnerId || ownerIdParam;

  if (!ownerId) {
    return Response.json({ error: 'ownerId is required' }, { status: 400 });
  }

  try {
    const db = await getMongoDb();
    const propertiesCol = await getPropertiesCollection();
    const bookingsCol = await getBookingsCollection();

    const ownerProperties = await propertiesCol
      .find(
        { owner_id: ownerId },
        { projection: { id: 1, title: 1, city: 1, area: 1, is_approved: 1, available_rooms: 1 } }
      )
      .toArray();

    const propertyIds = ownerProperties.map((item) => Number(item.id));
    const propertyById = new Map(ownerProperties.map((item) => [Number(item.id), item]));

    const listings = {
      total_listings: ownerProperties.length,
      approved_listings: ownerProperties.filter((item) => item.is_approved).length,
      total_available_rooms: ownerProperties.reduce(
        (sum, item) => sum + Number(item.available_rooms || 0),
        0
      ),
    };

    let bookingDocs = [];
    if (propertyIds.length > 0) {
      bookingDocs = await bookingsCol
        .find(
          { property_id: { $in: propertyIds } },
          {
            projection: {
              id: 1,
              user_id: 1,
              property_id: 1,
              room_type: 1,
              booking_status: 1,
              payment_status: 1,
              amount: 1,
              rent_amount: 1,
              token_amount: 1,
              remaining_amount: 1,
              created_at: 1,
            },
          }
        )
        .sort({ created_at: -1 })
        .toArray();
    }

    const userIds = [
      ...new Set(bookingDocs.map((item) => Number(item.user_id)).filter(Number.isFinite)),
    ];
    const usersCol = db.collection('users');
    const userDocs = userIds.length
      ? await usersCol
          .find(
            { $or: [{ userId: { $in: userIds } }, { id: { $in: userIds } }] },
            { projection: { userId: 1, id: 1, name: 1, email: 1, phone: 1, mobile: 1 } }
          )
          .toArray()
      : [];
    const userById = new Map(
      userDocs
        .map((user) => [Number(user.userId || user.id), user])
        .filter(([id]) => Number.isFinite(id))
    );

    const subscription = await getOwnerSubscription(ownerId);
    const hasActiveSubscription = isSubscriptionActive(subscription);
    const freeBookingDetailsLimit = Number(subscription?.freeBookingDetailsLimit ?? 1);

    const totalRentAmount = bookingDocs.reduce((sum, item) => {
      const rent = Number(item.rent_amount || item.amount || 0);
      return sum + Math.max(rent, 0);
    }, 0);
    const collectAtProperty = bookingDocs.reduce((sum, item) => {
      const rent = Number(item.rent_amount || item.amount || 0);
      return sum + Math.max(Number(item.remaining_amount ?? rent), 0);
    }, 0);

    const statusCounts = bookingDocs.reduce(
      (acc, item) => {
        const payment = String(item.payment_status || '').toLowerCase();
        const booking = String(item.booking_status || '').toLowerCase();
        if (payment === 'pay_at_property' || booking === 'booked' || booking === 'confirmed')
          acc.paid += 1;
        if (booking === 'pending') acc.pending += 1;
        if (booking === 'cancelled' || booking === 'failed') acc.cancelled += 1;
        return acc;
      },
      { paid: 0, pending: 0, cancelled: 0 }
    );

    const bookings = {
      total_bookings: bookingDocs.length,
      paid_bookings: statusCounts.paid,
      pending_bookings: statusCounts.pending,
      cancelled_bookings: statusCounts.cancelled,
      total_rent_amount: totalRentAmount,
      token_collected: 0,
      remaining_to_collect: collectAtProperty,
      total_revenue: totalRentAmount,
      owner_net_revenue: collectAtProperty,
    };

    const grouped = bookingDocs.reduce((acc, item) => {
      const key = String(item.booking_status || 'pending');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const bookingStatusBreakdown = Object.entries(grouped).map(([booking_status, count]) => ({
      booking_status,
      count,
    }));

    const oldestForFree = [...bookingDocs].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
    const unlockedIds = hasActiveSubscription
      ? null
      : new Set(
          oldestForFree
            .slice(0, Math.max(0, freeBookingDetailsLimit))
            .map((item) => Number(item.id))
        );

    const recentBookings = bookingDocs.slice(0, 10).map((booking) => {
      const userId = Number(booking.user_id);
      const property = propertyById.get(Number(booking.property_id));
      const user = userById.get(userId);
      const canViewDetails = hasActiveSubscription || unlockedIds?.has(Number(booking.id));
      const totalRent = Number(booking.rent_amount || booking.amount || 0);
      const remainingAmount = Math.max(Number(booking.remaining_amount ?? totalRent), 0);
      const ownerNetAmount = remainingAmount;

      return {
        id: Number(booking.id),
        created_at: booking.created_at || null,
        room_type: booking.room_type || null,
        booking_status: booking.booking_status || 'pending',
        payment_status: booking.payment_status || 'pay_at_property',
        details_locked: !canViewDetails,
        amount: 0,
        rent_amount: totalRent,
        remaining_amount: remainingAmount,
        owner_net_amount: ownerNetAmount,
        property: {
          id: Number(booking.property_id),
          title: property?.title || 'Property',
          city: property?.city || '-',
          area: property?.area || '-',
        },
        user: {
          id: canViewDetails ? userId : null,
          name: canViewDetails ? user?.name || '-' : 'Locked (subscription required)',
          email: canViewDetails ? user?.email || '-' : 'Locked',
          phone: canViewDetails ? user?.phone || user?.mobile || '-' : 'Locked',
        },
      };
    });

    return Response.json({
      ownerId,
      listings,
      bookings,
      paymentMode: 'direct_to_owner_at_property',
      subscription: {
        active: hasActiveSubscription,
        freeBookingDetailsLimit,
      },
      bookingStatusBreakdown,
      recentBookings,
    });
  } catch (error) {
    console.error('Failed to load owner analytics:', error);
    return Response.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
