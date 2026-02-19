'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Camera,
  CirclePlus,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

const amenityOptions = [
  { key: 'wifi', label: 'WiFi', icon: Wifi },
  { key: 'cctv', label: 'CCTV', icon: Camera },
  { key: 'power-backup', label: 'Power Backup', icon: Zap },
  { key: 'laundry', label: 'Laundry', icon: WashingMachine },
  { key: 'food', label: 'Food', icon: UtensilsCrossed },
  { key: 'security', label: 'Security', icon: ShieldCheck },
];

const initialForm = {
  title: '',
  city: '',
  area: '',
  singlePrice: '',
  doublePrice: '',
  triplePrice: '',
  genderAllowed: '',
  availableRooms: '',
  sharing: '',
  foodOption: '',
  description: '',
};

const emptyImageSlots = [null, null, null, null];

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toFormFromProperty(property) {
  const sharingPrices = property?.sharing_prices || {};
  return {
    title: property?.title || '',
    city: property?.city || '',
    area: property?.area || '',
    singlePrice: sharingPrices['1'] ? String(sharingPrices['1']) : '',
    doublePrice: sharingPrices['2'] ? String(sharingPrices['2']) : '',
    triplePrice: sharingPrices['3'] ? String(sharingPrices['3']) : '',
    genderAllowed: property?.gender_allowed || '',
    availableRooms: String(property?.available_rooms ?? ''),
    sharing: property?.sharing || '',
    foodOption: property?.food_option || '',
    description: property?.description || '',
  };
}

export default function EditPropertyPage() {
  const params = useParams();
  const propertyId = Number(params?.id);
  const [form, setForm] = useState(initialForm);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [customAmenities, setCustomAmenities] = useState([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [imageUrls, setImageUrls] = useState(emptyImageSlots);
  const [uploadingSlots, setUploadingSlots] = useState([false, false, false, false]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-property-edit', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/owner/properties/${propertyId}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load property');
      return json;
    },
    enabled: Number.isFinite(propertyId) && propertyId > 0,
  });

  useEffect(() => {
    if (!data) return;
    setForm(toFormFromProperty(data));

    const knownAmenities = new Set(amenityOptions.map((item) => item.label));
    const incomingAmenities = Array.isArray(data.amenities) ? data.amenities : [];
    setSelectedAmenities(incomingAmenities.filter((item) => knownAmenities.has(item)));
    setCustomAmenities(incomingAmenities.filter((item) => !knownAmenities.has(item)));

    const incomingImages = Array.isArray(data.images) ? data.images.slice(0, 4) : [];
    setImageUrls([...incomingImages, ...emptyImageSlots].slice(0, 4));
  }, [data]);

  const allAmenities = useMemo(
    () => [...selectedAmenities, ...customAmenities].filter(Boolean),
    [selectedAmenities, customAmenities]
  );

  const sharingPrices = useMemo(
    () => ({
      1: toPositiveNumber(form.singlePrice),
      2: toPositiveNumber(form.doublePrice),
      3: toPositiveNumber(form.triplePrice),
    }),
    [form.singlePrice, form.doublePrice, form.triplePrice]
  );

  const requiredSharingKeys = useMemo(() => {
    if (!form.sharing) return [];
    return form.sharing === 'all123' ? ['1', '2', '3'] : [form.sharing];
  }, [form.sharing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/owner/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          sharingPrices,
          price:
            requiredSharingKeys.length > 0
              ? Math.min(...requiredSharingKeys.map((key) => sharingPrices[key]).filter(Boolean))
              : null,
          amenities: allAmenities,
          images: imageUrls.filter(Boolean),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update property');
      return json;
    },
    onSuccess: () => {
      toast.success('Property updated and moved to review.');
      window.location.href = '/dashboard/owner/properties';
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update property');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file }) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new Error('Image size must be under 8MB');
      }

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/owner/uploads/property-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl,
          fileName: file.name,
          mimeType: file.type,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to upload image');
      return json;
    },
    onMutate: (variables) => {
      setUploadingSlots((prev) => {
        const next = [...prev];
        next[variables.slotIndex] = true;
        return next;
      });
    },
    onSuccess: (result, variables) => {
      setImageUrls((prev) => {
        const next = [...prev];
        next[variables.slotIndex] = result.imageUrl;
        return next;
      });
      toast.success(`Photo ${variables.slotIndex + 1} uploaded`);
    },
    onError: (err) => toast.error(err.message || 'Failed to upload image'),
    onSettled: (_data, _error, variables) => {
      if (!variables) return;
      setUploadingSlots((prev) => {
        const next = [...prev];
        next[variables.slotIndex] = false;
        return next;
      });
    },
  });

  const canSubmit = useMemo(() => {
    return (
      !!form.title.trim() &&
      !!form.city.trim() &&
      !!form.area.trim() &&
      !!form.availableRooms &&
      !!form.sharing &&
      !!form.genderAllowed &&
      !!form.foodOption &&
      requiredSharingKeys.every(
        (key) => Number.isFinite(sharingPrices[key]) && sharingPrices[key] > 0
      ) &&
      allAmenities.length > 0
    );
  }, [allAmenities.length, form, requiredSharingKeys, sharingPrices]);

  return (
    <OwnerDashboardShell
      activeKey="properties"
      title="Edit Property"
      description="Update all listing details. After update, listing will be sent for admin review."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading property...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <form
          className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) {
              toast.error('Please fill all required fields');
              return;
            }
            updateMutation.mutate();
          }}
        >
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base"
            placeholder="Property title"
            required
          />

          <input
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            className="min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base"
            placeholder="City"
            required
          />

          <input
            value={form.area}
            onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
            className="min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base"
            placeholder="Area / locality"
            required
          />

          <input
            value={form.availableRooms}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, availableRooms: event.target.value }))
            }
            className="min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base"
            placeholder="Available rooms"
            type="number"
            min="0"
            required
          />

          <select
            value={form.sharing}
            onChange={(event) => setForm((prev) => ({ ...prev, sharing: event.target.value }))}
            className={`min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base ${
              form.sharing ? 'text-[#073735]' : 'text-[#94a3b8]'
            }`}
            required
          >
            <option value="" disabled>
              Select sharing
            </option>
            <option value="1">Single sharing (1)</option>
            <option value="2">Double sharing (2)</option>
            <option value="3">Triple sharing (3)</option>
            <option value="all123">All (1, 2, 3)</option>
          </select>

          <div className="rounded-2xl border border-[#d8ebea] bg-[#f8fafc] p-3 sm:p-4 md:col-span-2">
            <h3 className="text-sm font-bold text-[#073735]">Sharing-wise monthly price</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                value={form.singlePrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, singlePrice: event.target.value }))
                }
                disabled={!(form.sharing === '1' || form.sharing === 'all123')}
                className="min-h-11 rounded-2xl border border-[#d8ebea] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                placeholder="Single sharing price"
                type="number"
                min="0"
              />
              <input
                value={form.doublePrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, doublePrice: event.target.value }))
                }
                disabled={!(form.sharing === '2' || form.sharing === 'all123')}
                className="min-h-11 rounded-2xl border border-[#d8ebea] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                placeholder="Double sharing price"
                type="number"
                min="0"
              />
              <input
                value={form.triplePrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, triplePrice: event.target.value }))
                }
                disabled={!(form.sharing === '3' || form.sharing === 'all123')}
                className="min-h-11 rounded-2xl border border-[#d8ebea] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                placeholder="Triple sharing price"
                type="number"
                min="0"
              />
            </div>
          </div>

          <select
            value={form.genderAllowed}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, genderAllowed: event.target.value }))
            }
            className={`min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base ${
              form.genderAllowed ? 'text-[#073735]' : 'text-[#94a3b8]'
            }`}
            required
          >
            <option value="" disabled>
              Select user category
            </option>
            <option value="co-ed">Co-living (All)</option>
            <option value="boys">Boys only</option>
            <option value="girls">Girls only</option>
          </select>

          <select
            value={form.foodOption}
            onChange={(event) => setForm((prev) => ({ ...prev, foodOption: event.target.value }))}
            className={`min-h-11 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base ${
              form.foodOption ? 'text-[#073735]' : 'text-[#94a3b8]'
            }`}
            required
          >
            <option value="" disabled>
              Select food plan
            </option>
            <option value="included">Food included</option>
            <option value="optional">Food optional</option>
            <option value="not-available">Food unavailable</option>
          </select>

          <div className="rounded-2xl border border-[#d8ebea] bg-[#f8fafc] p-3 sm:p-4 md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-[#0f8f8b]" />
              <h3 className="text-sm font-bold text-[#073735]">Amenities</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {amenityOptions.map((option) => {
                const Icon = option.icon;
                const checked = selectedAmenities.includes(option.label);
                return (
                  <label
                    key={option.key}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      checked
                        ? 'border-[#0f8f8b] bg-[#e8f7f5] text-[#0c6764]'
                        : 'border-[#d8ebea] bg-white text-[#073735]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#0f8f8b]"
                      checked={checked}
                      onChange={() =>
                        setSelectedAmenities((prev) =>
                          checked
                            ? prev.filter((item) => item !== option.label)
                            : [...prev, option.label]
                        )
                      }
                    />
                    <Icon size={14} />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-[#b9e1de] bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-[#073735]/80">Other / Custom amenity</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={customAmenityInput}
                  onChange={(event) => setCustomAmenityInput(event.target.value)}
                  className="min-h-10 flex-1 rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-3 py-2 text-sm"
                  placeholder="Add custom amenity"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = customAmenityInput.trim();
                    if (!value) return;
                    if ([...selectedAmenities, ...customAmenities].includes(value)) {
                      toast.error('Amenity already added');
                      return;
                    }
                    setCustomAmenities((prev) => [...prev, value]);
                    setCustomAmenityInput('');
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#0f8f8b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0c6764]"
                >
                  <CirclePlus size={14} />
                  Add
                </button>
              </div>

              {customAmenities.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {customAmenities.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]"
                    >
                      {item}
                      <button
                        type="button"
                        className="text-[#1d4ed8]/80 hover:text-[#1d4ed8]"
                        onClick={() =>
                          setCustomAmenities((prev) => prev.filter((amenity) => amenity !== item))
                        }
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="min-h-28 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm sm:text-base md:col-span-2"
            placeholder="Property description"
          />

          <div className="md:col-span-2 rounded-2xl border border-[#d8ebea] bg-[#f8fafc] p-3 sm:p-4">
            <div>
              <h3 className="text-sm font-bold text-[#073735]">Property photos (Cloudinary)</h3>
              <p className="text-xs text-[#073735]/60">Upload up to 4 images.</p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {imageUrls.map((url, index) => (
                <div
                  key={`image-slot-${index + 1}`}
                  className="rounded-xl border border-[#d8ebea] bg-white p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#073735]">
                      {index === 0 ? 'Photo 1 (Main Profile)' : `Photo ${index + 1}`}
                    </p>
                    {url ? (
                      <button
                        type="button"
                        onClick={() =>
                          setImageUrls((prev) => {
                            const next = [...prev];
                            next[index] = null;
                            return next;
                          })
                        }
                        className="rounded-full bg-black/70 p-1 text-white"
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </div>

                  {url ? (
                    <img
                      src={url}
                      alt={`Property ${index + 1}`}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="mb-2 flex h-28 w-full items-center justify-center rounded-lg bg-[#f8fafc] text-xs text-[#073735]/55">
                      Empty slot
                    </div>
                  )}

                  <label className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0f8f8b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6764] sm:w-auto">
                    <UploadCloud size={14} />
                    {uploadingSlots[index] ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingSlots[index]}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        uploadMutation.mutate({ file, slotIndex: index });
                        event.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c6764] disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Listing'}
            </button>
            <a
              href="/dashboard/owner/properties"
              className="text-sm font-semibold text-[#0f8f8b] sm:ml-1"
            >
              Back to My Listings
            </a>
          </div>
        </form>
      ) : null}
    </OwnerDashboardShell>
  );
}
