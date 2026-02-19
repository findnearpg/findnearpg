'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgePercent, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function discountPercent(price, original) {
  const p = Number(price || 0);
  const o = Number(original || 0);
  if (!o || o <= p) return 0;
  return Math.round(((o - p) / o) * 100);
}

export default function OwnerSubscriptionPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/owner/subscription');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch subscription');
      return json;
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (planCode) => {
      const response = await fetch('/api/owner/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', planCode }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to activate subscription');
      return json;
    },
    onSuccess: () => {
      toast.success('Subscription activated');
      queryClient.invalidateQueries({ queryKey: ['owner-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['owner-analytics'] });
    },
    onError: (error) => toast.error(error.message || 'Failed to activate subscription'),
  });

  const planMap = useMemo(() => {
    const map = new Map();
    for (const item of data?.plans || []) map.set(item.code, item);
    return map;
  }, [data?.plans]);

  return (
    <OwnerDashboardShell
      activeKey="subscription"
      title="Subscription Plans"
      description="After free starter usage, choose a plan based on your property growth target."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading subscription...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <>
          <div className="rounded-2xl border border-[#e7f4f3] bg-[#f8fffe] p-4">
            <p className="text-xs uppercase tracking-wide text-[#073735]/55">Current Plan</p>
            <p className="mt-1 text-lg font-black text-[#073735]">
              {data?.active ? data?.planName || 'Active Plan' : 'Free Starter'}
            </p>
            <p className="mt-1 text-sm text-[#073735]/70">
              Free starter: 1 property and first booking detail unlocked.
            </p>
            <p className="mt-1 text-sm text-[#073735]/70">
              Current usage: {data?.propertyCount ?? 0} properties, {data?.bookingCount ?? 0}{' '}
              bookings
            </p>
            {data?.active && data?.expiresAt ? (
              <p className="mt-1 text-sm font-semibold text-[#0c6764]">
                Active till: {new Date(data.expiresAt).toLocaleDateString()}
              </p>
            ) : (
              <p className="mt-1 text-sm font-semibold text-amber-700">
                You are on free mode. Upgrade to continue after limit.
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {(data?.plans || []).map((plan) => {
              const isCurrent =
                data?.active && String(data?.planCode || '') === String(plan.code || '');
              const discount = discountPercent(plan.priceInr, plan.originalPriceInr);
              return (
                <article
                  key={plan.code}
                  className="relative overflow-hidden rounded-3xl border border-[#d7ebe8] bg-white p-4 shadow-sm"
                >
                  {discount > 0 ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#fff4e5] px-2 py-1 text-[11px] font-bold text-[#b45309]">
                      <BadgePercent size={12} /> Save {discount}%
                    </span>
                  ) : null}

                  <h3 className="text-base font-black text-[#073735]">{plan.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#073735]/60">
                    {plan.durationMonths} month validity
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <p className="text-3xl font-black text-[#0f8f8b]">{money(plan.priceInr)}</p>
                    {Number(plan.originalPriceInr || 0) > Number(plan.priceInr || 0) ? (
                      <p className="pb-1 text-sm font-semibold text-[#073735]/45 line-through">
                        {money(plan.originalPriceInr)}
                      </p>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs font-semibold text-[#073735]">
                    Property limit: {plan.propertyLimit}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-[#073735]/75">
                    <li className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> Full booking details unlock
                    </li>
                    <li className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> Direct-pay booking management tools
                    </li>
                    <li className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> Priority owner support
                    </li>
                  </ul>

                  <button
                    type="button"
                    onClick={() => activateMutation.mutate(plan.code)}
                    disabled={activateMutation.isPending || isCurrent}
                    className={`mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                      isCurrent ? 'bg-[#0c6764]' : 'bg-[#0f8f8b] hover:bg-[#0c6764]'
                    }`}
                  >
                    {isCurrent
                      ? 'Current Plan'
                      : activateMutation.isPending
                        ? 'Activating...'
                        : `Choose ${plan.name}`}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4 text-sm text-[#073735]/80">
            <p className="font-semibold text-[#073735]">Requested pricing model applied</p>
            <p className="mt-1">
              Monthly: ₹199 + 1 property, Quarterly: ₹499 + 2 properties, Yearly: ₹999 + 3
              properties.
            </p>
          </div>
        </>
      ) : null}
    </OwnerDashboardShell>
  );
}
