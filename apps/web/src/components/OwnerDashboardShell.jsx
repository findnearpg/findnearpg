'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  CreditCard,
  DoorOpen,
  Home,
  LogOut,
  Menu,
  Plus,
  Star,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ownerNavItems = [
  {
    key: 'overview',
    href: '/dashboard/owner/overview',
    label: 'Overview',
    icon: Home,
  },
  {
    key: 'properties',
    href: '/dashboard/owner/properties',
    label: 'My Properties',
    icon: Building2,
  },
  {
    key: 'add-property',
    href: '/dashboard/owner/properties/new',
    label: 'Add PG Property',
    icon: Plus,
  },
  {
    key: 'bookings',
    href: '/dashboard/owner/bookings',
    label: 'View Bookings',
    icon: CalendarDays,
  },
  {
    key: 'availability',
    href: '/dashboard/owner/availability',
    label: 'Availability',
    icon: DoorOpen,
  },
  {
    key: 'analytics',
    href: '/dashboard/owner/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    key: 'notifications',
    href: '/dashboard/owner/notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    key: 'subscription',
    href: '/dashboard/owner/subscription',
    label: 'Subscription',
    icon: CreditCard,
  },
  {
    key: 'reviews',
    href: '/dashboard/owner/reviews',
    label: 'Reviews',
    icon: Star,
  },
  {
    key: 'account',
    href: '/dashboard/owner/account',
    label: 'Account Settings',
    icon: CircleUserRound,
  },
  {
    key: 'help',
    href: '/dashboard/owner/help',
    label: 'Help',
    icon: CircleHelp,
  },
];
const ownerMobileNavKeys = [
  'overview',
  'properties',
  'add-property',
  'bookings',
  'notifications',
  'account',
];
const ownerMobileShortLabels = {
  overview: 'Overview',
  properties: 'Properties',
  'add-property': 'Add Property',
  bookings: 'Bookings',
  notifications: 'Alerts',
  account: 'Account',
};

function NavLink({ item, activeKey, badgeCount = 0 }) {
  const Icon = item.icon;
  const isActive = activeKey === item.key;
  const shouldShowBadge = item.key === 'notifications' && badgeCount > 0;

  return (
    <a
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
        isActive
          ? 'bg-[#0f8f8b] text-white shadow-lg shadow-[#0f8f8b]/20'
          : 'text-[#073735] hover:bg-[#d3eeec]'
      }`}
    >
      <Icon size={18} />
      <span>{item.label}</span>
      {shouldShowBadge ? (
        <span
          className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
            isActive ? 'bg-white text-[#0f8f8b]' : 'bg-[#0f8f8b] text-white'
          }`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </a>
  );
}

export default function OwnerDashboardShell({ title, description, activeKey, actions, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, isLoading } = useQuery({
    queryKey: ['owner-dashboard-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch session');
      return json;
    },
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ['owner-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/owner/notifications');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch notifications');
      return json;
    },
    enabled: Boolean(session?.authenticated && session?.role === 'owner'),
    refetchInterval: 20_000,
  });
  const unreadNotificationsCount = (notifications || []).filter((item) => !item.is_read).length;
  const { data: ownerAccount } = useQuery({
    queryKey: ['owner-account-mini'],
    queryFn: async () => {
      const response = await fetch('/api/owner/account');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch account');
      return json;
    },
    enabled: Boolean(session?.authenticated && session?.role === 'owner'),
  });
  const ownerVerified = String(ownerAccount?.verificationStatus || '').toLowerCase() === 'approved';

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/dev-session', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to logout');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Logged out');
      window.location.href = '/account/owner/signin';
    },
    onError: () => {
      toast.error('Failed to logout');
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (!session?.authenticated || session?.role !== 'owner') {
      window.location.replace('/account/owner/signin');
    }
  }, [isLoading, session]);
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  if (isLoading || !session?.authenticated || session?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-[#f1f9f9] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#d3eeec] bg-white p-8">
          <h2 className="text-xl font-bold text-[#073735]">Redirecting to owner sign in...</h2>
          <p className="mt-2 text-sm text-[#073735]/70">Please wait.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f1f9f9] to-white">
      <header className="border-b border-[#d3eeec] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6 sm:py-4">
          <a href="/dashboard/owner/overview" className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f8f8b] text-white">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight text-[#073735] sm:text-lg">
                FindNearPG Owner
              </p>
              <p className="truncate text-xs font-medium text-[#073735]/60">
                Professional Dashboard
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden text-right sm:block">
              <span className="block text-sm font-bold text-[#073735]">
                {session?.name || 'Owner'}
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#e8f7f5] px-2 py-0.5 text-[11px] font-semibold text-[#0c6764]">
                {ownerVerified ? <BadgeCheck size={12} /> : null}
                {ownerVerified ? 'Verified Owner' : 'KYC Pending'}
              </span>
            </p>

            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="hidden items-center gap-2 rounded-full bg-[#073735] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c6764] disabled:opacity-60 md:inline-flex md:px-4"
            >
              <LogOut size={16} />
              <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d3eeec] text-[#073735] md:hidden"
              aria-label="Toggle owner menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-2 rounded-3xl border border-[#d3eeec] bg-white p-4">
              {ownerNavItems.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  activeKey={activeKey}
                  badgeCount={item.key === 'notifications' ? unreadNotificationsCount : 0}
                />
              ))}
            </div>
          </aside>

          <main>
            <section className="rounded-3xl border border-[#d3eeec] bg-white p-4 sm:p-7">
              <div className="mb-6 flex flex-col gap-3 border-b border-[#e7f4f3] pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-[#073735] sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 text-sm text-[#073735]/70">{description}</p>
                  ) : null}
                </div>
                {actions ? (
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div>
                ) : null}
              </div>
              {children}
            </section>
          </main>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[70] bg-[#073735]/20 px-3 pb-3 pt-20 md:hidden transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onMouseDown={() => setMobileMenuOpen(false)}
      >
        <div
          className={`mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#d9ecea] bg-white shadow-2xl transition-all duration-300 ${
            mobileMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-2 scale-[0.98]'
          }`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="max-h-[78vh] overflow-y-auto p-4">
            <div className="space-y-2">
              {ownerNavItems
                .filter((item) => ownerMobileNavKeys.includes(item.key))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeKey === item.key;
                  const shouldShowBadge =
                    item.key === 'notifications' && unreadNotificationsCount > 0;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-semibold ${
                        isActive
                          ? 'border-[#0f8f8b] bg-[#0f8f8b] text-white'
                          : 'border-[#deeeec] bg-white text-[#073735]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon size={16} />
                        {ownerMobileShortLabels[item.key] || item.label}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        {shouldShowBadge ? (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              isActive ? 'bg-white text-[#0f8f8b]' : 'bg-[#0f8f8b] text-white'
                            }`}
                          >
                            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                          </span>
                        ) : null}
                        <ChevronRight
                          size={15}
                          className={isActive ? 'text-white/90' : 'text-[#073735]/45'}
                        />
                      </span>
                    </a>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 disabled:opacity-60"
            >
              <LogOut size={16} />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
