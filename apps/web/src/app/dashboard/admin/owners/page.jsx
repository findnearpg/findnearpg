'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminOwnersPage() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState({ ownerId: null, action: '' });
  const [editingOwner, setEditingOwner] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
    mutationFn: async ({ ownerId, action, payload = {} }) => {
      if (action === 'delete') {
        const response = await fetch('/api/admin/owners', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ownerId }),
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || 'Failed to delete owner');
        return json;
      }

      const response = await fetch('/api/admin/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId, action, ...payload }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update owner');
      return json;
    },
    onMutate: ({ ownerId, action }) => setPendingAction({ ownerId, action }),
    onSuccess: (_, variables) => {
      const action = variables?.action;
      toast.success(
        action === 'delete'
          ? 'Owner deleted'
          : action === 'block'
            ? 'Owner blocked'
            : action === 'unblock'
              ? 'Owner unblocked'
              : action === 'verify'
                ? 'Owner verification approved'
                : action === 'reject-verification'
                  ? 'Owner verification rejected'
                  : 'Owner updated'
      );
      if (action === 'edit') {
        setEditingOwner(null);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
    onSettled: () => setPendingAction({ ownerId: null, action: '' }),
  });

  const migrateOwnersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/owners/migrate', { method: 'POST' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to migrate owners');
      return json;
    },
    onSuccess: (result) => {
      toast.success(
        `Migration done: ${result.migrated} new, ${result.updated} updated, ${result.skipped} skipped.`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-owners'] });
    },
    onError: (err) => toast.error(err.message || 'Owner migration failed'),
  });

  const handleEditOpen = (owner) => {
    setEditingOwner(owner);
    setEditForm({
      name: owner.name || '',
      email: owner.email || '',
      mobile: owner.mobile || '',
    });
  };

  const handleEditSave = () => {
    if (!editingOwner) return;
    const name = String(editForm.name || '').trim();
    const email = String(editForm.email || '')
      .trim()
      .toLowerCase();
    const mobile = String(editForm.mobile || '').trim();

    if (!name || !email || !mobile) {
      toast.error('Name, email and mobile are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email');
      return;
    }

    if (!/^[0-9]{10,15}$/.test(mobile)) {
      toast.error('Enter a valid mobile number');
      return;
    }

    actionMutation.mutate({
      ownerId: editingOwner.id,
      action: 'edit',
      payload: {
        name,
        email,
        mobile,
      },
    });
  };

  const handleBlockToggle = (owner) => {
    actionMutation.mutate({
      ownerId: owner.id,
      action: owner.isBlocked ? 'unblock' : 'block',
    });
  };

  const handleDelete = (owner) => {
    const confirmed = window.confirm(
      `Delete owner "${owner.name}"? This works only when owner has no properties/bookings.`
    );
    if (!confirmed) return;
    actionMutation.mutate({ ownerId: owner.id, action: 'delete' });
  };

  const handleVerifyOwner = (owner) => {
    actionMutation.mutate({ ownerId: owner.id, action: 'verify' });
  };

  const handleRejectVerification = (owner) => {
    const reason = window.prompt('Enter rejection reason for owner verification:');
    if (!reason || reason.trim().length < 5) {
      toast.error('Rejection reason must be at least 5 characters');
      return;
    }
    actionMutation.mutate({
      ownerId: owner.id,
      action: 'reject-verification',
      payload: { reason: reason.trim() },
    });
  };

  const owners = data || [];
  const totalOwners = owners.length;
  const blockedOwners = owners.filter((owner) => owner.isBlocked).length;
  const verifiedOwners = owners.filter(
    (owner) => String(owner.verificationStatus || '').toLowerCase() === 'approved'
  ).length;
  const pendingOwners = owners.filter(
    (owner) => String(owner.verificationStatus || '').toLowerCase() === 'pending'
  ).length;
  const normalizedSearch = String(searchTerm || '')
    .trim()
    .toLowerCase();
  const filteredOwners = owners.filter((owner) => {
    if (statusFilter === 'active' && owner.isBlocked) return false;
    if (statusFilter === 'blocked' && !owner.isBlocked) return false;

    if (!normalizedSearch) return true;

    const ownerId = String(owner.id || '').toLowerCase();
    const name = String(owner.name || '').toLowerCase();
    const email = String(owner.email || '').toLowerCase();
    const mobile = String(owner.mobile || '').toLowerCase();
    const status = owner.isBlocked ? 'blocked' : 'active';
    const verificationStatus = String(owner.verificationStatus || '').toLowerCase();
    return (
      ownerId.includes(normalizedSearch) ||
      name.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      mobile.includes(normalizedSearch) ||
      verificationStatus.includes(normalizedSearch) ||
      status.includes(normalizedSearch)
    );
  });

  return (
    <AdminDashboardShell
      activeKey="owners"
      title="Owner Details"
      description="Review owner profiles, contact details, and activity summary."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading owners...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {!isLoading && !error ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Total Owners
              </p>
              <p className="mt-1 text-2xl font-black text-[#073735]">{totalOwners}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Verified KYC
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{verifiedOwners}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Pending KYC
              </p>
              <p className="mt-1 text-2xl font-black text-amber-700">{pendingOwners}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Blocked Owners
              </p>
              <p className="mt-1 text-2xl font-black text-rose-700">{blockedOwners}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by ID, name, email, mobile, status"
                className="w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="rounded-xl bg-[#e8f7f5] px-4 py-2 text-sm font-semibold text-[#0c6764] hover:bg-[#d3eeec]"
              >
                Clear
              </button>
            </div>
            <p className="mt-2 text-xs text-[#073735]/65">
              Showing {filteredOwners.length} of {owners.length} owners
            </p>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => migrateOwnersMutation.mutate()}
                disabled={migrateOwnersMutation.isPending}
                className="rounded-xl bg-[#073735] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
              >
                {migrateOwnersMutation.isPending ? 'Migrating...' : 'Migrate Legacy Owners'}
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredOwners.map((owner) => (
              <article key={owner.id} className="rounded-2xl border border-[#dcefed] bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-[#073735]">
                      #{owner.id} • {owner.name}
                    </p>
                    <p className="text-xs text-[#073735]/70 break-all">{owner.email}</p>
                    <p className="text-xs text-[#073735]/70">{owner.mobile}</p>
                    <p className="mt-1 text-xs font-semibold text-[#0c6764]">
                      KYC: {String(owner.verificationStatus || 'not_submitted').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${owner.isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                  >
                    {owner.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#073735]/70">
                  Properties: {owner.properties} • Bookings: {owner.bookings}
                </p>
                {owner.govtIdUrl ? (
                  <a
                    href={owner.govtIdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-[#0f8f8b] underline"
                  >
                    View Govt ID Document
                  </a>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditOpen(owner)}
                    disabled={actionMutation.isPending}
                    className="rounded-full bg-[#e8f7f5] px-3 py-1.5 text-xs font-semibold text-[#0c6764] disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBlockToggle(owner)}
                    disabled={actionMutation.isPending}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${
                      owner.isBlocked ? 'bg-[#0f8f8b]' : 'bg-amber-500'
                    }`}
                  >
                    {pendingAction.ownerId === owner.id &&
                    (pendingAction.action === 'block' || pendingAction.action === 'unblock')
                      ? 'Updating...'
                      : owner.isBlocked
                        ? 'Unblock'
                        : 'Block'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(owner)}
                    disabled={actionMutation.isPending}
                    className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {pendingAction.ownerId === owner.id && pendingAction.action === 'delete'
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyOwner(owner)}
                    disabled={actionMutation.isPending}
                    className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectVerification(owner)}
                    disabled={actionMutation.isPending}
                    className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Reject KYC
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-[#dcefed] lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f8fffe] text-xs uppercase tracking-wide text-[#073735]/60">
                <tr>
                  <th className="px-3 py-2">Owner ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">KYC</th>
                  <th className="px-3 py-2">Properties</th>
                  <th className="px-3 py-2">Bookings</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOwners.map((owner) => (
                  <tr key={owner.id} className="border-t border-[#eef7f6]">
                    <td className="px-3 py-2 font-semibold text-[#073735]">#{owner.id}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{owner.name}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{owner.email}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{owner.mobile}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          owner.isBlocked ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {owner.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[#073735]/80">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">
                          {String(owner.verificationStatus || 'not_submitted').replace(/_/g, ' ')}
                        </p>
                        {owner.govtIdType ? (
                          <p className="text-[11px]">{owner.govtIdType}</p>
                        ) : null}
                        {owner.govtIdUrl ? (
                          <a
                            href={owner.govtIdUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-[#0f8f8b] underline"
                          >
                            View document
                          </a>
                        ) : (
                          <p className="text-[11px] text-[#073735]/55">No document</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[#073735]/80">{owner.properties}</td>
                    <td className="px-3 py-2 text-[#073735]/80">{owner.bookings}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditOpen(owner)}
                          disabled={actionMutation.isPending}
                          className="rounded-full bg-[#e8f7f5] px-3 py-1 text-xs font-semibold text-[#0c6764] hover:bg-[#d3eeec] disabled:opacity-60"
                        >
                          {pendingAction.ownerId === owner.id && pendingAction.action === 'edit'
                            ? 'Editing...'
                            : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBlockToggle(owner)}
                          disabled={actionMutation.isPending}
                          className={`rounded-full px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 ${
                            owner.isBlocked
                              ? 'bg-[#0f8f8b] hover:bg-[#0c6764]'
                              : 'bg-amber-500 hover:bg-amber-600'
                          }`}
                        >
                          {pendingAction.ownerId === owner.id &&
                          (pendingAction.action === 'block' || pendingAction.action === 'unblock')
                            ? 'Updating...'
                            : owner.isBlocked
                              ? 'Unblock'
                              : 'Block'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(owner)}
                          disabled={actionMutation.isPending}
                          className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {pendingAction.ownerId === owner.id && pendingAction.action === 'delete'
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyOwner(owner)}
                          disabled={actionMutation.isPending}
                          className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          Verify KYC
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectVerification(owner)}
                          disabled={actionMutation.isPending}
                          className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                        >
                          Reject KYC
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOwners.length === 0 ? (
            <div className="rounded-2xl border border-[#dcefed] bg-white p-4">
              <p className="text-sm text-[#073735]/70">No owners match your search.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {editingOwner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#dcefed] bg-white p-5 shadow-xl">
            <h3 className="text-lg font-extrabold text-[#073735]">Edit Owner</h3>
            <p className="mt-1 text-xs text-[#073735]/60">Owner #{editingOwner.id}</p>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className="w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              />
              <input
                type="text"
                value={editForm.mobile}
                onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                placeholder="Mobile"
                className="w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735]"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOwner(null)}
                className="rounded-full bg-[#ecf5f4] px-4 py-2 text-sm font-semibold text-[#073735]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={actionMutation.isPending}
                className="rounded-full bg-[#0f8f8b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {actionMutation.isPending && pendingAction.action === 'edit' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
