'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function severityBadgeClass(severity) {
  const value = Number(severity || 1);
  if (value >= 8) return 'bg-red-50 text-red-700 border border-red-200';
  if (value >= 5) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-[#eef6ff] text-[#1d4ed8] border border-[#d6e7ff]';
}

function formatTime(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN');
}

export default function AdminRiskPage() {
  const queryClient = useQueryClient();
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [blockMessage, setBlockMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-risk-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/risk');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch risk dashboard');
      return json;
    },
  });

  const selectedOwner = useMemo(() => {
    if (!selectedOwnerId) return null;
    return (
      (data?.topOwners || []).find((owner) => Number(owner.owner_id) === Number(selectedOwnerId)) ||
      null
    );
  }, [data?.topOwners, selectedOwnerId]);

  const ownerWarnings = useMemo(() => {
    if (!selectedOwnerId) return [];
    return (data?.recentEvents || [])
      .filter((event) => Number(event.owner_id) === Number(selectedOwnerId))
      .slice(0, 10);
  }, [data?.recentEvents, selectedOwnerId]);

  const globalWarnings = useMemo(() => {
    return (data?.recentEvents || []).slice(0, 8);
  }, [data?.recentEvents]);
  const topOwners = data?.topOwners || [];
  const criticalSignals = (data?.recentEvents || []).filter(
    (event) => Number(event.severity || 0) >= 8
  ).length;
  const mediumSignals = (data?.recentEvents || []).filter((event) => {
    const severity = Number(event.severity || 0);
    return severity >= 5 && severity < 8;
  }).length;

  const ownerActionMutation = useMutation({
    mutationFn: async ({ ownerId, action, message = '' }) => {
      const response = await fetch('/api/admin/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, action, message }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update owner account');
      return json;
    },
    onSuccess: (_, variables) => {
      const action = String(variables?.action || '');
      toast.success(
        action === 'unblock'
          ? 'Owner unblocked and message pushed'
          : 'Owner blocked and message pushed'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-risk-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
      setBlockMessage('');
    },
    onError: (err) => toast.error(err.message || 'Failed to update owner'),
  });

  return (
    <AdminDashboardShell
      activeKey="risk"
      title="Risk Monitor"
      description="Track suspicious owner activity, conversion anomalies, and applied ranking penalties."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading risk insights...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {!isLoading && !error && data?.topOwners?.length === 0 ? (
        <p className="text-sm text-[#073735]/70">No risk signals detected yet.</p>
      ) : null}

      {!isLoading && !error ? (
        <section className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
              Tracked Owners
            </p>
            <p className="mt-1 text-2xl font-black text-[#073735]">{topOwners.length}</p>
          </div>
          <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
              Warning Events
            </p>
            <p className="mt-1 text-2xl font-black text-amber-700">
              {(data?.recentEvents || []).length}
            </p>
          </div>
          <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
              Critical Signals
            </p>
            <p className="mt-1 text-2xl font-black text-rose-700">{criticalSignals}</p>
          </div>
          <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
              Medium Signals
            </p>
            <p className="mt-1 text-2xl font-black text-[#b7791f]">{mediumSignals}</p>
          </div>
        </section>
      ) : null}

      {!isLoading && !error ? (
        <section className="mb-3 rounded-2xl border border-[#f7dfdf] bg-[#fff8f8] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#7a1616]">Warning Feed</h3>
            <span className="text-xs font-semibold text-[#7a1616]">{globalWarnings.length}</span>
          </div>
          {globalWarnings.length === 0 ? (
            <p className="text-xs text-[#7a1616]/70">No warning messages yet.</p>
          ) : (
            <div className="space-y-2">
              {globalWarnings.map((event, index) => (
                <div
                  key={`${event?._id || index}`}
                  className="rounded-xl border border-[#f2d2d2] bg-white p-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#7a1616]">
                      Owner #{event.owner_id} •{' '}
                      {String(event.event_type || 'warning').replaceAll('_', ' ')}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${severityBadgeClass(event.severity)}`}
                    >
                      Severity {Number(event.severity || 1)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#7a1616]/70">
                    {formatTime(event.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <div className="space-y-3">
        {topOwners.slice(0, 20).map((owner) => (
          <article
            key={owner.owner_id}
            className="rounded-2xl border border-[#e7f4f3] bg-white p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#073735]">Owner #{owner.owner_id}</h3>
                <p className="text-xs text-[#073735]/65">
                  Level: {owner.risk_level} • Conversion:{' '}
                  {(Number(owner?.metrics?.conversion_rate || 0) * 100).toFixed(2)}%
                </p>
              </div>
              <div className="text-xs font-semibold text-[#073735]">
                Risk score: {owner.risk_score}
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf6f5]">
              <div
                className={`h-full ${
                  Number(owner.risk_score || 0) >= 80
                    ? 'bg-rose-600'
                    : Number(owner.risk_score || 0) >= 50
                      ? 'bg-amber-500'
                      : 'bg-[#0f8f8b]'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, Number(owner.risk_score || 0)))}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[#073735]/65">
              Views: {owner?.metrics?.recent_views || 0} • Paid:{' '}
              {owner?.metrics?.paid_bookings || 0} • Cancelled/Failed:{' '}
              {owner?.metrics?.cancelled_or_failed_bookings || 0} • Penalty:{' '}
              {owner?.penalties?.rankingPenaltyLevel || 'none'}
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedOwnerId(owner.owner_id);
                  setBlockMessage('');
                }}
                className="rounded-full bg-[#0f8f8b] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0c6764]"
              >
                Get Details
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedOwner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[#dcefed] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#073735]">
                  Owner #{selectedOwner.owner_id} Risk Details
                </h3>
                <p className="text-xs text-[#073735]/65">
                  Level: {selectedOwner.risk_level} • Score: {selectedOwner.risk_score} • Updated:{' '}
                  {formatTime(selectedOwner.updated_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOwnerId(null);
                  setBlockMessage('');
                }}
                className="rounded-full bg-[#ecf5f4] px-3 py-1.5 text-xs font-semibold text-[#073735]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="rounded-xl bg-[#f8fffe] px-3 py-2 text-xs text-[#073735]">
                Recent Views: {selectedOwner?.metrics?.recent_views || 0}
              </p>
              <p className="rounded-xl bg-[#f8fffe] px-3 py-2 text-xs text-[#073735]">
                Paid Bookings: {selectedOwner?.metrics?.paid_bookings || 0}
              </p>
              <p className="rounded-xl bg-[#f8fffe] px-3 py-2 text-xs text-[#073735]">
                Cancelled/Failed: {selectedOwner?.metrics?.cancelled_or_failed_bookings || 0}
              </p>
              <p className="rounded-xl bg-[#f8fffe] px-3 py-2 text-xs text-[#073735]">
                Repeated Pair Cancels: {selectedOwner?.metrics?.repeated_pair_cancels || 0}
              </p>
              <p className="rounded-xl bg-[#f8fffe] px-3 py-2 text-xs text-[#073735]">
                Conversion Rate:{' '}
                {(Number(selectedOwner?.metrics?.conversion_rate || 0) * 100).toFixed(2)}%
              </p>
              <p className="rounded-xl bg-[#f8fffe] px-3 py-2 text-xs text-[#073735]">
                Ranking Penalty: {selectedOwner?.penalties?.rankingPenaltyLevel || 'none'}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-[#f7dfdf] bg-[#fff8f8] p-3">
              <h4 className="text-sm font-bold text-[#7a1616]">Warning Messages</h4>
              {ownerWarnings.length === 0 ? (
                <p className="mt-2 text-xs text-[#7a1616]/70">
                  No warning messages for this owner.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {ownerWarnings.map((event, index) => (
                    <div
                      key={`${event?._id || index}`}
                      className="rounded-xl border border-[#f2d2d2] bg-white p-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-[#7a1616]">
                          {String(event.event_type || 'warning').replaceAll('_', ' ')}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${severityBadgeClass(event.severity)}`}
                        >
                          Severity {Number(event.severity || 1)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#7a1616]/75">
                        {formatTime(event.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-[#dcefed] bg-[#f8fffe] p-3">
              <h4 className="text-sm font-bold text-[#073735]">Owner Account Action</h4>
              <textarea
                value={blockMessage}
                onChange={(event) => setBlockMessage(event.target.value)}
                rows={3}
                placeholder="Type warning/admin message to push to owner notifications"
                className="mt-2 w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    ownerActionMutation.mutate({
                      ownerId: selectedOwner.owner_id,
                      action: 'block',
                      message: blockMessage,
                    })
                  }
                  disabled={ownerActionMutation.isPending}
                  className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {ownerActionMutation.isPending ? 'Updating...' : 'Block + Push Message'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    ownerActionMutation.mutate({
                      ownerId: selectedOwner.owner_id,
                      action: 'unblock',
                      message: blockMessage,
                    })
                  }
                  disabled={ownerActionMutation.isPending}
                  className="rounded-full bg-[#0f8f8b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
                >
                  {ownerActionMutation.isPending ? 'Updating...' : 'Unblock + Push Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
