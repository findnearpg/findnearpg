'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageCircleMore, Phone, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export default function UserBookingsPage() {
  const queryClient = useQueryClient();
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [submittedReviews, setSubmittedReviews] = useState({});

  const { data: session } = useQuery({
    queryKey: ['user-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) return null;
      return response.json();
    },
  });
  const userId = Number(session?.userId || 0);

  const reviewMutation = useMutation({
    mutationFn: async ({ bookingId, rating, comment }) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'user',
          'x-user-id': String(userId || 0),
        },
        body: JSON.stringify({ bookingId, rating, comment }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to submit review');
      return json;
    },
    onSuccess: (_, variables) => {
      toast.success('Review submitted');
      setSubmittedReviews((prev) => ({
        ...prev,
        [String(variables.bookingId)]: {
          rating: Number(variables.rating || 5),
          comment: String(variables.comment || '').trim(),
        },
      }));
      setReviewDrafts((prev) => {
        const next = { ...prev };
        delete next[String(variables.bookingId)];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['user-bookings', userId] });
    },
    onError: (error) => toast.error(error.message || 'Failed to submit review'),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-bookings', userId],
    queryFn: async () => {
      const response = await fetch(`/api/bookings?userId=${userId}`, {
        headers: {
          'x-user-role': 'user',
          'x-user-id': String(userId || 0),
        },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch bookings');
      return json;
    },
    enabled: Boolean(session?.authenticated && session?.role === 'user' && userId > 0),
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">My Bookings</h1>
        <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
          Track booking statuses and pay rent directly to owner at PG/location.
        </p>
        {session?.authenticated && session?.role !== 'user' ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Owner/admin accounts cannot use user booking dashboard.
          </div>
        ) : null}
        {!session?.authenticated ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Please{' '}
            <a href="/account/user/signin" className="font-bold underline">
              login as user
            </a>{' '}
            to view bookings.
          </div>
        ) : null}

        <div className="space-y-4">
          {isLoading && <div className="text-[#073735]/70">Loading bookings...</div>}
          {!isLoading && error && <div className="text-red-600">{error.message}</div>}
          {!isLoading && !error && data?.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-[#073735]/70">
              No bookings yet.
            </div>
          )}
          {!isLoading &&
            !error &&
            data?.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6"
              >
                {(() => {
                  const totalRent = Number(booking.rent_amount || booking.amount || 0);
                  const remainingAtPG = Math.max(Number(booking.remaining_amount ?? totalRent), 0);
                  const ownerActionStatus = String(
                    booking.owner_action_status || 'pending'
                  ).toLowerCase();
                  const reviewEnabled = ['attended', 'rejected'].includes(ownerActionStatus);
                  const reviewSubmitted = Boolean(booking.review_submitted);
                  const persistedSubmittedReview =
                    booking.review_rating && booking.review_comment
                      ? {
                          rating: Number(booking.review_rating || 0),
                          comment: String(booking.review_comment || ''),
                        }
                      : null;
                  const submittedReview =
                    submittedReviews[String(booking.id)] || persistedSubmittedReview || null;
                  const showReviewAsSubmitted = reviewSubmitted || Boolean(submittedReview);
                  const draft = reviewDrafts[String(booking.id)] || { rating: 5, comment: '' };

                  return (
                    <>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#073735] sm:text-xl">
                            {booking.title || 'Property'}
                          </h3>
                          <p className="text-[#073735]/60">
                            {booking.area}, {booking.city}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <div className="text-lg font-extrabold text-[#0f8f8b] sm:text-xl">
                            {formatMoney(totalRent)}
                          </div>
                          <div className="text-xs uppercase tracking-wider text-[#073735]/40">
                            {booking.room_type} • Pay at location
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-[#e7f4f3] bg-[#f8fffe] p-3 text-xs text-[#073735]/75">
                        <p>
                          Total rent:{' '}
                          <span className="font-semibold text-[#073735]">
                            {formatMoney(totalRent)}
                          </span>
                        </p>
                        <p>
                          Platform payment:{' '}
                          <span className="font-semibold text-[#073735]">Not required</span>
                        </p>
                        <p>
                          Pay at PG/location during check-in:{' '}
                          <span className="font-semibold text-[#073735]">
                            {formatMoney(remainingAtPG)}
                          </span>
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                          Booking: {booking.booking_status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            ownerActionStatus === 'attended'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ownerActionStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          Owner action: {ownerActionStatus}
                        </span>
                      </div>
                      {booking?.owner_name || booking?.owner_mobile ? (
                        <div className="mt-3 rounded-xl border border-[#d7ecea] bg-[#f8fffe] p-3 text-xs text-[#073735]/80">
                          <p className="font-semibold text-[#073735]">
                            Owner Contact (available after booking)
                          </p>
                          <p className="mt-1">
                            Name: <span className="font-semibold">{booking.owner_name || '-'}</span>
                          </p>
                          <p>
                            Phone:{' '}
                            <span className="font-semibold">{booking.owner_mobile || '-'}</span>
                          </p>
                          <p>
                            Email:{' '}
                            <span className="font-semibold">{booking.owner_email || '-'}</span>
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {booking?.owner_mobile ? (
                              <a
                                href={`tel:${normalizePhone(booking.owner_mobile)}`}
                                className="inline-flex items-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 font-semibold text-[#073735] hover:bg-[#f1f9f9]"
                              >
                                <Phone size={13} />
                                Call
                              </a>
                            ) : null}
                            {booking?.owner_mobile ? (
                              <a
                                href={`https://wa.me/${normalizePhone(booking.owner_mobile)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 font-semibold text-[#073735] hover:bg-[#f1f9f9]"
                              >
                                <MessageCircleMore size={13} />
                                WhatsApp
                              </a>
                            ) : null}
                            {booking?.owner_email ? (
                              <a
                                href={`mailto:${booking.owner_email}`}
                                className="inline-flex items-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 font-semibold text-[#073735] hover:bg-[#f1f9f9]"
                              >
                                <Mail size={13} />
                                Email
                              </a>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {reviewEnabled && !showReviewAsSubmitted ? (
                        <div className="mt-3 rounded-xl border border-[#d7ecea] bg-[#f8fffe] p-3">
                          <p className="text-xs font-semibold text-[#073735]">
                            Rate your booking experience
                          </p>
                          <div className="mt-2 grid gap-2">
                            <div className="rounded-xl border border-[#cde7e5] bg-white px-3 py-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((starValue) => {
                                  const active = Number(draft.rating || 0) >= starValue;
                                  return (
                                    <button
                                      key={starValue}
                                      type="button"
                                      onClick={() =>
                                        setReviewDrafts((prev) => ({
                                          ...prev,
                                          [String(booking.id)]: {
                                            ...draft,
                                            rating: starValue,
                                          },
                                        }))
                                      }
                                      className="rounded p-1 hover:bg-[#f1f9f9]"
                                      aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                                    >
                                      <Star
                                        size={20}
                                        className={
                                          active
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-[#b7d4d2]'
                                        }
                                      />
                                    </button>
                                  );
                                })}
                                <span className="ml-2 text-xs font-semibold text-[#073735]/70">
                                  {Number(draft.rating || 5)} / 5
                                </span>
                              </div>
                            </div>
                            <input
                              value={draft.comment}
                              onChange={(event) =>
                                setReviewDrafts((prev) => ({
                                  ...prev,
                                  [String(booking.id)]: {
                                    ...draft,
                                    comment: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Write your review"
                              className="rounded-xl border border-[#cde7e5] bg-white px-3 py-2 text-sm text-[#073735]"
                            />
                            <button
                              type="button"
                              disabled={
                                reviewMutation.isPending ||
                                String(draft.comment || '').trim().length < 3
                              }
                              onClick={() =>
                                reviewMutation.mutate({
                                  bookingId: Number(booking.id),
                                  rating: Number(draft.rating || 5),
                                  comment: String(draft.comment || '').trim(),
                                })
                              }
                              className="rounded-xl bg-[#0f8f8b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
                            >
                              {reviewMutation.isPending ? 'Saving...' : 'Submit'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {reviewEnabled && showReviewAsSubmitted ? (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs font-semibold text-emerald-700">
                            Thanks, your review has been submitted.
                          </p>
                          {submittedReview ? (
                            <div className="mt-2 rounded-lg border border-emerald-200 bg-white/80 p-2">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((starValue) => (
                                  <Star
                                    key={starValue}
                                    size={14}
                                    className={
                                      Number(submittedReview.rating || 0) >= starValue
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-[#b7d4d2]'
                                    }
                                  />
                                ))}
                                <span className="ml-2 text-xs font-semibold text-[#073735]/75">
                                  {Number(submittedReview.rating || 0)} / 5
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#073735]/85">
                                {submittedReview.comment}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
