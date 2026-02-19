'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AdminOwnerVerificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [logEntityFilter, setLogEntityFilter] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-owners'],
    queryFn: async () => {
      const response = await fetch('/api/admin/owners');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch owners');
      return json;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ ownerId, action, reason = '' }) => {
      const response = await fetch('/api/admin/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, action, reason }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update verification');
      return json;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === 'verify'
          ? 'Owner verification approved'
          : 'Owner verification rejected'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (error) => toast.error(error.message || 'Action failed'),
  });

  const owners = data || [];
  const pendingCount = owners.filter(
    (owner) => String(owner.verificationStatus || '').toLowerCase() === 'pending'
  ).length;
  const approvedCount = owners.filter(
    (owner) => String(owner.verificationStatus || '').toLowerCase() === 'approved'
  ).length;
  const rejectedCount = owners.filter(
    (owner) => String(owner.verificationStatus || '').toLowerCase() === 'rejected'
  ).length;
  const {
    data: duplicateLogsData,
    isLoading: duplicateLogsLoading,
    error: duplicateLogsError,
  } = useQuery({
    queryKey: ['admin-duplicate-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/duplicate-logs?limit=40');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch duplicate logs');
      return json;
    },
  });

  const filtered = useMemo(() => {
    const q = String(searchTerm || '')
      .trim()
      .toLowerCase();
    return owners.filter((owner) => {
      const status = String(owner.verificationStatus || 'not_submitted').toLowerCase();
      if (filter !== 'all' && status !== filter) return false;
      if (!q) return true;
      return (
        String(owner.id || '')
          .toLowerCase()
          .includes(q) ||
        String(owner.name || '')
          .toLowerCase()
          .includes(q) ||
        String(owner.email || '')
          .toLowerCase()
          .includes(q) ||
        String(owner.mobile || '')
          .toLowerCase()
          .includes(q) ||
        status.includes(q)
      );
    });
  }, [owners, filter, searchTerm]);
  const duplicateLogs = useMemo(() => {
    const list = duplicateLogsData?.items || [];
    if (logEntityFilter === 'all') return list;
    return list.filter((item) => String(item.entity_type || '').toLowerCase() === logEntityFilter);
  }, [duplicateLogsData, logEntityFilter]);

  function reject(owner) {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason || reason.trim().length < 5) {
      toast.error('Rejection reason must be at least 5 characters');
      return;
    }
    actionMutation.mutate({
      ownerId: owner.id,
      action: 'reject-verification',
      reason: reason.trim(),
    });
  }

  return (
    <AdminDashboardShell
      activeKey="owner-verifications"
      title="Owner Verification Queue"
      description="Review uploaded government IDs and approve/reject owner KYC before listing access."
    >
      {isLoading ? (
        <p className="text-sm text-[#073735]/70">Loading owner verifications...</p>
      ) : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Pending Review
              </p>
              <p className="mt-1 text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Approved
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{approvedCount}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Rejected
              </p>
              <p className="mt-1 text-2xl font-black text-rose-700">{rejectedCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search owner by ID, name, email, mobile"
                className="w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="not_submitted">Not Submitted</option>
                <option value="all">All</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('pending');
                }}
                className="rounded-xl bg-[#e8f7f5] px-4 py-2 text-sm font-semibold text-[#0c6764] hover:bg-[#d3eeec]"
              >
                Reset
              </button>
            </div>
            <p className="mt-2 text-xs text-[#073735]/65">
              Showing {filtered.length} owner records
            </p>
          </div>

          <div className="space-y-3">
            {filtered.map((owner) => (
              <article key={owner.id} className="rounded-2xl border border-[#dcefed] bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-[#073735]">
                      #{owner.id} • {owner.name}
                    </p>
                    <p className="text-xs text-[#073735]/70">
                      {owner.email} • {owner.mobile}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#0c6764]">
                      KYC Status:{' '}
                      {String(owner.verificationStatus || 'not_submitted').replace(/_/g, ' ')}
                    </p>
                    {owner.verificationRejectionReason ? (
                      <p className="mt-1 text-xs text-red-700">
                        Rejection reason: {owner.verificationRejectionReason}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-[#073735]/70">
                      Document: {owner.govtIdType || '-'}{' '}
                      {owner.govtIdNumber ? `• ${owner.govtIdNumber}` : ''}
                    </p>
                    {owner.govtIdUrl ? (
                      <a
                        href={owner.govtIdUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs font-semibold text-[#0f8f8b] underline"
                      >
                        View uploaded document
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-[#073735]/55">No document uploaded</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => actionMutation.mutate({ ownerId: owner.id, action: 'verify' })}
                      disabled={actionMutation.isPending}
                      className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(owner)}
                      disabled={actionMutation.isPending}
                      className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#dcefed] bg-white p-4">
              <p className="text-sm text-[#073735]/70">
                No owner verification records match this filter.
              </p>
            </div>
          ) : null}

          <section className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#073735]">Duplicate Guard Logs</h2>
                <p className="text-xs text-[#073735]/70">
                  Realtime reasons when duplicate owner/property requests are blocked.
                </p>
              </div>
              <select
                value={logEntityFilter}
                onChange={(event) => setLogEntityFilter(event.target.value)}
                className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-xs text-[#073735]"
              >
                <option value="all">All entities</option>
                <option value="owner">Owner</option>
                <option value="owner_kyc">Owner KYC</option>
                <option value="property">Property</option>
              </select>
            </div>

            {duplicateLogsLoading ? (
              <p className="mt-3 text-xs text-[#073735]/70">Loading duplicate logs...</p>
            ) : null}
            {!duplicateLogsLoading && duplicateLogsError ? (
              <p className="mt-3 text-xs text-red-600">{duplicateLogsError.message}</p>
            ) : null}
            {!duplicateLogsLoading && !duplicateLogsError && duplicateLogs.length === 0 ? (
              <p className="mt-3 text-xs text-[#073735]/70">
                No duplicate logs found for this filter.
              </p>
            ) : null}

            {!duplicateLogsLoading && !duplicateLogsError && duplicateLogs.length > 0 ? (
              <div className="mt-3 space-y-2">
                {duplicateLogs.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-[#dcefed] bg-white p-3"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-[#0c6764]">
                      {item.entity_type} • {item.reason_code}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#073735]">{item.message}</p>
                    <p className="mt-1 text-xs text-[#073735]/70">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      {' • '}
                      Actor: {item.actor_role || '-'} {item.actor_id ? `#${item.actor_id}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[#073735]/75">
                      Attempted: {JSON.stringify(item.attempted || {})}
                    </p>
                    <p className="mt-1 text-xs text-[#073735]/75">
                      Conflict: {JSON.stringify(item.conflict || {})}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
