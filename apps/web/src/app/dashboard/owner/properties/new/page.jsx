'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Camera,
  CirclePlus,
  ShieldCheck,
  UploadCloud,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
  propertyLicenseNumber: '',
};

const emptyImageSlots = [null, null, null, null];

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function Field({ label, required, children }) {
  return (
    <div className="block">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#073735]/65">
        {label}
        {required ? ' *' : ''}
      </p>
      {children}
    </div>
  );
}

export default function NewPropertyPage() {
  const [form, setForm] = useState(initialForm);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [customAmenities, setCustomAmenities] = useState([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [imageUrls, setImageUrls] = useState(emptyImageSlots);
  const [uploadingSlots, setUploadingSlots] = useState([false, false, false, false]);
  const [propertyLicenseDocumentUrl, setPropertyLicenseDocumentUrl] = useState('');

  const { data: ownerAccount } = useQuery({
    queryKey: ['owner-account'],
    queryFn: async () => {
      const response = await fetch('/api/owner/account');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load owner account');
      return json;
    },
  });

  const { data: subscriptionInfo } = useQuery({
    queryKey: ['owner-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/owner/subscription');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load subscription');
      return json;
    },
  });

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

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sharingPrices,
          price:
            requiredSharingKeys.length > 0
              ? Math.min(...requiredSharingKeys.map((key) => sharingPrices[key]).filter(Boolean))
              : null,
          amenities: allAmenities,
          images: imageUrls.filter(Boolean),
          propertyLicenseNumber: form.propertyLicenseNumber,
          propertyLicenseDocumentUrl,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to create property');
      return json;
    },
    onSuccess: () => {
      toast.success('Property submitted successfully. It is now under admin review.');
      setForm(initialForm);
      setSelectedAmenities([]);
      setCustomAmenities([]);
      setCustomAmenityInput('');
      setImageUrls(emptyImageSlots);
      setPropertyLicenseDocumentUrl('');
    },
    onError: (error) => toast.error(error.message || 'Failed to create property'),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file }) => {
      if (!file.type.startsWith('image/')) throw new Error('Please select a valid image file');
      if (file.size > 8 * 1024 * 1024) throw new Error('Image size must be under 8MB');

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/owner/uploads/property-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, fileName: file.name, mimeType: file.type }),
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
    onSuccess: (data, variables) => {
      setImageUrls((prev) => {
        const next = [...prev];
        next[variables.slotIndex] = data.imageUrl;
        return next;
      });
      toast.success(`Photo ${variables.slotIndex + 1} uploaded`);
    },
    onError: (error) => toast.error(error.message || 'Failed to upload image'),
    onSettled: (_data, _error, variables) => {
      if (!variables) return;
      setUploadingSlots((prev) => {
        const next = [...prev];
        next[variables.slotIndex] = false;
        return next;
      });
    },
  });

  const uploadLicenseMutation = useMutation({
    mutationFn: async ({ file }) => {
      if (!file) throw new Error('Please select a document file');
      if (file.size > 8 * 1024 * 1024) throw new Error('Document size must be under 8MB');

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/owner/uploads/verification-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || 'Failed to upload license document');
      return json;
    },
    onSuccess: (data) => {
      setPropertyLicenseDocumentUrl(String(data.fileUrl || ''));
      toast.success('License document uploaded');
    },
    onError: (error) => toast.error(error.message || 'Failed to upload license document'),
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
      !!form.propertyLicenseNumber.trim() &&
      !!propertyLicenseDocumentUrl &&
      requiredSharingKeys.every(
        (key) => Number.isFinite(sharingPrices[key]) && sharingPrices[key] > 0
      ) &&
      allAmenities.length > 0
    );
  }, [allAmenities.length, form, propertyLicenseDocumentUrl, requiredSharingKeys, sharingPrices]);

  const ownerVerified = String(ownerAccount?.verificationStatus || '').toLowerCase() === 'approved';
  const propertyAddLocked = !ownerVerified || subscriptionInfo?.canAddProperty === false;
  const uploadedImageCount = imageUrls.filter(Boolean).length;

  return (
    <OwnerDashboardShell
      activeKey="add-property"
      title="Add New PG Property"
      description="Fill the form once and submit. Keep details simple and accurate."
    >
      {propertyAddLocked ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {!ownerVerified ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>Add property is locked. Complete owner verification first.</p>
              <a
                href="/dashboard/owner/account"
                className="inline-flex items-center justify-center rounded-full bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Open Account Settings
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>Property limit reached for current plan.</p>
              <a
                href="/dashboard/owner/subscription"
                className="inline-flex items-center justify-center rounded-full bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Open Subscription
              </a>
            </div>
          )}
        </div>
      ) : null}

      <div className="mb-4 rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4 text-sm text-[#073735]/80">
        <p className="font-semibold text-[#073735]">Before submit</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Add clear title, location, and sharing price.</li>
          <li>Choose amenities and upload at least 2 photos.</li>
          <li>License number and license document are mandatory.</li>
          <li>Your property will be reviewed by admin before going live.</li>
        </ul>
      </div>

      <form
        className={`space-y-4 ${propertyAddLocked ? 'pointer-events-none opacity-60' : ''}`}
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) {
            toast.error('Please fill all required fields');
            return;
          }
          createMutation.mutate(form);
        }}
      >
        <section className="rounded-2xl border border-[#d7ecea] p-4">
          <h3 className="text-sm font-bold text-[#073735]">1. Basic Details</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Property title" required>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm"
                placeholder="Property title"
                required
              />
            </Field>
            <Field label="City" required>
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm"
                placeholder="City"
                required
              />
            </Field>
            <Field label="Area / locality" required>
              <input
                value={form.area}
                onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm"
                placeholder="Area / locality"
                required
              />
            </Field>
            <Field label="Available rooms" required>
              <input
                value={form.availableRooms}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, availableRooms: event.target.value }))
                }
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm"
                placeholder="Available rooms"
                type="number"
                min="0"
                required
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7ecea] p-4">
          <h3 className="text-sm font-bold text-[#073735]">2. Room & Pricing</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Sharing type" required>
              <select
                value={form.sharing}
                onChange={(event) => setForm((prev) => ({ ...prev, sharing: event.target.value }))}
                className={`min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm ${
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
            </Field>

            <Field label="Allowed category" required>
              <select
                value={form.genderAllowed}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, genderAllowed: event.target.value }))
                }
                className={`min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm ${
                  form.genderAllowed ? 'text-[#073735]' : 'text-[#94a3b8]'
                }`}
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="co-ed">Co-living (All)</option>
                <option value="boys">Boys only</option>
                <option value="girls">Girls only</option>
              </select>
            </Field>

            <Field label="Food plan" required>
              <select
                value={form.foodOption}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, foodOption: event.target.value }))
                }
                className={`min-h-11 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm ${
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
            </Field>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field
              label="Single sharing price"
              required={form.sharing === '1' || form.sharing === 'all123'}
            >
              <input
                value={form.singlePrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, singlePrice: event.target.value }))
                }
                disabled={!(form.sharing === '1' || form.sharing === 'all123')}
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                placeholder="Single sharing price"
                type="number"
                min="0"
                required={form.sharing === '1' || form.sharing === 'all123'}
              />
            </Field>
            <Field
              label="Double sharing price"
              required={form.sharing === '2' || form.sharing === 'all123'}
            >
              <input
                value={form.doublePrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, doublePrice: event.target.value }))
                }
                disabled={!(form.sharing === '2' || form.sharing === 'all123')}
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                placeholder="Double sharing price"
                type="number"
                min="0"
                required={form.sharing === '2' || form.sharing === 'all123'}
              />
            </Field>
            <Field
              label="Triple sharing price"
              required={form.sharing === '3' || form.sharing === 'all123'}
            >
              <input
                value={form.triplePrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, triplePrice: event.target.value }))
                }
                disabled={!(form.sharing === '3' || form.sharing === 'all123')}
                className="min-h-11 w-full rounded-xl border border-[#d8ebea] bg-white px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
                placeholder="Triple sharing price"
                type="number"
                min="0"
                required={form.sharing === '3' || form.sharing === 'all123'}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7ecea] p-4">
          <h3 className="text-sm font-bold text-[#073735]">3. Amenities</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenityOptions.map((option) => {
              const Icon = option.icon;
              const checked = selectedAmenities.includes(option.label);
              return (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
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

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={customAmenityInput}
              onChange={(event) => setCustomAmenityInput(event.target.value)}
              className="min-h-10 flex-1 rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-3 py-2 text-sm"
              placeholder="Add custom amenity (e.g., Lift, AC, Parking)"
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

          <Field label="Property description">
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              className="min-h-28 w-full rounded-xl border border-[#d8ebea] bg-[#f8fafc] px-4 py-3 text-sm"
              placeholder="Property description"
            />
          </Field>
        </section>

        <section className="rounded-2xl border border-[#d7ecea] p-4">
          <h3 className="text-sm font-bold text-[#073735]">4. License Details (Required)</h3>
          <p className="mt-1 text-xs text-[#073735]/60">
            Used only for admin verification. Not shown publicly.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={form.propertyLicenseNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, propertyLicenseNumber: event.target.value }))
              }
              className="min-h-11 rounded-xl border border-[#d8ebea] bg-white px-4 py-3 text-sm"
              placeholder="Property / PG license number"
              required
              disabled={propertyAddLocked}
            />
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[#0f8f8b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c6764]">
              {uploadLicenseMutation.isPending ? 'Uploading...' : 'Upload License'}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                disabled={propertyAddLocked || uploadLicenseMutation.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  uploadLicenseMutation.mutate({ file });
                  event.target.value = '';
                }}
              />
            </label>
          </div>
          <p className="mt-2 text-xs">
            {propertyLicenseDocumentUrl ? (
              <a
                href={propertyLicenseDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#0f8f8b] underline"
              >
                View uploaded license document
              </a>
            ) : (
              <span className="text-[#073735]/55">No license document uploaded</span>
            )}
          </p>
        </section>

        <section className="rounded-2xl border border-[#d7ecea] p-4">
          <h3 className="text-sm font-bold text-[#073735]">5. Property Photos</h3>
          <p className="mt-1 text-xs text-[#073735]/60">
            Upload up to 4 photos. At least 2 photos are recommended. Uploaded: {uploadedImageCount}
            /4
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {imageUrls.map((url, index) => (
              <div
                key={`image-slot-${index + 1}`}
                className="rounded-xl border border-[#d8ebea] bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#073735]">
                    {index === 0 ? 'Photo 1 (Main)' : `Photo ${index + 1}`}
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
        </section>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={createMutation.isPending || propertyAddLocked}
            className="rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c6764] disabled:opacity-60"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Property'}
          </button>
          <a
            href="/dashboard/owner/properties"
            className="text-center text-sm font-semibold text-[#0f8f8b]"
          >
            View My Properties
          </a>
        </div>
      </form>
    </OwnerDashboardShell>
  );
}
