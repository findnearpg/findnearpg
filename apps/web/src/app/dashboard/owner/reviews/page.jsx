'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useMemo, useState } from 'react';

function stars(rating) {
  return Array.from({ length: 5 }, (_, i) => i < Number(rating || 0));
}

export default function OwnerReviewsPage() {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-reviews'],
    queryFn: async () => {
      const response = await fetch('/api/owner/reviews');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch reviews');
      return json;
    },
  });

  const markRead = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/owner/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to mark reviews read');
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-reviews'] }),
  });

  const items = useMemo(() => {
    const list = data?.items || [];
    if (!showUnreadOnly) return list;
    return list.filter((item) => !item.is_read);
  }, [data?.items, showUnreadOnly]);
  const unreadCount = Number(data?.unreadCount || 0);

  return (
    <OwnerDashboardShell
      activeKey="reviews"
      title="Property Reviews"
      description="View tenant feedback captured from booking attendance and manage read status."
      actions={
        <button
          type="button"
          onClick={() => markRead.mutate()}
          disabled={markRead.isPending || unreadCount === 0}
          className="rounded-full bg-[#0f8f8b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
        >
          Mark all as read {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowUnreadOnly(false)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            !showUnreadOnly ? 'bg-[#0f8f8b] text-white' : 'bg-[#edf6f5] text-[#073735]'
          }`}
        >
          All ({Number(data?.items?.length || 0)})
        </button>
        <button
          type="button"
          onClick={() => setShowUnreadOnly(true)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            showUnreadOnly ? 'bg-[#0f8f8b] text-white' : 'bg-[#edf6f5] text-[#073735]'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {isLoading ? <p className="text-sm text-[#073735]/70">Loading reviews...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {!isLoading && !error && items.length === 0 ? (
        <p className="text-sm text-[#073735]/70">No reviews found for this filter.</p>
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 ${
              item.is_read ? 'border-[#e7f4f3] bg-white' : 'border-[#b8e2de] bg-[#f8fffe]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#073735]">
                {item.propertyTitle || `Property #${item.property_id}`}
              </p>
              {!item.is_read ? (
                <span className="rounded-full bg-[#0f8f8b] px-2 py-0.5 text-[11px] font-bold text-white">
                  NEW
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-1">
              {stars(item.rating).map((filled, index) => (
                <Star
                  key={`${item.id}-${index}`}
                  size={14}
                  className={filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                />
              ))}
              <span className="ml-1 text-xs font-semibold text-[#073735]/70">{item.rating}/5</span>
            </div>
            <p className="mt-2 text-sm text-[#073735]/80">{item.comment}</p>
            <p className="mt-2 text-xs text-[#073735]/60">
              {item.user_name || '-'} •{' '}
              {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
            </p>
          </article>
        ))}
      </div>
    </OwnerDashboardShell>
  );
}
