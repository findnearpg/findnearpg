'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

async function updateAvailability(propertyId, availableRooms) {
  const response = await fetch(`/api/owner/properties/${propertyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ availableRooms }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || 'Failed to update availability');
  return json;
}

export default function OwnerAvailabilityPage() {
  const queryClient = useQueryClient();
  const [roomDrafts, setRoomDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingById, setPendingById] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-availability-properties'],
    queryFn: async () => {
      const response = await fetch('/api/owner/properties');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to fetch properties');
      return json;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ propertyId, availableRooms }) => {
      return updateAvailability(propertyId, availableRooms);
    },
    onMutate: ({ propertyId }) => {
      setPendingById((prev) => ({ ...prev, [propertyId]: true }));
    },
    onSuccess: (updated) => {
      toast.success('Availability updated');
      setRoomDrafts((prev) => ({
        ...prev,
        [updated.id]: Number(updated.available_rooms ?? prev[updated.id] ?? 0),
      }));
      queryClient.invalidateQueries({ queryKey: ['owner-availability-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
    },
    onSettled: (_data, _error, variables) => {
      if (!variables?.propertyId) return;
      setPendingById((prev) => ({ ...prev, [variables.propertyId]: false }));
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update availability');
    },
  });

  const saveAllMutation = useMutation({
    mutationFn: async (changes) => {
      for (const row of changes) {
        await updateAvailability(row.propertyId, row.availableRooms);
      }
      return true;
    },
    onSuccess: () => {
      toast.success('All availability changes saved');
      queryClient.invalidateQueries({ queryKey: ['owner-availability-properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to save all changes'),
  });

  useEffect(() => {
    if (!Array.isArray(data)) return;
    setRoomDrafts((prev) => {
      const next = { ...prev };
      for (const property of data) {
        if (next[property.id] === undefined) {
          next[property.id] = Number(property.available_rooms ?? 0);
        }
      }
      return next;
    });
  }, [data]);

  const properties = data || [];
  const viewRows = useMemo(() => {
    const needle = String(searchTerm || '')
      .trim()
      .toLowerCase();
    return properties.filter((property) => {
      const listingStatus = String(property.listing_status || '').toLowerCase();
      const draftRooms = Number(roomDrafts[property.id] ?? property.available_rooms ?? 0);
      if (statusFilter === 'available' && draftRooms <= 0) return false;
      if (statusFilter === 'full' && draftRooms > 0) return false;
      if (statusFilter === 'live' && listingStatus !== 'live') return false;
      if (statusFilter === 'under_review' && listingStatus !== 'under_review') return false;
      if (statusFilter === 'rejected' && listingStatus !== 'rejected') return false;

      if (!needle) return true;
      const haystack = `${property.title} ${property.city} ${property.area}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [properties, roomDrafts, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const totalProperties = properties.length;
    const totalRooms = properties.reduce((sum, property) => {
      const rooms = Number(roomDrafts[property.id] ?? property.available_rooms ?? 0);
      return sum + (Number.isFinite(rooms) ? rooms : 0);
    }, 0);
    const fullCount = properties.filter(
      (property) => Number(roomDrafts[property.id] ?? property.available_rooms ?? 0) <= 0
    ).length;
    const changedCount = properties.filter((property) => {
      const draft = Number(roomDrafts[property.id] ?? property.available_rooms ?? 0);
      const current = Number(property.available_rooms ?? 0);
      return draft !== current;
    }).length;
    return { totalProperties, totalRooms, fullCount, changedCount };
  }, [properties, roomDrafts]);

  return (
    <OwnerDashboardShell
      activeKey="availability"
      title="Update Availability"
      description="Adjust room inventory quickly so search and booking stay accurate."
      actions={
        <button
          type="button"
          disabled={saveAllMutation.isPending || summary.changedCount === 0}
          onClick={() => {
            const changes = properties
              .map((property) => ({
                propertyId: property.id,
                availableRooms: Number(roomDrafts[property.id] ?? property.available_rooms ?? 0),
                current: Number(property.available_rooms ?? 0),
              }))
              .filter((row) => row.availableRooms !== row.current);
            if (changes.length === 0) return;
            saveAllMutation.mutate(changes);
          }}
          className="rounded-full bg-[#073735] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
        >
          {saveAllMutation.isPending ? 'Saving all...' : `Save All (${summary.changedCount})`}
        </button>
      }
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading availability...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <p className="text-xs text-[#073735]/65">Total Listings</p>
            <p className="text-xl font-extrabold text-[#073735]">{summary.totalProperties}</p>
          </div>
          <div className="rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
            <p className="text-xs text-[#073735]/65">Total Available Rooms</p>
            <p className="text-xl font-extrabold text-[#073735]">{summary.totalRooms}</p>
          </div>
          <div className="rounded-2xl border border-[#dcefed] bg-[#fff8f1] p-3">
            <p className="text-xs text-[#8a4b00]/75">Marked Full</p>
            <p className="text-xl font-extrabold text-[#8a4b00]">{summary.fullCount}</p>
          </div>
          <div className="rounded-2xl border border-[#dcefed] bg-[#eef6ff] p-3">
            <p className="text-xs text-[#1d4ed8]/75">Unsaved Changes</p>
            <p className="text-xl font-extrabold text-[#1d4ed8]">{summary.changedCount}</p>
          </div>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="mb-3 rounded-2xl border border-[#dcefed] bg-[#f8fffe] p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, city, area"
              className="w-full rounded-xl border border-[#d8ebea] bg-white px-3 py-2 text-sm text-[#073735]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[#d8ebea] bg-white px-3 py-2 text-sm text-[#073735]"
            >
              <option value="all">All</option>
              <option value="available">Available rooms {'>'} 0</option>
              <option value="full">Marked Full</option>
              <option value="live">Live</option>
              <option value="under_review">Under Review</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      ) : null}

      {!isLoading && !error && data?.length > 0 ? (
        <div className="space-y-3">
          {viewRows.map((property) => {
            const draftRooms = Number(roomDrafts[property.id] ?? property.available_rooms ?? 0);
            const currentRooms = Number(property.available_rooms ?? 0);
            const isChanged = draftRooms !== currentRooms;
            const isPending =
              Boolean(pendingById[property.id]) ||
              updateMutation.isPending ||
              saveAllMutation.isPending;
            const listingStatus = String(property.listing_status || '').toLowerCase();
            return (
              <div
                key={property.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#e7f4f3] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-bold text-[#073735]">{property.title}</h3>
                  <p className="text-sm text-[#073735]/70">
                    {property.area}, {property.city}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-xs font-semibold text-[#1d4ed8]">
                      Current: {currentRooms}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        draftRooms > 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {draftRooms > 0 ? 'Available' : 'Full'}
                    </span>
                    {listingStatus ? (
                      <span className="rounded-full bg-[#f1f9f9] px-2.5 py-1 text-xs font-semibold text-[#0c6764]">
                        {listingStatus.replaceAll('_', ' ')}
                      </span>
                    ) : null}
                    {isChanged ? (
                      <span className="rounded-full bg-[#fff4e6] px-2.5 py-1 text-xs font-semibold text-[#c25800]">
                        Unsaved
                      </span>
                    ) : null}
                  </div>
                </div>

                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const rooms = Number(roomDrafts[property.id] ?? 0);
                    if (!Number.isFinite(rooms) || rooms < 0) {
                      toast.error('Enter a valid room count');
                      return;
                    }
                    updateMutation.mutate({ propertyId: property.id, availableRooms: rooms });
                  }}
                >
                  <button
                    type="button"
                    className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-[#073735] hover:bg-gray-200"
                    disabled={isPending}
                    onClick={() =>
                      setRoomDrafts((prev) => ({
                        ...prev,
                        [property.id]: Math.max(
                          0,
                          Number(prev[property.id] ?? property.available_rooms ?? 0) - 1
                        ),
                      }))
                    }
                  >
                    -1
                  </button>
                  <input
                    name="availableRooms"
                    type="number"
                    min="0"
                    value={roomDrafts[property.id] ?? property.available_rooms ?? 0}
                    onChange={(event) =>
                      setRoomDrafts((prev) => ({
                        ...prev,
                        [property.id]: Math.max(0, Number(event.target.value || 0)),
                      }))
                    }
                    className="w-24 rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-[#073735] hover:bg-gray-200"
                    disabled={isPending}
                    onClick={() =>
                      setRoomDrafts((prev) => ({
                        ...prev,
                        [property.id]: Math.max(
                          0,
                          Number(prev[property.id] ?? property.available_rooms ?? 0) + 1
                        ),
                      }))
                    }
                  >
                    +1
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#0f8f8b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6764]"
                    disabled={isPending || !isChanged}
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-[#073735] hover:bg-gray-200"
                    disabled={isPending}
                    onClick={() => setRoomDrafts((prev) => ({ ...prev, [property.id]: 0 }))}
                  >
                    Mark Full
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[#eef6ff] px-4 py-2 text-xs font-semibold text-[#1d4ed8] hover:bg-[#dbeafe]"
                    disabled={isPending}
                    onClick={() =>
                      setRoomDrafts((prev) => ({
                        ...prev,
                        [property.id]: Number(property.available_rooms ?? 0),
                      }))
                    }
                  >
                    Reset
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !error && data?.length > 0 && viewRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cde7e5] bg-[#f8fffe] p-6 text-center">
          <p className="text-sm text-[#073735]/70">No listings match your filters.</p>
        </div>
      ) : null}
    </OwnerDashboardShell>
  );
}
