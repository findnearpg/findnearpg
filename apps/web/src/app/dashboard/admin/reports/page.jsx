'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const reportTabs = [
  { key: 'daily', label: 'Daily (7d)' },
  { key: 'monthly', label: 'Monthly (12m)' },
  { key: 'yearly', label: 'Yearly (5y)' },
];

function formatAmount(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function AdminReportsPage() {
  const [activeReport, setActiveReport] = useState('daily');
  const [filters, setFilters] = useState({ from: '', to: '', city: '', ownerId: '' });
  const [appliedFilters, setAppliedFilters] = useState({ from: '', to: '', city: '', ownerId: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-reports-overview', activeReport, appliedFilters],
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
      if (!response.ok) throw new Error(json.error || 'Failed to fetch reports');
      return json;
    },
  });

  const reportSeries = data?.reports?.[activeReport] || [];
  const totalBookings = reportSeries.reduce((sum, row) => sum + Number(row.bookings || 0), 0);
  const totalPaidBookings = reportSeries.reduce(
    (sum, row) => sum + Number(row.paidBookings || 0),
    0
  );
  const totalRentValue = reportSeries.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
  const totalPlatformCollection = reportSeries.reduce(
    (sum, row) => sum + Number(row.commission || 0),
    0
  );
  const buildExportUrl = () => {
    const params = new URLSearchParams();
    params.set('period', activeReport);
    if (appliedFilters.from) params.set('from', appliedFilters.from);
    if (appliedFilters.to) params.set('to', appliedFilters.to);
    if (appliedFilters.city) params.set('city', appliedFilters.city);
    if (appliedFilters.ownerId) params.set('ownerId', appliedFilters.ownerId);
    return `/api/admin/overview/export?${params.toString()}`;
  };

  return (
    <AdminDashboardShell
      activeKey="reports"
      title="Reports"
      description="Track booking and rent-value performance across daily, monthly, and yearly periods."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Total Bookings
          </p>
          <p className="mt-1 text-2xl font-black text-[#073735]">{totalBookings}</p>
        </div>
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Paid Bookings
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{totalPaidBookings}</p>
        </div>
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Rent Value
          </p>
          <p className="mt-1 text-2xl font-black text-[#073735]">{formatAmount(totalRentValue)}</p>
        </div>
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Platform Collection
          </p>
          <p className="mt-1 text-2xl font-black text-[#0c6764]">
            {formatAmount(totalPlatformCollection)}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-[#dcefed] bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
            className="rounded-xl border border-[#d6ebe8] px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
            className="rounded-xl border border-[#d6ebe8] px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={filters.city}
            onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
            placeholder="City"
            className="rounded-xl border border-[#d6ebe8] px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={filters.ownerId}
            onChange={(e) => setFilters((p) => ({ ...p, ownerId: e.target.value }))}
            placeholder="Owner ID"
            className="rounded-xl border border-[#d6ebe8] px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAppliedFilters(filters)}
            className="rounded-full bg-[#0f8f8b] px-4 py-2 text-sm font-semibold text-white"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={() => {
              const c = { from: '', to: '', city: '', ownerId: '' };
              setFilters(c);
              setAppliedFilters(c);
            }}
            className="rounded-full bg-[#ecf5f4] px-4 py-2 text-sm font-semibold text-[#073735]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {reportTabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setActiveReport(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeReport === tab.key ? 'bg-[#0f8f8b] text-white' : 'bg-[#ecf5f4] text-[#073735]'}`}
          >
            {tab.label}
          </button>
        ))}
        <a
          href={buildExportUrl()}
          className="rounded-full bg-[#073735] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Export CSV
        </a>
      </div>

      {isLoading ? <p className="text-sm text-[#073735]/70">Loading reports...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:hidden">
            {reportSeries.map((row) => (
              <article key={row.key} className="rounded-2xl border border-[#dcefed] bg-white p-4">
                <p className="text-sm font-extrabold text-[#073735]">{row.key}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#073735]/80">
                  <p>
                    Bookings: <span className="font-semibold text-[#073735]">{row.bookings}</span>
                  </p>
                  <p>
                    Paid: <span className="font-semibold text-[#073735]">{row.paidBookings}</span>
                  </p>
                  <p>
                    Rent:{' '}
                    <span className="font-semibold text-[#073735]">
                      {formatAmount(row.paidAmount)}
                    </span>
                  </p>
                  <p>
                    Collection:{' '}
                    <span className="font-semibold text-[#0c6764]">
                      {formatAmount(row.commission)}
                    </span>
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[#eef7f6] lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8fffe] text-xs uppercase tracking-wide text-[#073735]/60">
                <tr>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Bookings</th>
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Rent Value</th>
                  <th className="px-3 py-2">Platform Collection</th>
                </tr>
              </thead>
              <tbody>
                {reportSeries.map((row) => (
                  <tr key={row.key} className="border-t border-[#eef7f6]">
                    <td className="px-3 py-2 font-semibold text-[#073735]">{row.key}</td>
                    <td className="px-3 py-2">{row.bookings}</td>
                    <td className="px-3 py-2">{row.paidBookings}</td>
                    <td className="px-3 py-2">{formatAmount(row.paidAmount)}</td>
                    <td className="px-3 py-2 font-semibold text-[#0c6764]">
                      {formatAmount(row.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reportSeries.length === 0 ? (
            <div className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm text-[#073735]/70">
              No report data available for selected filter and period.
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
