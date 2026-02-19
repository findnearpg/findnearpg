'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const adminNavItems = [
  { key: 'overview', href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  {
    key: 'approvals',
    href: '/dashboard/admin/approvals',
    label: 'Approvals',
    icon: ClipboardCheck,
  },
  {
    key: 'owner-verifications',
    href: '/dashboard/admin/owner-verifications',
    label: 'Owner Verifications',
    icon: ShieldCheck,
  },
  { key: 'owners', href: '/dashboard/admin/owners', label: 'Owners', icon: UserRound },
  { key: 'users', href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { key: 'reports', href: '/dashboard/admin/reports', label: 'Reports', icon: BarChart3 },
  {
    key: 'settlements',
    href: '/dashboard/admin/settlements',
    label: 'Settlements',
    icon: CreditCard,
  },
  {
    key: 'transactions',
    href: '/dashboard/admin/transactions',
    label: 'Transactions',
    icon: FileDown,
  },
  { key: 'risk', href: '/dashboard/admin/risk', label: 'Risk Monitor', icon: AlertTriangle },
];
const adminMobileNavKeys = [
  'overview',
  'approvals',
  'owner-verifications',
  'users',
  'reports',
  'risk',
];
const adminMobileShortLabels = {
  overview: 'Overview',
  approvals: 'Approvals',
  'owner-verifications': 'Verifications',
  users: 'Users',
  reports: 'Reports',
  risk: 'Risk',
};

function NavLink({ item, activeKey }) {
  const Icon = item.icon;
  const isActive = activeKey === item.key;
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
    </a>
  );
}

export default function AdminDashboardShell({
  title,
  description,
  activeKey = 'overview',
  actions,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ['admin-dashboard-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session?scope=admin');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch session');
      return json;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/admin/signout', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to logout');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Logged out');
      window.location.href = '/admin';
    },
    onError: () => {
      toast.error('Failed to logout');
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (!session?.authenticated || session?.role !== 'admin') {
      window.location.replace('/admin');
    }
  }, [isLoading, session]);
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  if (isLoading || !session?.authenticated || session?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#f1f9f9] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-[#d3eeec] bg-white p-8">
          <h2 className="text-xl font-bold text-[#073735]">Redirecting to admin login...</h2>
          <p className="mt-2 text-sm text-[#073735]/70">Please wait.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f1f9f9] to-white">
      <header className="border-b border-[#d3eeec] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="/dashboard/admin" className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f8f8b] text-white">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black tracking-tight text-[#073735]">
                FindNearPG Admin
              </p>
              <p className="truncate text-xs font-medium text-[#073735]/60">Control Center</p>
            </div>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <p className="hidden text-right sm:block">
              <span className="block text-sm font-bold text-[#073735]">
                {session?.name || 'Admin'}
              </span>
              <span className="block text-[11px] font-medium text-[#073735]/55">
                {session?.email || 'control@admin'}
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
              aria-label="Toggle admin menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-2 rounded-3xl border border-[#d3eeec] bg-white p-4">
              {adminNavItems.map((item) => (
                <NavLink key={item.key} item={item} activeKey={activeKey} />
              ))}
            </div>
          </aside>

          <main>
            <section className="rounded-3xl border border-[#d3eeec] bg-white p-5 sm:p-7">
              <div className="mb-6 flex flex-col gap-3 border-b border-[#e7f4f3] pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#073735] sm:text-3xl">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 text-sm text-[#073735]/70">{description}</p>
                  ) : null}
                </div>
                {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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
              {adminNavItems
                .filter((item) => adminMobileNavKeys.includes(item.key))
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeKey === item.key;
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
                        {adminMobileShortLabels[item.key] || item.label}
                      </span>
                      <ChevronRight
                        size={15}
                        className={isActive ? 'text-white/90' : 'text-[#073735]/45'}
                      />
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
