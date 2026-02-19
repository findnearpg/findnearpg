import {
  getBookingsCollection,
  getPropertiesCollection,
  mapBookingDoc,
  toNumber,
} from '@/app/api/utils/mongo-collections';
import { initiatePhonePePayment, isPhonePeConfigured } from '@/app/api/utils/phonepe';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/utils/rate-limit';
import { requireRoles } from '@/app/api/utils/session';

function generateTransactionId(bookingId) {
  return `FNPG_${bookingId}_${Date.now()}`;
}

export async function POST(request) {
  const auth = await requireRoles(request, ['user', 'owner', 'admin']);
  if (!auth.ok) return auth.response;

  const rateLimit = checkRateLimit({
    request,
    namespace: 'payments:phonepe:initiate',
    limit: 15,
    windowMs: 60_000,
  });
  if (!rateLimit.ok) return rateLimitExceededResponse(rateLimit);

  try {
    const payload = await request.json();
    const bookingId = toNumber(payload.bookingId);
    const mobileNumber = payload.mobileNumber ? String(payload.mobileNumber) : null;

    if (!bookingId) {
      return Response.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const bookings = await getBookingsCollection();
    const booking = await bookings.findOne({ id: bookingId });
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const sessionUserId = auth.session.userId ? Number(auth.session.userId) : null;
    if (
      auth.session.role === 'user' &&
      sessionUserId &&
      Number(booking.user_id) !== sessionUserId
    ) {
      return Response.json({ error: 'Forbidden booking access' }, { status: 403 });
    }

    if (String(booking.payment_status).toLowerCase() === 'paid') {
      return Response.json(
        {
          error: 'Booking already paid',
          bookingId: booking.id,
          paymentStatus: booking.payment_status,
        },
        { status: 400 }
      );
    }

    const transactionId =
      booking.transaction_id && String(booking.transaction_id).trim().length > 0
        ? String(booking.transaction_id)
        : generateTransactionId(booking.id);

    await bookings.updateOne(
      { id: booking.id },
      {
        $set: {
          transaction_id: transactionId,
          payment_status: 'initiated',
          updated_at: new Date().toISOString(),
        },
      }
    );

    const origin = new URL(request.url).origin;
    const redirectUrl =
      payload.redirectUrl ||
      `${origin}/dashboard/user/bookings?paymentTxn=${encodeURIComponent(transactionId)}`;
    const callbackUrl = payload.callbackUrl || `${origin}/api/payments/phonepe/callback`;

    if (!isPhonePeConfigured()) {
      return Response.json({
        success: true,
        mode: 'mock',
        transactionId,
        paymentUrl: `${origin}/dashboard/user/bookings?paymentTxn=${encodeURIComponent(transactionId)}&mockPaid=true`,
      });
    }

    const result = await initiatePhonePePayment({
      merchantTransactionId: transactionId,
      merchantUserId: `USER_${booking.user_id}`,
      amountPaise: Math.round(Number(booking.amount) * 100),
      redirectUrl,
      callbackUrl,
      mobileNumber,
    });

    if (!result.ok) {
      await bookings.updateOne(
        { id: booking.id },
        {
          $set: {
            payment_status: 'failed',
            booking_status: 'pending',
            updated_at: new Date().toISOString(),
          },
        }
      );
      return Response.json({ error: result.error, details: result.raw || null }, { status: 400 });
    }

    return Response.json({
      success: true,
      mode: 'live',
      bookingId: booking.id,
      transactionId,
      paymentUrl: result.paymentUrl,
    });
  } catch (error) {
    console.error('Error initiating PhonePe payment:', error);
    return Response.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
