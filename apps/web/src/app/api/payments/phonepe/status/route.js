import {
  getBookingsCollection,
  getPropertiesCollection,
  toNumber,
} from '@/app/api/utils/mongo-collections';
import { fetchPhonePeStatus, normalizePhonePeState } from '@/app/api/utils/phonepe';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { requireRoles } from '@/app/api/utils/session';
import { recomputeOwnerRisk, trackSuspiciousEvent } from '@/app/api/utils/suspicious-monitor';

async function applyBookingStatusFromState({ transactionId, rawState }) {
  const normalized = normalizePhonePeState(rawState);

  const bookings = await getBookingsCollection();
  const properties = await getPropertiesCollection();

  const booking = await bookings.findOne({ transaction_id: transactionId });
  if (!booking) {
    return { updated: false, reason: 'booking-not-found' };
  }

  const wasPaid = String(booking.payment_status || '').toLowerCase() === 'paid';

  await bookings.updateOne(
    { id: booking.id },
    {
      $set: {
        payment_status: normalized.paymentStatus,
        booking_status: normalized.bookingStatus,
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!wasPaid && normalized.paymentStatus === 'paid') {
    const property = await properties.findOne({ id: booking.property_id });
    if (property) {
      const nextRooms = Math.max(0, Number(property.available_rooms || 0) - 1);
      await properties.updateOne(
        { id: property.id },
        { $set: { available_rooms: nextRooms, updated_at: new Date().toISOString() } }
      );
      await recomputeOwnerRisk(Number(property.owner_id));
    }
  } else {
    const property = await properties.findOne(
      { id: booking.property_id },
      { projection: { owner_id: 1 } }
    );
    if (
      property &&
      (normalized.bookingStatus === 'cancelled' || normalized.bookingStatus === 'failed')
    ) {
      await trackSuspiciousEvent({
        eventType: 'payment_cancelled_or_failed',
        ownerId: Number(property.owner_id),
        userId: Number(booking.user_id),
        propertyId: Number(booking.property_id),
        severity: 6,
        details: { transactionId, bookingStatus: normalized.bookingStatus },
      });
      await recomputeOwnerRisk(Number(property.owner_id));
    }
  }

  return { updated: true, bookingId: booking.id, ...normalized };
}

export async function GET(request) {
  const auth = await requireRoles(request, ['user', 'owner', 'admin']);
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit({
    request,
    namespace: 'payments:phonepe:status',
    limit: 40,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  const bookingId = toNumber(searchParams.get('bookingId'));

  if (!transactionId && !bookingId) {
    return Response.json({ error: 'transactionId or bookingId is required' }, { status: 400 });
  }

  try {
    const bookings = await getBookingsCollection();
    const booking = transactionId
      ? await bookings.findOne({ transaction_id: transactionId })
      : await bookings.findOne({ id: bookingId });

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const liveTransactionId = booking.transaction_id || transactionId;
    if (!liveTransactionId) {
      return Response.json({
        success: true,
        mode: 'database-only',
        bookingId: booking.id,
        paymentStatus: booking.payment_status,
        bookingStatus: booking.booking_status,
      });
    }

    const statusResult = await fetchPhonePeStatus(liveTransactionId);
    if (!statusResult.ok) {
      return Response.json(
        {
          success: false,
          bookingId: booking.id,
          transactionId: liveTransactionId,
          paymentStatus: booking.payment_status,
          bookingStatus: booking.booking_status,
          error: statusResult.error,
        },
        { status: 400 }
      );
    }

    const sync = await applyBookingStatusFromState({
      transactionId: liveTransactionId,
      rawState: statusResult.status,
    });

    return Response.json({
      success: true,
      mode: 'live',
      bookingId: booking.id,
      transactionId: liveTransactionId,
      state: statusResult.status,
      sync,
    });
  } catch (error) {
    console.error('Error fetching PhonePe status:', error);
    return Response.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}
