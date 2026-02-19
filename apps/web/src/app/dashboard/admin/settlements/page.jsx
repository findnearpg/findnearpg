'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useQuery } from '@tanstack/react-query';

function formatAmount(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function AdminSettlementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-settlements-overview'],
    queryFn: async () => {
      const response = await fetch('/api/admin/overview');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch settlements');
      return json;
    },
  });
  const settlements = data?.ownerSettlements || [];
  const totalPaidBookings = settlements.reduce(
    (sum, row) => sum + Number(row.paidBookings || 0),
    0
  );
  const totalGross = settlements.reduce((sum, row) => sum + Number(row.grossAmount || 0), 0);
  const totalPlatform = settlements.reduce(
    (sum, row) => sum + Number(row.platformCommission || 0),
    0
  );
  const totalOwnerCollection = settlements.reduce(
    (sum, row) => sum + Number(row.payoutToOwner || 0),
    0
  );

  return (
    <AdminDashboardShell
      activeKey="settlements"
      title="Owner Collection Summary"
      description="Track owner-wise booking value and expected direct collection at property location."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Owner Accounts
          </p>
          <p className="mt-1 text-2xl font-black text-[#073735]">{settlements.length}</p>
        </div>
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Paid Bookings
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{totalPaidBookings}</p>
        </div>
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Gross Rent
          </p>
          <p className="mt-1 text-2xl font-black text-[#073735]">{formatAmount(totalGross)}</p>
        </div>
        <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
            Owner Collection
          </p>
          <p className="mt-1 text-2xl font-black text-[#0c6764]">
            {formatAmount(totalOwnerCollection)}
          </p>
        </div>
      </div>

      <div className="mb-3 flex justify-end">
        <a
          href="/api/admin/overview/export?period=settlement"
          className="rounded-full bg-[#073735] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Export Collection CSV
        </a>
      </div>

      {isLoading ? (
        <p className="text-sm text-[#073735]/70">Loading owner collection summary...</p>
      ) : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          <div className="grid gap-3 lg:hidden">
            {settlements.map((row) => (
              <article
                key={row.ownerId}
                className="rounded-2xl border border-[#dcefed] bg-white p-4"
              >
                <p className="text-sm font-extrabold text-[#073735]">Owner #{row.ownerId}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#073735]/80">
                  <p>
                    Paid: <span className="font-semibold text-[#073735]">{row.paidBookings}</span>
                  </p>
                  <p>
                    Gross:{' '}
                    <span className="font-semibold text-[#073735]">
                      {formatAmount(row.grossAmount)}
                    </span>
                  </p>
                  <p>
                    Platform:{' '}
                    <span className="font-semibold text-[#0c6764]">
                      {formatAmount(row.platformCommission)}
                    </span>
                  </p>
                  <p>
                    Owner:{' '}
                    <span className="font-semibold text-[#073735]">
                      {formatAmount(row.payoutToOwner)}
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
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Paid Bookings</th>
                  <th className="px-3 py-2">Gross Rent Value</th>
                  <th className="px-3 py-2">Platform Collection</th>
                  <th className="px-3 py-2">Owner Collection</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((row) => (
                  <tr key={row.ownerId} className="border-t border-[#eef7f6]">
                    <td className="px-3 py-2 font-semibold text-[#073735]">#{row.ownerId}</td>
                    <td className="px-3 py-2">{row.paidBookings}</td>
                    <td className="px-3 py-2">{formatAmount(row.grossAmount)}</td>
                    <td className="px-3 py-2 font-semibold text-[#0c6764]">
                      {formatAmount(row.platformCommission)} ({row.commissionRate}%)
                    </td>
                    <td className="px-3 py-2">{formatAmount(row.payoutToOwner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {settlements.length === 0 ? (
            <div className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm text-[#073735]/70">
              No settlement rows available.
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3 text-xs text-[#073735]/75">
            Platform Collection Total:{' '}
            <span className="font-bold text-[#0c6764]">{formatAmount(totalPlatform)}</span>
          </div>
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
