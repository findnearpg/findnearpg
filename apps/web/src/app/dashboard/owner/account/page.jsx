'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  FileText,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function StatusPill({ status }) {
  const normalized = String(status || 'not_submitted').toLowerCase();
  if (normalized === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
        <BadgeCheck size={13} /> Verified Owner
      </span>
    );
  }
  if (normalized === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
        <ShieldAlert size={13} /> Under Review
      </span>
    );
  }
  if (normalized === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
        <ShieldQuestion size={13} /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#073735] px-3 py-1 text-xs font-bold text-white">
      <ShieldQuestion size={13} /> Not Submitted
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="block">
      <p className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#073735]/55">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function OwnerAccountPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [govtIdType, setGovtIdType] = useState('');
  const [govtIdNumber, setGovtIdNumber] = useState('');
  const [govtIdUrl, setGovtIdUrl] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['owner-account'],
    queryFn: async () => {
      const response = await fetch('/api/owner/account');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to load account');
      return json;
    },
  });

  useEffect(() => {
    if (!data) return;
    setName(data.name || '');
    setMobile(data.mobile || '');
    setGovtIdType(data.govtIdType || '');
    setGovtIdNumber(data.govtIdNumber || '');
    setGovtIdUrl(data.govtIdUrl || '');
  }, [data]);

  const verificationStatus = String(data?.verificationStatus || 'not_submitted').toLowerCase();
  const isVerified = verificationStatus === 'approved';
  const isPending = verificationStatus === 'pending';
  const isRejected = verificationStatus === 'rejected';
  const canEditKyc = verificationStatus === 'not_submitted' || verificationStatus === 'rejected';
  const lockAllDetails = isVerified || isPending;

  const profileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/owner/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to update profile');
      return json;
    },
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['owner-account'] });
      queryClient.invalidateQueries({ queryKey: ['owner-account-mini'] });
    },
    onError: (error) => toast.error(error.message || 'Failed to update profile'),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file) => {
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
      if (!response.ok) throw new Error(json.error || 'Failed to upload document');
      return json;
    },
    onSuccess: (result) => {
      setGovtIdUrl(String(result.fileUrl || ''));
      toast.success('Document uploaded. Submit KYC for admin review.');
    },
    onError: (error) => toast.error(error.message || 'Failed to upload document'),
  });

  const kycReady = useMemo(
    () => Boolean(govtIdType && govtIdNumber.trim() && govtIdUrl),
    [govtIdType, govtIdNumber, govtIdUrl]
  );

  const submitKycMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/owner/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          mobile,
          govtIdType,
          govtIdNumber,
          govtIdUrl,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to submit KYC');
      return json;
    },
    onSuccess: () => {
      toast.success('KYC submitted. Status is now Under Review.');
      queryClient.invalidateQueries({ queryKey: ['owner-account'] });
      queryClient.invalidateQueries({ queryKey: ['owner-account-mini'] });
    },
    onError: (error) => toast.error(error.message || 'Failed to submit KYC'),
  });

  return (
    <OwnerDashboardShell
      activeKey="account"
      title="Account Settings"
      description="Manage profile details, verification status, and account security from one place."
    >
      {isLoading ? <p className="text-sm text-[#073735]/70">Loading account...</p> : null}
      {!isLoading && error ? <p className="text-sm text-red-600">{error.message}</p> : null}

      {!isLoading && !error ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <section className="space-y-4">
            <article className="rounded-3xl border border-[#d7ecea] bg-gradient-to-r from-[#f5fffd] to-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-2xl bg-[#e5f7f4] p-2 text-[#0f8f8b]">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <p className="text-xl font-black text-[#073735]">
                      {name || data?.name || 'Owner'}
                    </p>
                    <p className="text-sm text-[#073735]/65">{data?.email || '-'}</p>
                  </div>
                </div>
                <StatusPill status={verificationStatus} />
              </div>

              {isPending ? (
                <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  KYC is under admin review. Document update is locked until review completion.
                </p>
              ) : null}
              {isRejected && data?.verificationRejectionReason ? (
                <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  Rejection reason: {data.verificationRejectionReason}
                </p>
              ) : null}
            </article>

            <form
              className="rounded-3xl border border-[#d7ecea] bg-white p-5"
              onSubmit={(event) => {
                event.preventDefault();
                profileMutation.mutate();
              }}
            >
              <h2 className="text-sm font-black uppercase tracking-wide text-[#073735]/70">
                Profile Information
              </h2>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Full Name">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-[#d8ebea] bg-[#f9fdfd] px-4 py-3 text-sm disabled:bg-gray-100"
                    required
                    disabled={lockAllDetails}
                  />
                </Field>

                <Field label="Mobile">
                  <input
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    className="w-full rounded-2xl border border-[#d8ebea] bg-[#f9fdfd] px-4 py-3 text-sm disabled:bg-gray-100"
                    required
                    disabled={lockAllDetails}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Email (Locked)">
                    <input
                      value={data?.email || ''}
                      className="w-full rounded-2xl border border-[#d8ebea] bg-gray-100 px-4 py-3 text-sm text-[#073735]/70"
                      disabled
                    />
                  </Field>
                </div>
              </div>

              {lockAllDetails ? (
                <p className="mt-4 rounded-2xl bg-[#f6fbfb] px-3 py-2 text-xs font-semibold text-[#073735]/75">
                  Profile fields are locked in {isVerified ? 'verified' : 'under review'} state.
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!lockAllDetails ? (
                  <button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="w-full rounded-full bg-[#0f8f8b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60 sm:w-auto"
                  >
                    {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
                  </button>
                ) : null}
                <a
                  href="/account/owner/forgot-password"
                  className="w-full rounded-full border border-[#b7deda] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#073735] hover:bg-[#f1f9f9] sm:w-auto"
                >
                  Reset Password
                </a>
                <a
                  href="/dashboard/owner/help"
                  className="w-full rounded-full border border-[#b7deda] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#073735] hover:bg-[#f1f9f9] sm:w-auto"
                >
                  Need Help
                </a>
              </div>
            </form>

            <article className="rounded-3xl border border-[#d7ecea] bg-white p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-xl bg-[#e5f7f4] p-2 text-[#0f8f8b]">
                  <FileText size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide text-[#073735]/70">
                    Government ID Verification
                  </h2>
                  <p className="text-xs text-[#073735]/60">
                    Mandatory before adding property. Required: document type, number, and uploaded
                    proof.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Document Type">
                  <select
                    value={govtIdType}
                    onChange={(event) => setGovtIdType(event.target.value)}
                    className="w-full rounded-2xl border border-[#d8ebea] bg-[#f9fdfd] px-4 py-3 text-sm disabled:bg-gray-100"
                    disabled={!canEditKyc}
                  >
                    <option value="">Select document type</option>
                    <option value="pan">PAN Card</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="aadhaar">Aadhaar</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </Field>

                <Field label="Document Number">
                  <input
                    value={govtIdNumber}
                    onChange={(event) => setGovtIdNumber(event.target.value.toUpperCase())}
                    className="w-full rounded-2xl border border-[#d8ebea] bg-[#f9fdfd] px-4 py-3 text-sm disabled:bg-gray-100"
                    placeholder="Document number"
                    disabled={!canEditKyc}
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white ${
                    canEditKyc
                      ? 'cursor-pointer bg-[#0f8f8b] hover:bg-[#0c6764]'
                      : 'cursor-not-allowed bg-gray-400'
                  }`}
                >
                  {uploadDocumentMutation.isPending
                    ? 'Uploading...'
                    : isRejected
                      ? 'Re-upload Document'
                      : 'Upload Document'}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    disabled={!canEditKyc}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      uploadDocumentMutation.mutate(file);
                      event.target.value = '';
                    }}
                  />
                </label>

                {govtIdUrl ? (
                  <a
                    href={govtIdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#0f8f8b] underline"
                  >
                    View uploaded document
                  </a>
                ) : (
                  <span className="text-xs text-[#073735]/55">No document uploaded</span>
                )}
              </div>

              <div className="mt-4">
                {isVerified ? (
                  <p className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <ShieldCheck size={13} /> KYC Verified - Resubmission disabled
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => submitKycMutation.mutate()}
                    disabled={!canEditKyc || !kycReady || submitKycMutation.isPending}
                    className="w-full rounded-full bg-[#073735] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0c6764] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                  >
                    {submitKycMutation.isPending ? 'Submitting...' : 'Submit KYC For Review'}
                  </button>
                )}
              </div>
            </article>
          </section>

          <aside className="space-y-4">
            <article className="rounded-3xl border border-[#d7ecea] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#073735]/55">
                Verification Checklist
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#073735]/80">
                <li className="rounded-xl bg-[#f6fbfb] px-3 py-2">
                  1. Select government document type
                </li>
                <li className="rounded-xl bg-[#f6fbfb] px-3 py-2">
                  2. Enter valid document number
                </li>
                <li className="rounded-xl bg-[#f6fbfb] px-3 py-2">3. Upload clear proof file</li>
                <li className="rounded-xl bg-[#f6fbfb] px-3 py-2">
                  4. Submit KYC for admin review
                </li>
              </ul>
            </article>

            <article className="rounded-3xl border border-[#d7ecea] bg-[#f8fffe] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#073735]/55">
                Current Status
              </p>
              <div className="mt-2">
                <StatusPill status={verificationStatus} />
              </div>
              <p className="mt-3 text-xs text-[#073735]/70">
                {isVerified
                  ? 'Owner verification is complete. You can continue listing operations.'
                  : isPending
                    ? 'Admin review is in progress. Wait for approval/rejection update.'
                    : isRejected
                      ? 'Please correct document details and resubmit KYC.'
                      : 'KYC submission is required before adding properties.'}
              </p>
            </article>
          </aside>
        </div>
      ) : null}
    </OwnerDashboardShell>
  );
}
