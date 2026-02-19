'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

function formatAmount(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function percentChange(current, previous) {
  const c = Number(current || 0);
  const p = Number(previous || 0);
  if (p <= 0) return c > 0 ? 100 : 0;
  return ((c - p) / p) * 100;
}

function trendMeta(change) {
  const positive = change >= 0;
  return {
    label: `${positive ? '+' : ''}${change.toFixed(1)}%`,
    className: positive ? 'text-emerald-700' : 'text-rose-700',
  };
}

function MiniTrendChart({ title, subtitle, data }) {
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = Math.max(...safeData.map((item) => Number(item?.paidAmount || 0)), 1);

  return (
    <article className="rounded-2xl border border-[#dcefed] bg-white p-4">
      <h3 className="text-sm font-extrabold text-[#073735]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#073735]/65">{subtitle}</p> : null}
      <div className="mt-3 grid grid-cols-7 gap-2">
        {safeData.slice(-7).map((item) => {
          const value = Number(item?.paidAmount || 0);
          const height = Math.max(10, Math.round((value / maxValue) * 96));
          return (
            <div key={item.key} className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center rounded-lg bg-[#f5fbfa]">
                <div
                  className="w-4 rounded-t bg-gradient-to-t from-[#0f8f8b] to-[#31b7b2]"
                  style={{ height }}
                />
              </div>
              <span className="text-[10px] font-semibold text-[#073735]/60">
                {String(item.key).slice(-2)}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MetricCard({ label, value, meta, trend }) {
  return (
    <article className="rounded-2xl border border-[#dcefed] bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-[#073735]">{value}</p>
      {meta ? <p className="mt-1 text-xs text-[#073735]/65">{meta}</p> : null}
      {trend ? <p className={`mt-2 text-xs font-bold ${trend.className}`}>{trend.label}</p> : null}
    </article>
  );
}

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState({ from: '', to: '', city: '', ownerId: '' });
  const [appliedFilters, setAppliedFilters] = useState({ from: '', to: '', city: '', ownerId: '' });

  const {
    data: overview,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-overview-dashboard', appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedFilters.from) params.set('from', appliedFilters.from);
      if (appliedFilters.to) params.set('to', appliedFilters.to);
      if (appliedFilters.city) params.set('city', appliedFilters.city);
      if (appliedFilters.ownerId) params.set('ownerId', appliedFilters.ownerId);
      const response = await fetch(
        `/api/admin/overview${params.toString() ? `?${params.toString()}` : ''}`
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch overview');
      return json;
    },
  });

  const monthlySeries = overview?.reports?.monthly || [];
  const dailySeries = overview?.reports?.daily || [];
  const today = dailySeries[dailySeries.length - 1] || {};
  const yesterday = dailySeries[dailySeries.length - 2] || {};
  const thisMonth = monthlySeries[monthlySeries.length - 1] || {};
  const lastMonth = monthlySeries[monthlySeries.length - 2] || {};

  const bookingsTrend = trendMeta(percentChange(today.bookings, yesterday.bookings));
  const revenueTrend = trendMeta(percentChange(today.paidAmount, yesterday.paidAmount));
  const ownerCollectionTrend = trendMeta(percentChange(thisMonth.paidAmount, lastMonth.paidAmount));

  const gross = Number(overview?.revenue?.totalPaidAmount || 0);
  const platformCollection = 0;
  const ownerCollection = gross;

  const cityRows = useMemo(() => (overview?.topCities || []).slice(0, 6), [overview?.topCities]);
  const recentRows = useMemo(
    () => (overview?.recentTransactions || []).slice(0, 8),
    [overview?.recentTransactions]
  );

  return (
    <AdminDashboardShell
      activeKey="overview"
      title="Admin Overview"
      description="Control center for owner verification, booking operations, and direct-collection monitoring."
    >
      <section className="mb-5 rounded-2xl border border-[#dcefed] bg-gradient-to-r from-[#f8fffe] via-white to-[#f8fffe] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#073735]">Direct Collection Model Enabled</p>
            <p className="mt-1 text-xs text-[#073735]/70">
              Users book on platform and pay owners directly at property location. Platform
              collection is currently set to 0.
            </p>
          </div>
          <span className="rounded-full bg-[#e6f8f6] px-3 py-1 text-xs font-bold text-[#0c6764]">
            Operational Mode: Direct Pay
          </span>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-[#dcefed] bg-white p-4">
        <h2 className="text-sm font-extrabold text-[#073735]">Quick Filters</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
          />
          <input
            type="text"
            value={filters.city}
            onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
            placeholder="Filter by city"
            className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
          />
          <input
            type="number"
            value={filters.ownerId}
            onChange={(e) => setFilters((p) => ({ ...p, ownerId: e.target.value }))}
            placeholder="Filter by owner ID"
            className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAppliedFilters(filters)}
            className="rounded-full bg-[#0f8f8b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6764]"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              const cleared = { from: '', to: '', city: '', ownerId: '' };
              setFilters(cleared);
              setAppliedFilters(cleared);
            }}
            className="rounded-full bg-[#ecf5f4] px-4 py-2 text-sm font-semibold text-[#073735] hover:bg-[#d9ecea]"
          >
            Clear
          </button>
        </div>
      </section>

      {isLoading ? <p className="text-sm text-[#073735]/70">Loading analytics...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <>
          <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Bookings"
              value={overview?.totals?.bookings || 0}
              meta={`Active: ${overview?.totals?.paidBookings || 0} | Pending: ${overview?.totals?.pendingBookings || 0}`}
              trend={{ ...bookingsTrend, label: `Today vs Yesterday ${bookingsTrend.label}` }}
            />
            <MetricCard
              label="Gross Rent Value"
              value={formatAmount(gross)}
              meta="Total rent value from active bookings"
              trend={{ ...revenueTrend, label: `Today vs Yesterday ${revenueTrend.label}` }}
            />
            <MetricCard
              label="Platform Collection"
              value={formatAmount(platformCollection)}
              meta="No user-side payment gateway in current model"
            />
            <MetricCard
              label="Owner Collection"
              value={formatAmount(ownerCollection)}
              meta="Expected amount to be collected by owners"
              trend={{
                ...ownerCollectionTrend,
                label: `This month vs last month ${ownerCollectionTrend.label}`,
              }}
            />
          </section>

          <section className="mb-5 grid gap-4 xl:grid-cols-2">
            <MiniTrendChart
              title="Rent Trend (Last 7 Days)"
              subtitle="Based on booking activity"
              data={dailySeries}
            />
            <MiniTrendChart
              title="Rent Trend (Recent Months)"
              subtitle="Month-wise activity overview"
              data={monthlySeries}
            />
          </section>

          <section className="mb-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <article className="rounded-2xl border border-[#dcefed] bg-white p-4">
              <h3 className="text-sm font-extrabold text-[#073735]">
                Top Cities by Booking Activity
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-[#073735]/55">
                    <tr>
                      <th className="px-2 py-2">City</th>
                      <th className="px-2 py-2">Bookings</th>
                      <th className="px-2 py-2">Rent Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityRows.map((row) => (
                      <tr key={row.city} className="border-t border-[#eef7f6]">
                        <td className="px-2 py-2 font-semibold text-[#073735]">{row.city}</td>
                        <td className="px-2 py-2">{row.paidBookings}</td>
                        <td className="px-2 py-2">{formatAmount(row.amount)}</td>
                      </tr>
                    ))}
                    {cityRows.length === 0 ? (
                      <tr>
                        <td className="px-2 py-3 text-[#073735]/65" colSpan={3}>
                          No city-level booking activity available.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-2xl border border-[#dcefed] bg-white p-4">
              <h3 className="text-sm font-extrabold text-[#073735]">Platform Health Snapshot</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-[#f8fffe] px-3 py-2">
                  <span className="text-[#073735]/70">Owners</span>
                  <span className="font-bold text-[#073735]">{overview?.totals?.owners || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#f8fffe] px-3 py-2">
                  <span className="text-[#073735]/70">Users</span>
                  <span className="font-bold text-[#073735]">{overview?.totals?.users || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#f8fffe] px-3 py-2">
                  <span className="text-[#073735]/70">Properties</span>
                  <span className="font-bold text-[#073735]">
                    {overview?.totals?.properties || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#f8fffe] px-3 py-2">
                  <span className="text-[#073735]/70">Live Properties</span>
                  <span className="font-bold text-emerald-700">
                    {overview?.totals?.liveProperties || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#f8fffe] px-3 py-2">
                  <span className="text-[#073735]/70">Under Review</span>
                  <span className="font-bold text-amber-700">
                    {overview?.totals?.underReviewProperties || 0}
                  </span>
                </div>
              </div>
            </article>
          </section>

          <section className="mb-5 rounded-2xl border border-[#dcefed] bg-white p-4">
            <h3 className="text-sm font-extrabold text-[#073735]">Recent Booking Activity</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wide text-[#073735]/55">
                  <tr>
                    <th className="px-2 py-2">Time</th>
                    <th className="px-2 py-2">Booking</th>
                    <th className="px-2 py-2">City</th>
                    <th className="px-2 py-2">Owner</th>
                    <th className="px-2 py-2">Rent Value</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((tx) => (
                    <tr
                      key={`${tx.bookingId}-${tx.createdAt}`}
                      className="border-t border-[#eef7f6]"
                    >
                      <td className="px-2 py-2 text-[#073735]/70">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 font-semibold text-[#073735]">#{tx.bookingId}</td>
                      <td className="px-2 py-2">{tx.city}</td>
                      <td className="px-2 py-2">#{tx.ownerId}</td>
                      <td className="px-2 py-2">{formatAmount(tx.amount)}</td>
                    </tr>
                  ))}
                  {recentRows.length === 0 ? (
                    <tr>
                      <td className="px-2 py-3 text-[#073735]/65" colSpan={5}>
                        No booking activity available for current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/dashboard/admin/approvals"
              className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm font-semibold text-[#073735] hover:bg-[#f8fffe]"
            >
              Open Approvals
            </a>
            <a
              href="/dashboard/admin/reports"
              className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm font-semibold text-[#073735] hover:bg-[#f8fffe]"
            >
              Open Reports
            </a>
            <a
              href="/dashboard/admin/settlements"
              className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm font-semibold text-[#073735] hover:bg-[#f8fffe]"
            >
              Open Collection Summary
            </a>
            <a
              href="/dashboard/admin/risk"
              className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm font-semibold text-[#073735] hover:bg-[#f8fffe]"
            >
              Open Risk Monitor
            </a>
          </section>
        </>
      ) : null}
    </AdminDashboardShell>
  );
}
