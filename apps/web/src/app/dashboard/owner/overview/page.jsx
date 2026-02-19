'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-[#e7f4f3] bg-[#f8fffe] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#073735]">{value}</p>
      <p className="mt-1 text-xs text-[#073735]/70">{hint}</p>
    </div>
  );
}

function toPercent(part, total) {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function PieCard({ title, slices, centerTitle, centerValue }) {
  const validSlices = slices.filter((item) => Number(item.value) > 0);
  const total = validSlices.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const gradient =
    total > 0
      ? `conic-gradient(${validSlices
          .map((item, index) => {
            const start = validSlices
              .slice(0, index)
              .reduce((sum, prev) => sum + (Number(prev.value || 0) / total) * 360, 0);
            const end = start + (Number(item.value || 0) / total) * 360;
            return `${item.color} ${start}deg ${end}deg`;
          })
          .join(', ')})`
      : 'conic-gradient(#e5eeed 0deg 360deg)';

  return (
    <article className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4">
      <p className="text-sm font-bold text-[#073735]">{title}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
        <div
          className="mx-auto flex h-36 w-36 items-center justify-center rounded-full"
          style={{ background: gradient }}
        >
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-[#073735]">
            <span className="text-xs font-semibold text-[#073735]/60">{centerTitle}</span>
            <span className="text-xl font-black">{centerValue}</span>
          </div>
        </div>
        <div className="space-y-2">
          {slices.map((slice) => (
            <div
              key={slice.label}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 text-[#073735]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span>{slice.label}</span>
              </div>
              <span className="font-semibold text-[#073735]">
                {slice.value} ({toPercent(Number(slice.value || 0), total)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function OwnerOverviewPage() {
  const { data: account } = useQuery({
    queryKey: ['owner-account'],
    queryFn: async () => {
      const response = await fetch('/api/owner/account');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load account');
      return json;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['owner-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/owner/analytics');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load analytics');
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

  const verificationStatus = String(account?.verificationStatus || 'not_submitted').toLowerCase();
  const ownerVerified = verificationStatus === 'approved';
  const totalListings = Number(analytics?.listings?.total_listings || 0);
  const approvedListings = Number(analytics?.listings?.approved_listings || 0);
  const pendingListings = Math.max(totalListings - approvedListings, 0);
  const totalBookings = Number(analytics?.bookings?.total_bookings || 0);
  const pendingBookings = Number(analytics?.bookings?.pending_bookings || 0);
  const activeBookings = Math.max(totalBookings - pendingBookings, 0);

  const actionCards = useMemo(() => {
    const cards = [];
    if (!ownerVerified) {
      cards.push({
        key: 'verify',
        title: 'Complete KYC Verification',
        note:
          verificationStatus === 'pending'
            ? 'Under review by admin.'
            : 'Required before adding property.',
        cta: 'Open Account Settings',
        href: '/dashboard/owner/account',
      });
    }
    if (subscription?.canAddProperty === false) {
      cards.push({
        key: 'subscription',
        title: 'Property limit reached',
        note: 'Upgrade your plan to add more properties.',
        cta: 'Open Subscription',
        href: '/dashboard/owner/subscription',
      });
    }
    if (ownerVerified && subscription?.canAddProperty) {
      cards.push({
        key: 'property',
        title: 'Add your next property',
        note: 'Your account is ready for a new listing.',
        cta: 'Add Property',
        href: '/dashboard/owner/properties/new',
      });
    }
    return cards;
  }, [ownerVerified, verificationStatus, subscription?.canAddProperty]);

  return (
    <OwnerDashboardShell
      activeKey="overview"
      title="Owner Overview"
      description="Simple summary of your listings, bookings, and actions."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Verification"
          value={ownerVerified ? 'Verified' : verificationStatus.replace(/_/g, ' ').toUpperCase()}
          hint={
            ownerVerified ? 'All owner features unlocked.' : 'Complete KYC to unlock add property.'
          }
        />
        <StatCard
          label="Properties"
          value={totalListings}
          hint={`Allowed in current plan: ${subscription?.planPropertyLimit ?? 1}`}
        />
        <StatCard
          label="Bookings"
          value={totalBookings}
          hint={
            subscription?.active
              ? 'All booking details unlocked'
              : 'Free booking detail unlock limit applies'
          }
        />
        <StatCard
          label="Subscription"
          value={subscription?.active ? subscription?.planName || 'Active' : 'Free'}
          hint={subscription?.active ? 'Plan active' : 'Upgrade for more limits'}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <PieCard
          title="Listings Status"
          centerTitle="Total"
          centerValue={totalListings}
          slices={[
            { label: 'Approved', value: approvedListings, color: '#0f8f8b' },
            { label: 'Pending', value: pendingListings, color: '#f59e0b' },
          ]}
        />
        <PieCard
          title="Bookings Status"
          centerTitle="Total"
          centerValue={totalBookings}
          slices={[
            { label: 'Active', value: activeBookings, color: '#0284c7' },
            { label: 'Pending', value: pendingBookings, color: '#f97316' },
          ]}
        />
      </div>

      <div className="mt-5 space-y-3">
        {actionCards.length === 0 ? (
          <div className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4 text-sm text-[#073735]/75">
            No immediate action required.
          </div>
        ) : null}

        {actionCards.map((item) => (
          <article key={item.key} className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#073735]">{item.title}</p>
                <p className="mt-1 text-sm text-[#073735]/70">{item.note}</p>
              </div>
              <a
                href={item.href}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#0f8f8b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6764] sm:w-auto"
              >
                {item.cta}
              </a>
            </div>
          </article>
        ))}
      </div>

      {!ownerVerified ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="inline-flex items-center gap-2 font-semibold">
            <AlertCircle size={16} />
            Add Property is locked until KYC approval.
          </p>
        </div>
      ) : null}
    </OwnerDashboardShell>
  );
}
