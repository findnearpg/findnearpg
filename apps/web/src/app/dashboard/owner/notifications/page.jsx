'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

async function fetchWithRetry(url, options, attempts = 2) {
  let lastError = null;
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url, options);
      const json = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, json };
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }
  return { ok: false, status: 0, json: { error: lastError?.message || 'Failed to fetch' } };
}

function getCategory(type) {
  const value = String(type || '').toLowerCase();
  if (value.startsWith('listing_')) return 'listing';
  if (value.includes('booking')) return 'booking';
  if (value.includes('block') || value.includes('account')) return 'account';
  return 'general';
}

function categoryLabel(category) {
  if (category === 'listing') return 'Listing';
  if (category === 'booking') return 'Booking';
  if (category === 'account') return 'Account';
  return 'General';
}

function categoryClass(category) {
  if (category === 'listing') return 'bg-[#eef6ff] text-[#1d4ed8]';
  if (category === 'booking') return 'bg-amber-50 text-amber-700';
  if (category === 'account') return 'bg-red-50 text-red-700';
  return 'bg-[#ecf5f4] text-[#0c6764]';
}

export default function OwnerNotificationsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-notifications'],
    queryFn: async () => {
      const result = await fetchWithRetry('/api/owner/notifications', undefined, 2);
      if (!result.ok) throw new Error(result.json?.error || 'Failed to fetch notifications');
      return result.json;
    },
    retry: 1,
    retryDelay: 500,
  });

  const notifications = data || [];
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const filterCounts = useMemo(() => {
    const listing = notifications.filter((item) => getCategory(item.type) === 'listing').length;
    const account = notifications.filter((item) => getCategory(item.type) === 'account').length;
    const booking = notifications.filter((item) => getCategory(item.type) === 'booking').length;
    const general = notifications.filter((item) => getCategory(item.type) === 'general').length;
    return {
      all: notifications.length,
      unread: unreadCount,
      listing,
      booking,
      account,
      general,
    };
  }, [notifications, unreadCount]);

  const visibleNotifications = useMemo(() => {
    if (activeFilter === 'unread') return notifications.filter((item) => !item.is_read);
    if (activeFilter === 'listing')
      return notifications.filter((item) => getCategory(item.type) === 'listing');
    if (activeFilter === 'booking')
      return notifications.filter((item) => getCategory(item.type) === 'booking');
    if (activeFilter === 'account')
      return notifications.filter((item) => getCategory(item.type) === 'account');
    if (activeFilter === 'general')
      return notifications.filter((item) => getCategory(item.type) === 'general');
    return notifications;
  }, [activeFilter, notifications]);

  const markReadMutation = useMutation({
    mutationFn: async () => {
      return fetchWithRetry(
        '/api/owner/notifications',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAll: true }),
        },
        2
      );
    },
    onSuccess: (result) => {
      if (!result?.ok) {
        toast.error(result?.json?.error || 'Failed to update notifications');
        return;
      }

      toast.success('Notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['owner-notifications'] });
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: async (notificationId) => {
      return fetchWithRetry(
        '/api/owner/notifications',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId }),
        },
        2
      );
    },
    onSuccess: (result) => {
      if (!result?.ok) {
        toast.error(result?.json?.error || 'Failed to update notification');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['owner-notifications'] });
    },
  });

  return (
    <OwnerDashboardShell
      activeKey="notifications"
      title="Notifications"
      description="Track listing approvals, review updates, and rejection reasons from admin."
      actions={
        <button
          type="button"
          onClick={() => markReadMutation.mutate()}
          disabled={markReadMutation.isPending || unreadCount === 0}
          className="rounded-full bg-[#0f8f8b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
        >
          Mark all as read {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      }
    >
      <div className="mb-3 rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#073735]">
            New messages: <span className="font-extrabold">{unreadCount}</span>
          </p>
          <p className="text-xs text-[#073735]/65">Total: {notifications.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All', count: filterCounts.all },
            { key: 'unread', label: 'Unread', count: filterCounts.unread },
            { key: 'listing', label: 'Listing', count: filterCounts.listing },
            { key: 'booking', label: 'Booking', count: filterCounts.booking },
            { key: 'account', label: 'Account', count: filterCounts.account },
            { key: 'general', label: 'General', count: filterCounts.general },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeFilter === filter.key ? 'bg-[#0f8f8b] text-white' : 'bg-white text-[#073735]'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-[#073735]/70">Loading notifications...</p> : null}
      {!isLoading && error && notifications.length === 0 ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : null}
      {!isLoading && error && notifications.length > 0 ? (
        <p className="text-xs text-amber-700">
          Sync issue: showing last loaded notifications. Retrying automatically.
        </p>
      ) : null}
      {!isLoading && !error && notifications.length === 0 ? (
        <p className="text-sm text-[#073735]/70">No notifications yet.</p>
      ) : null}
      {!isLoading && !error && notifications.length > 0 && visibleNotifications.length === 0 ? (
        <p className="text-sm text-[#073735]/70">No notifications in this filter.</p>
      ) : null}

      <div className="space-y-3">
        {visibleNotifications.map((item) => (
          <article
            key={item.id}
            onClick={() => {
              if (item.is_read || markSingleMutation.isPending) return;
              markSingleMutation.mutate(item.id);
            }}
            onKeyDown={(event) => {
              if (
                (event.key === 'Enter' || event.key === ' ') &&
                !item.is_read &&
                !markSingleMutation.isPending
              ) {
                event.preventDefault();
                markSingleMutation.mutate(item.id);
              }
            }}
            className={`rounded-2xl border p-4 ${
              item.is_read
                ? 'border-[#e7f4f3] bg-white'
                : 'cursor-pointer border-[#b8e2de] bg-[#f8fffe] hover:border-[#0f8f8b]'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[#073735]">{item.title}</p>
              {!item.is_read ? (
                <span className="rounded-full bg-[#0f8f8b] px-2 py-0.5 text-[11px] font-bold text-white">
                  NEW
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${categoryClass(
                  getCategory(item.type)
                )}`}
              >
                {categoryLabel(getCategory(item.type))}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#073735]/75 break-words">{item.message}</p>
            {item?.meta?.rejectionReason ? (
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Rejection reason: {item.meta.rejectionReason}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-[#073735]/60">
              {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
            </p>
          </article>
        ))}
      </div>
    </OwnerDashboardShell>
  );
}
