'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Mail, MessageCircleMore, Phone, Search, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function statusBadge(status) {
  const normalized = String(status || 'pending').toLowerCase();
  if (normalized === 'confirmed' || normalized === 'paid' || normalized === 'booked') {
    return 'bg-green-50 text-green-700';
  }
  if (normalized === 'cancelled' || normalized === 'failed') {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-[#e7f4f3] bg-[#f8fffe] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#073735]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#073735]/65">{hint}</p> : null}
    </div>
  );
}

export default function OwnerBookingsPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings?limit=100');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch bookings');
      return json;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['owner-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/owner/subscription');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch subscription');
      return json;
    },
  });

  const filteredBookings = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.filter((booking) => {
      const query = searchText.trim().toLowerCase();
      const statusOk =
        statusFilter === 'all' ||
        String(booking.booking_status || '').toLowerCase() === statusFilter;
      if (!query) return statusOk;

      const text = [
        booking?.id,
        booking?.title,
        booking?.city,
        booking?.area,
        booking?.user_name,
        booking?.user_phone,
        booking?.user_email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return statusOk && text.includes(query);
    });
  }, [data, searchText, statusFilter]);

  const summary = useMemo(() => {
    const list = filteredBookings;
    const pending = list.filter(
      (item) => String(item.booking_status || '').toLowerCase() === 'pending'
    ).length;
    const actionRequired = list.filter(
      (item) => String(item.owner_action_status || 'pending').toLowerCase() === 'pending'
    ).length;
    const remainingToCollect = list.reduce((sum, item) => {
      const bookingStatus = String(item.booking_status || '').toLowerCase();
      if (bookingStatus === 'cancelled' || bookingStatus === 'failed') return sum;
      const rent = Number(item.rent_amount || item.amount || 0);
      return sum + Math.max(Number(item.remaining_amount ?? rent), 0);
    }, 0);
    return {
      total: list.length,
      pending,
      actionRequired,
      remainingToCollect,
    };
  }, [filteredBookings]);

  const lockedDetailsCount = filteredBookings.filter((item) => Boolean(item.details_locked)).length;

  const actionMutation = useMutation({
    mutationFn: async ({ bookingId, action }) => {
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update booking action');
      return json;
    },
    onSuccess: (result) => {
      toast.success(`Booking marked as ${result.action}`);
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['owner-notifications'] });
    },
    onError: (error) => toast.error(error.message || 'Failed to update booking'),
  });

  function bookingShareMessage(booking) {
    const totalRent = Number(booking.rent_amount || booking.amount || 0);
    const remainingAtProperty = Math.max(Number(booking.remaining_amount ?? totalRent), 0);
    return [
      `Booking #${booking.id}`,
      `Property: ${booking?.title || 'Property'} (${booking?.area || '-'}, ${booking?.city || '-'})`,
      `Tenant: ${booking?.user_name || '-'}`,
      `Phone: ${booking?.user_phone || '-'}`,
      `Email: ${booking?.user_email || '-'}`,
      `Room Type: ${booking?.room_type || '-'}`,
      `Total Rent: ${formatMoney(totalRent)}`,
      `Collect at PG/location: ${formatMoney(remainingAtProperty || totalRent)}`,
      `Booking: ${booking?.booking_status || 'booked'}`,
      `Created: ${formatDate(booking?.created_at)}`,
    ].join('\n');
  }

  async function copyDetails(booking) {
    try {
      await navigator.clipboard.writeText(bookingShareMessage(booking));
      toast.success('Booking details copied');
    } catch {
      toast.error('Unable to copy booking details');
    }
  }

  function sendWhatsApp(booking) {
    const phone = String(booking?.user_phone || '').replace(/\D/g, '');
    if (!phone) {
      toast.error('Tenant phone number is missing');
      return;
    }
    const encodedText = encodeURIComponent(bookingShareMessage(booking));
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  }

  function sendEmail(booking) {
    const email = String(booking?.user_email || '').trim();
    if (!email) {
      toast.error('Tenant email is missing');
      return;
    }
    const subject = encodeURIComponent(`Booking #${booking.id} details`);
    const body = encodeURIComponent(bookingShareMessage(booking));
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <OwnerDashboardShell
      activeKey="bookings"
      title="Bookings"
      description="View bookings, contact tenant, and update booking action."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading bookings...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Bookings"
              value={summary.total}
              hint="Based on current filters"
            />
            <StatCard label="Pending" value={summary.pending} hint="Needs follow-up" />
            <StatCard
              label="Action Required"
              value={summary.actionRequired}
              hint="Tap attended/rejected"
            />
            <StatCard
              label="Rent to Collect"
              value={formatMoney(summary.remainingToCollect)}
              hint="Collect at property"
            />
          </div>

          <div className="mb-4 rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-3 text-sm text-[#073735]/80">
            Tenant pays directly at property. No online payment is collected on platform.
          </div>

          {!subscription?.active && lockedDetailsCount > 0 ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {lockedDetailsCount} booking detail(s) are locked. Upgrade plan to unlock all user
              details.
              <a href="/dashboard/owner/subscription" className="ml-1 font-bold underline">
                Open Subscription
              </a>
            </div>
          ) : null}

          <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#073735]/55"
              />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search booking ID, property, tenant name, phone, email"
                className="w-full rounded-xl border border-[#cde7e5] bg-white py-2 pl-10 pr-3 text-sm text-[#073735] outline-none ring-[#0f8f8b] focus:ring-2"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-[#cde7e5] bg-white px-3 py-2 text-sm text-[#073735] outline-none ring-[#0f8f8b] focus:ring-2"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="booked">Booked</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </>
      ) : null}

      {!isLoading && !error && filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cde7e5] bg-[#f8fffe] p-6 text-center">
          <p className="text-sm text-[#073735]/70">No bookings found for current filter.</p>
        </div>
      ) : null}

      {!isLoading && !error && filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const totalRent = Number(booking.rent_amount || booking.amount || 0);
            const remainingAtProperty = Number(booking.remaining_amount ?? totalRent);
            const detailsLocked = Boolean(booking.details_locked);
            const ownerActionStatus = String(
              booking.owner_action_status || 'pending'
            ).toLowerCase();
            const actionPending = ownerActionStatus === 'pending';

            return (
              <article
                key={booking.id}
                className="rounded-2xl border border-[#e7f4f3] bg-[#fbfefe] p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-[#073735]">
                      {booking.title || 'Property'}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(booking.booking_status)}`}
                    >
                      Booking: {booking.booking_status || 'pending'}
                    </span>
                  </div>

                  <p className="text-sm text-[#073735]/70">
                    Booking #{booking.id} • {booking.area}, {booking.city} • Created:{' '}
                    {formatDate(booking.created_at)}
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#073735]">
                      <span className="font-semibold">Tenant:</span>{' '}
                      {detailsLocked
                        ? 'Locked (upgrade required)'
                        : booking.user_name || `User #${booking.user_id}`}
                    </p>
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#073735]">
                      <span className="font-semibold">Phone:</span>{' '}
                      {detailsLocked ? 'Locked' : booking.user_phone || '-'}
                    </p>
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#073735]">
                      <span className="font-semibold">Email:</span>{' '}
                      {detailsLocked ? 'Locked' : booking.user_email || '-'}
                    </p>
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#073735]">
                      <span className="font-semibold">Room Type:</span> {booking.room_type || '-'}
                    </p>
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#073735]">
                      <span className="font-semibold">Total Rent:</span> {formatMoney(totalRent)}
                    </p>
                    <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#073735]">
                      <span className="font-semibold">Collect at PG:</span>{' '}
                      {formatMoney(remainingAtProperty || totalRent)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyDetails(booking)}
                      disabled={detailsLocked}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 text-xs font-semibold text-[#073735] disabled:opacity-50"
                    >
                      <Copy size={13} />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => sendWhatsApp(booking)}
                      disabled={detailsLocked}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 text-xs font-semibold text-[#073735] disabled:opacity-50"
                    >
                      <MessageCircleMore size={13} />
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => sendEmail(booking)}
                      disabled={detailsLocked}
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 text-xs font-semibold text-[#073735] disabled:opacity-50"
                    >
                      <Mail size={13} />
                      Email
                    </button>
                    <a
                      href={
                        detailsLocked
                          ? undefined
                          : `tel:${String(booking?.user_phone || '').replace(/\D/g, '')}`
                      }
                      className={`inline-flex items-center justify-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-1 text-xs font-semibold text-[#073735] ${
                        detailsLocked ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <Phone size={13} />
                      Call
                    </a>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        ownerActionStatus === 'attended'
                          ? 'bg-emerald-100 text-emerald-700'
                          : ownerActionStatus === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      Owner action: {ownerActionStatus}
                    </span>
                  </div>

                  {actionPending ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          actionMutation.mutate({ bookingId: booking.id, action: 'attended' })
                        }
                        disabled={actionMutation.isPending}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={13} />
                        Attended
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          actionMutation.mutate({ bookingId: booking.id, action: 'rejected' })
                        }
                        disabled={actionMutation.isPending}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        <XCircle size={13} />
                        Rejected
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </OwnerDashboardShell>
  );
}
