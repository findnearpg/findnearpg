'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useQuery } from '@tanstack/react-query';

function formatAmount(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function AdminTransactionsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-transactions-overview'],
    queryFn: async () => {
      const response = await fetch('/api/admin/overview');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch transactions');
      return json;
    },
  });

  return (
    <AdminDashboardShell
      activeKey="transactions"
      title="Transactions"
      description="Monitor recent booking records and total rent value (direct owner collection model)."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading transactions...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {!isLoading && !error ? (
        <div className="space-y-2">
          {(data?.recentTransactions || []).map((tx) => (
            <article
              key={`${tx.bookingId}-${tx.createdAt}`}
              className="rounded-xl border border-[#e7f4f3] bg-[#f8fffe] px-3 py-3"
            >
              <p className="text-sm font-semibold text-[#073735]">
                Booking #{tx.bookingId} • Owner #{tx.ownerId} • User #{tx.userId}
              </p>
              <p className="text-xs text-[#073735]/70">
                {new Date(tx.createdAt).toLocaleString()} • {tx.city} • Rent Value{' '}
                {formatAmount(tx.amount)} • Platform Collection {formatAmount(tx.commission)}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
