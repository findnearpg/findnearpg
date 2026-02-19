'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch users');
      return json;
    },
  });
  const users = data || [];
  const filteredUsers = useMemo(() => {
    const q = String(search || '')
      .trim()
      .toLowerCase();
    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'all' || String(user.role || '').toLowerCase() === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return [user.id, user.name, user.email, user.phone, user.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [users, search, roleFilter]);

  const totalUsers = users.length;
  const totalBookings = users.reduce((sum, item) => sum + Number(item.bookings || 0), 0);
  const activeUsers = users.filter((item) => Number(item.bookings || 0) > 0).length;

  return (
    <AdminDashboardShell
      activeKey="users"
      title="User Details"
      description="Review tenant/user profiles and their booking activity."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading users...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {!isLoading && !error ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Total Users
              </p>
              <p className="mt-1 text-2xl font-black text-[#073735]">{totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Active Bookers
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{activeUsers}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Total Bookings
              </p>
              <p className="mt-1 text-2xl font-black text-[#073735]">{totalBookings}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#073735]/50"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search user by ID, name, email, phone"
                  className="w-full rounded-xl border border-[#d6ebe8] bg-white py-2 pl-8 pr-3 text-sm text-[#073735]"
                />
              </label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              >
                <option value="all">All roles</option>
                <option value="user">User</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                }}
                className="rounded-xl bg-[#e8f7f5] px-4 py-2 text-sm font-semibold text-[#0c6764] hover:bg-[#d3eeec]"
              >
                Clear
              </button>
            </div>
            <p className="mt-2 text-xs text-[#073735]/65">
              Showing {filteredUsers.length} of {totalUsers} users
            </p>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredUsers.map((user) => (
              <article key={user.id} className="rounded-2xl border border-[#dcefed] bg-white p-4">
                <p className="text-sm font-extrabold text-[#073735]">
                  #{user.id} • {user.name || '-'}
                </p>
                <p className="mt-1 text-xs text-[#073735]/75 break-all">{user.email || '-'}</p>
                <p className="mt-1 text-xs text-[#073735]/75">Phone: {user.phone || '-'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#ecf5f4] px-2 py-1 text-[11px] font-semibold text-[#0c6764] capitalize">
                    {user.role || '-'}
                  </span>
                  <span className="rounded-full bg-[#eef6ff] px-2 py-1 text-[11px] font-semibold text-[#1d4ed8]">
                    Bookings: {Number(user.bookings || 0)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-[#dcefed] lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8fffe] text-xs uppercase tracking-wide text-[#073735]/60">
                <tr>
                  <th className="px-3 py-2">User ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-[#eef7f6]">
                    <td className="px-3 py-2 font-semibold text-[#073735]">#{user.id}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{user.name}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{user.email}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{user.phone}</td>
                    <td className="px-3 py-2 text-[#073735]/80 capitalize">{user.role}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{user.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-[#dcefed] bg-white p-4 text-sm text-[#073735]/70">
              No users match this filter.
            </div>
          ) : null}
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
