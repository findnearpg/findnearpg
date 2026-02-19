'use client';

import AdminDashboardShell from '@/components/AdminDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

function statusBadge(property) {
  const status = String(property?.listing_status || '').toLowerCase();
  if (status === 'rejected') {
    return 'bg-red-50 text-red-700 border border-red-200';
  }
  const live =
    String(property?.listing_status || '').toLowerCase() === 'live' ||
    Boolean(property?.is_approved);
  return live
    ? 'bg-green-50 text-green-700 border border-green-200'
    : 'bg-amber-50 text-amber-700 border border-amber-200';
}

function normalizeText(value) {
  if (Array.isArray(value)) return value.join(', ');
  return String(value || '').trim();
}

function previewText(value, limit = 160) {
  const text = normalizeText(value);
  if (!text) return '-';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('pending');
  const [expandedDescriptionIds, setExpandedDescriptionIds] = useState({});
  const [expandedAmenitiesIds, setExpandedAmenitiesIds] = useState({});
  const [rejectReasonById, setRejectReasonById] = useState({});
  const [pendingAction, setPendingAction] = useState({ id: null, action: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => {
      const response = await fetch('/api/admin/properties');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch properties');
      return json;
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason = '' }) => {
      const response = await fetch('/api/admin/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, rejectionReason }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update status');
      return json;
    },
    onMutate: ({ id, action }) => {
      setPendingAction({ id, action });
    },
    onSuccess: (_, variables) => {
      const action = String(variables?.action || '');
      const message =
        action === 'reject'
          ? 'Property rejected and moved to rejected section'
          : action === 'approve'
            ? 'Property approved successfully'
            : 'Property moved to review';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-dashboard'] });
      setRejectReasonById({});
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update status');
    },
    onSettled: () => {
      setPendingAction({ id: null, action: '' });
    },
  });

  const properties = data || [];
  const pendingProperties = properties.filter((property) => {
    const status = String(property?.listing_status || '').toLowerCase();
    const isLive = status === 'live' || Boolean(property?.is_approved);
    return !isLive && status !== 'rejected';
  });
  const approvedProperties = properties.filter((property) => {
    const isLive =
      String(property?.listing_status || '').toLowerCase() === 'live' ||
      Boolean(property?.is_approved);
    return isLive;
  });
  const rejectedProperties = properties.filter(
    (property) => String(property?.listing_status || '').toLowerCase() === 'rejected'
  );
  const visibleProperties =
    activeSection === 'approved'
      ? approvedProperties
      : activeSection === 'rejected'
        ? rejectedProperties
        : pendingProperties;
  const visibleCount = visibleProperties.length;

  const renderPropertyCard = (property) => (
    <article key={property.id} className="rounded-2xl border border-[#dcefed] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#073735]">{property.title}</h3>
          <p className="text-sm text-[#073735]/70 break-words">
            {property.area}, {property.city} • Rs.{' '}
            {Number(property.price || 0).toLocaleString('en-IN')} / month
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(property)}`}
            >
              {String(property?.listing_status || '').toLowerCase() === 'rejected'
                ? 'Rejected'
                : String(property?.listing_status || '').toLowerCase() === 'live' ||
                    property?.is_approved
                  ? 'Approved / Live'
                  : 'Under Review'}
            </span>
            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
              Sharing: {property.sharing === 'all123' ? '1/2/3' : property.sharing || 'NA'}
            </span>
            <span className="rounded-full bg-[#f1f9f9] px-3 py-1 text-xs font-semibold text-[#0c6764]">
              Rooms: {property.available_rooms ?? 0}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeSection === 'approved' ? (
            <button
              type="button"
              onClick={() => approvalMutation.mutate({ id: property.id, action: 'review' })}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
              disabled={approvalMutation.isPending}
            >
              {pendingAction.id === property.id && pendingAction.action === 'review'
                ? 'Updating...'
                : 'Move to Review'}
            </button>
          ) : null}
          {activeSection === 'rejected' ? (
            <button
              type="button"
              onClick={() => approvalMutation.mutate({ id: property.id, action: 'review' })}
              className="rounded-full bg-[#0f8f8b] px-4 py-2 text-sm font-semibold text-white"
              disabled={approvalMutation.isPending}
            >
              {pendingAction.id === property.id && pendingAction.action === 'review'
                ? 'Updating...'
                : 'Reopen Review'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">
            Description
          </p>
          <p className="mt-1 text-sm text-[#073735]/75 break-all">
            {expandedDescriptionIds[property.id]
              ? normalizeText(property.description)
              : previewText(property.description, 180)}
          </p>
          {normalizeText(property.description).length > 180 ? (
            <button
              type="button"
              onClick={() =>
                setExpandedDescriptionIds((prev) => ({
                  ...prev,
                  [property.id]: !prev[property.id],
                }))
              }
              className="mt-2 text-xs font-semibold text-[#0f8f8b] hover:text-[#0c6764]"
            >
              {expandedDescriptionIds[property.id] ? 'Show less' : 'Show more'}
            </button>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">
            Amenities
          </p>
          <p className="mt-1 text-sm text-[#073735]/75 break-all">
            {expandedAmenitiesIds[property.id]
              ? normalizeText(property.amenities)
              : previewText(property.amenities, 120)}
          </p>
          {normalizeText(property.amenities).length > 120 ? (
            <button
              type="button"
              onClick={() =>
                setExpandedAmenitiesIds((prev) => ({
                  ...prev,
                  [property.id]: !prev[property.id],
                }))
              }
              className="mt-2 text-xs font-semibold text-[#0f8f8b] hover:text-[#0c6764]"
            >
              {expandedAmenitiesIds[property.id] ? 'Show less' : 'Show more'}
            </button>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">
            License Verification
          </p>
          <p className="mt-1 text-sm text-[#073735]/75">
            License No: {property.property_license_number || '-'}
          </p>
          {property.property_license_document_url ? (
            <a
              href={property.property_license_document_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-[#0f8f8b] underline"
            >
              View uploaded license document
            </a>
          ) : (
            <p className="mt-1 text-xs text-[#073735]/55">No license document uploaded</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">
          Property Images
        </p>
        {Array.isArray(property.images) && property.images.length > 0 ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {property.images.slice(0, 8).map((image, index) => (
              <a key={`${property.id}-${index}`} href={image} target="_blank" rel="noreferrer">
                <img
                  src={image}
                  alt={`${property.title}-${index + 1}`}
                  className="h-24 w-full rounded-xl border border-[#e7f4f3] object-cover"
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#073735]/60">No images uploaded.</p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#e7f4f3] bg-[#f8fffe] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#073735]/55">
          Admin Action
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          {activeSection !== 'approved' ? (
            <button
              type="button"
              onClick={() => approvalMutation.mutate({ id: property.id, action: 'approve' })}
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={approvalMutation.isPending}
            >
              {pendingAction.id === property.id && pendingAction.action === 'approve'
                ? 'Approving...'
                : 'Approve'}
            </button>
          ) : null}
          {activeSection !== 'rejected' ? (
            <>
              <input
                type="text"
                placeholder="Reject reason (required)"
                value={rejectReasonById[property.id] || ''}
                onChange={(event) =>
                  setRejectReasonById((prev) => ({
                    ...prev,
                    [property.id]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#d6ebe8] bg-white px-3 py-2 text-sm text-[#073735] sm:max-w-sm"
              />
              <button
                type="button"
                onClick={() =>
                  approvalMutation.mutate({
                    id: property.id,
                    action: 'reject',
                    rejectionReason: rejectReasonById[property.id] || '',
                  })
                }
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                disabled={approvalMutation.isPending}
              >
                {pendingAction.id === property.id && pendingAction.action === 'reject'
                  ? 'Rejecting...'
                  : 'Reject'}
              </button>
            </>
          ) : null}
        </div>
        {String(property?.listing_status || '').toLowerCase() === 'rejected' &&
        property?.rejection_reason ? (
          <p className="mt-2 text-xs font-semibold text-red-700">
            Current reason: {property.rejection_reason}
          </p>
        ) : null}
      </div>
    </article>
  );

  return (
    <AdminDashboardShell
      activeKey="approvals"
      title="Listing Approvals"
      description="Review full property details, inspect images, and approve or keep listings under review."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading properties...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Pending
              </p>
              <p className="mt-1 text-2xl font-black text-amber-700">{pendingProperties.length}</p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Approved / Live
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700">
                {approvedProperties.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[#dcefed] bg-white p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
                Rejected
              </p>
              <p className="mt-1 text-2xl font-black text-rose-700">{rejectedProperties.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('pending')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeSection === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                Pending Review ({pendingProperties.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('approved')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeSection === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                Approved / Live ({approvedProperties.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('rejected')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeSection === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
                }`}
              >
                Rejected ({rejectedProperties.length})
              </button>
            </div>
          </div>

          <section className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#073735]">
                {activeSection === 'approved'
                  ? 'Approved / Live Listings'
                  : activeSection === 'rejected'
                    ? 'Rejected Listings'
                    : 'Pending Review Listings'}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeSection === 'approved'
                    ? 'bg-green-50 text-green-700'
                    : activeSection === 'rejected'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                }`}
              >
                {visibleCount}
              </span>
            </div>
            {visibleCount === 0 ? (
              <p className="text-sm text-[#073735]/70">
                {activeSection === 'approved'
                  ? 'No approved listings yet.'
                  : activeSection === 'rejected'
                    ? 'No rejected listings.'
                    : 'No pending listings.'}
              </p>
            ) : (
              <div className="space-y-4">
                {visibleProperties.map((property) => renderPropertyCard(property))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </AdminDashboardShell>
  );
}
