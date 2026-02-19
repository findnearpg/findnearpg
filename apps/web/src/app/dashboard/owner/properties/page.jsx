'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerPropertiesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-properties'],
    queryFn: async () => {
      const response = await fetch('/api/owner/properties');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load properties');
      return json;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (propertyId) => {
      const response = await fetch(`/api/owner/properties/${propertyId}`, {
        method: 'DELETE',
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to delete property');
      return json;
    },
    onSuccess: () => {
      toast.success('Property deleted');
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete property');
    },
  });

  const handleDeleteProperty = (property) => {
    const confirmed = window.confirm(`Delete \"${property.title}\"? This cannot be undone.`);
    if (!confirmed) return;
    deleteMutation.mutate(property.id);
  };

  return (
    <OwnerDashboardShell
      activeKey="properties"
      title="Owner Dashboard"
      description="Manage PG listings, room inventory, and listing status in one place."
      actions={
        <a
          href="/dashboard/owner/properties/new"
          className="rounded-full bg-[#0f8f8b] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0c6764]"
        >
          Add Property
        </a>
      }
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading properties...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}
      {!isLoading && !error && data?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cde7e5] bg-[#f8fffe] p-6 text-center">
          <p className="text-sm text-[#073735]/70">
            No properties added yet. Start by adding your first PG listing.
          </p>
        </div>
      ) : null}

      {!isLoading && !error && data?.length > 0 ? (
        <div className="space-y-3">
          {data.map((property) => {
            const listingStatus = String(property.listing_status || '').toLowerCase();
            const isRejected = listingStatus === 'rejected';
            const isLive = listingStatus === 'live' || Boolean(property.is_approved);
            const statusLabel = isRejected
              ? 'Rejected'
              : isLive
                ? 'Approved / Live'
                : 'Pending Approval';
            const statusClass = isRejected
              ? 'bg-red-50 text-red-700'
              : isLive
                ? 'bg-green-50 text-green-700'
                : 'bg-amber-50 text-amber-700';
            return (
              <article
                key={property.id}
                className="rounded-2xl border border-[#e7f4f3] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#073735]">{property.title}</h3>
                    <p className="mt-1 text-sm text-[#073735]/70">
                      {property.area}, {property.city}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#073735]">
                      ₹{Number(property.price).toLocaleString()} / month
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f1f9f9] px-3 py-1 text-xs font-semibold text-[#0c6764]">
                        Rooms: {property.available_rooms}
                      </span>
                      <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                        Sharing:{' '}
                        {property.sharing === 'all123' ? '1/2/3' : property.sharing || 'NA'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {isRejected && property.rejection_reason ? (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        Rejection reason: {property.rejection_reason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/dashboard/owner/properties/edit/${property.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f5] px-4 py-2 text-xs font-semibold text-[#0c6764] hover:bg-[#d3eeec]"
                    >
                      <PencilLine size={14} />
                      Edit Property
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteProperty(property)}
                      className="inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </OwnerDashboardShell>
  );
}
