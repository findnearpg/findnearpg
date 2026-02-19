'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useQuery } from '@tanstack/react-query';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-[#e7f4f3] bg-[#f8fffe] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#073735]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#073735]/65">{hint}</p> : null}
    </div>
  );
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function toPercent(part, total) {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function PieCard({ title, total, slices }) {
  const safeTotal = Number(total || 0);
  const gradient =
    safeTotal > 0
      ? `conic-gradient(${slices
          .map((slice, index) => {
            const start = slices
              .slice(0, index)
              .reduce((sum, prev) => sum + (Number(prev.value || 0) / safeTotal) * 360, 0);
            const end = start + (Number(slice.value || 0) / safeTotal) * 360;
            return `${slice.color} ${start}deg ${end}deg`;
          })
          .join(', ')})`
      : 'conic-gradient(#e5eeed 0deg 360deg)';

  return (
    <article className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4">
      <p className="text-sm font-bold text-[#073735]">{title}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
        <div
          className="mx-auto flex h-32 w-32 items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-lg font-black text-[#073735]">
            {safeTotal}
          </div>
        </div>
        <div className="space-y-2">
          {slices.map((slice) => (
            <p
              key={slice.label}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-[#073735]"
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="font-semibold">
                {slice.value} ({toPercent(Number(slice.value || 0), safeTotal)}%)
              </span>
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function OwnerAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/owner/analytics');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load analytics');
      return json;
    },
  });

  const totalListings = Number(data?.listings?.total_listings || 0);
  const approvedListings = Number(data?.listings?.approved_listings || 0);
  const pendingListings = Math.max(totalListings - approvedListings, 0);
  const totalBookings = Number(data?.bookings?.total_bookings || 0);
  const pendingBookings = Number(data?.bookings?.pending_bookings || 0);
  const activeBookings = Math.max(totalBookings - pendingBookings, 0);

  return (
    <OwnerDashboardShell
      activeKey="analytics"
      title="Owner Analytics"
      description="Simple business numbers for properties and bookings."
      actions={
        <>
          <a
            href="/dashboard/owner/overview"
            className="rounded-full border border-[#b9ddda] bg-white px-3 py-1.5 text-xs font-semibold text-[#073735] hover:bg-[#f2fbfa]"
          >
            Overview
          </a>
          <a
            href="/dashboard/owner/bookings"
            className="rounded-full border border-[#b9ddda] bg-white px-3 py-1.5 text-xs font-semibold text-[#073735] hover:bg-[#f2fbfa]"
          >
            Booking Ops
          </a>
        </>
      }
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading analytics...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Properties"
              value={totalListings}
              hint="All your listed properties"
            />
            <StatCard label="Total Bookings" value={totalBookings} hint="All bookings received" />
            <StatCard label="Pending Follow-up" value={pendingBookings} hint="Need your action" />
            <StatCard
              label="Rent to Collect"
              value={formatMoney(data?.bookings?.remaining_to_collect || 0)}
              hint="Collect directly at PG/location"
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <PieCard
              title="Listings Distribution"
              total={totalListings}
              slices={[
                { label: 'Approved', value: approvedListings, color: '#0f8f8b' },
                { label: 'Pending', value: pendingListings, color: '#f59e0b' },
              ]}
            />
            <PieCard
              title="Bookings Distribution"
              total={totalBookings}
              slices={[
                { label: 'Active', value: activeBookings, color: '#0284c7' },
                { label: 'Pending', value: pendingBookings, color: '#f97316' },
              ]}
            />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <a
              href="/dashboard/owner/properties/new"
              className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-3 text-sm text-[#073735] hover:bg-[#f1f9f9]"
            >
              <p className="font-bold">Need More Listings?</p>
              <p className="mt-1 text-[#073735]/70">
                Add a new property listing to improve booking volume.
              </p>
            </a>
            <a
              href="/dashboard/owner/subscription"
              className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-3 text-sm text-[#073735] hover:bg-[#f1f9f9]"
            >
              <p className="font-bold">Subscription Upgrade</p>
              <p className="mt-1 text-[#073735]/70">
                Increase property limit and unlock all booking details.
              </p>
            </a>
          </div>
        </>
      ) : null}
    </OwnerDashboardShell>
  );
}
