import { getBookingsCollection, getPropertiesCollection } from '@/app/api/utils/mongo-collections';
import {
  fetchPhonePeStatus,
  normalizePhonePeState,
  parseCallbackPayload,
} from '@/app/api/utils/phonepe';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { recomputeOwnerRisk, trackSuspiciousEvent } from '@/app/api/utils/suspicious-monitor';

async function applyBookingState({ transactionId, paymentStatus, bookingStatus }) {
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
        payment_status: paymentStatus,
        booking_status: bookingStatus,
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (!wasPaid && paymentStatus === 'paid') {
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
    if (property && (bookingStatus === 'cancelled' || bookingStatus === 'failed')) {
      await trackSuspiciousEvent({
        eventType: 'payment_cancelled_or_failed',
        ownerId: Number(property.owner_id),
        userId: Number(booking.user_id),
        propertyId: Number(booking.property_id),
        severity: 6,
        details: { transactionId, bookingStatus },
      });
      await recomputeOwnerRisk(Number(property.owner_id));
    }
  }

  return { updated: true, bookingId: booking.id, paymentStatus, bookingStatus };
}

export async function POST(request) {
  const rateLimit = checkRateLimit({
    request,
    namespace: 'payments:phonepe:callback',
    limit: 100,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json().catch(() => ({}));
    const parsed = parseCallbackPayload(payload);

    const transactionId =
      parsed?.data?.merchantTransactionId ||
      parsed?.merchantTransactionId ||
      parsed?.transactionId ||
      null;

    if (!transactionId) {
      return Response.json({ error: 'Missing transaction id in callback' }, { status: 400 });
    }

    const liveStatus = await fetchPhonePeStatus(transactionId);
    const fallbackState = parsed?.code || parsed?.status || parsed?.data?.state || 'FAILED';
    const state = liveStatus.ok ? liveStatus.status : fallbackState;
    const normalized = normalizePhonePeState(state);

    const update = await applyBookingState({
      transactionId,
      paymentStatus: normalized.paymentStatus,
      bookingStatus: normalized.bookingStatus,
    });

    return Response.json({
      success: true,
      transactionId,
      state,
      update,
    });
  } catch (error) {
    console.error('PhonePe callback error:', error);
    return Response.json({ error: 'Failed to process callback' }, { status: 500 });
  }
}
