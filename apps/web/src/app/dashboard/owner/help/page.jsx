'use client';

import OwnerDashboardShell from '@/components/OwnerDashboardShell';
import { useMutation } from '@tanstack/react-query';
import { Mail, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function OwnerHelpPage() {
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/owner/help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });
      const raw = await response.text();
      let json = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = {};
      }
      if (!response.ok) {
        const fallback =
          raw && raw.trim().startsWith('<')
            ? 'Temporary server/network issue. Please try again in a moment.'
            : 'Failed to send help request';
        throw new Error(json.error || fallback);
      }
      return json;
    },
    onSuccess: () => {
      toast.success('Query sent to support team');
      setSubject('');
      setMessage('');
      setCategory('general');
    },
    onError: (error) => toast.error(error.message || 'Failed to send help request'),
  });

  return (
    <OwnerDashboardShell
      activeKey="help"
      title="Help & Support"
      description="Report issues or ask support queries. We respond on registered owner email."
    >
      <div className="rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#073735]">
          <Mail size={16} />
          Support Email: Findnearpg@gmail.com
        </p>
        <p className="mt-1 text-xs text-[#073735]/70">
          Submit this form to send your issue directly to support inbox.
        </p>
      </div>

      <form
        className="mt-4 grid gap-3 md:max-w-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          sendMutation.mutate();
        }}
      >
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-2xl border border-[#d8ebea] bg-white px-4 py-3 text-sm text-[#073735]"
        >
          <option value="general">General</option>
          <option value="kyc">KYC / Verification</option>
          <option value="property">Property Listing</option>
          <option value="booking">Booking / Tenant</option>
          <option value="subscription">Subscription / Billing</option>
          <option value="technical">Technical Issue</option>
        </select>

        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Subject (minimum 5 characters)"
          className="rounded-2xl border border-[#d8ebea] bg-white px-4 py-3 text-sm"
          required
          minLength={5}
        />

        <label className="relative block">
          <MessageSquareText
            size={16}
            className="pointer-events-none absolute left-3 top-3 text-[#073735]/50"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe your query/issue in detail..."
            className="min-h-40 w-full rounded-2xl border border-[#d8ebea] bg-white py-3 pl-9 pr-4 text-sm"
            required
            minLength={15}
          />
        </label>

        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="w-fit rounded-full bg-[#0f8f8b] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60"
        >
          {sendMutation.isPending ? 'Sending...' : 'Send Query'}
        </button>
      </form>
    </OwnerDashboardShell>
  );
}
