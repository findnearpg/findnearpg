'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, MessageSquareText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const NEXT_PATH = '/support/contact';

export function meta() {
  return [
    { title: 'Contact Support | FindNearPG' },
    { name: 'description', content: 'User support page for FindNearPG accounts.' },
  ];
}

export default function ContactSupportPage() {
  const [category, setCategory] = useState('booking');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['contact-support-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const isUser = Boolean(session?.authenticated && session?.role === 'user');

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isUser) {
      window.location.replace(`/account/user/signin?next=${encodeURIComponent(NEXT_PATH)}`);
    }
  }, [isSessionLoading, isUser]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'user',
        },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
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
            : 'Failed to submit support request';
        throw new Error(json.error || fallback);
      }
      return json;
    },
    onSuccess: () => {
      toast.success('Support request sent. Our team will get back to you soon.');
      setSubject('');
      setMessage('');
      setCategory('booking');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send support request');
    },
  });

  const disabled = useMemo(() => {
    return submitMutation.isPending || subject.trim().length < 5 || message.trim().length < 15;
  }, [submitMutation.isPending, subject, message]);

  if (isSessionLoading || !isUser) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <p className="text-sm text-[#073735]/70">Checking user access...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fffe]">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-[#d7ecea] bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-xl bg-[#0f8f8b]/10 p-2 text-[#0f8f8b]">
              <MessageSquareText size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#073735] sm:text-3xl">
                Contact Support
              </h1>
              <p className="mt-1 text-sm text-[#073735]/65">
                Logged in as user:{' '}
                <span className="font-semibold">{session?.email || session?.name || '-'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#073735]">Category</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-[#cde7e5] bg-white px-3 py-2 text-sm text-[#073735] outline-none ring-[#0f8f8b] focus:ring-2"
              >
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="listing">Listing Issue</option>
                <option value="account">Account</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#073735]">Subject</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Short summary of your issue"
                className="w-full rounded-xl border border-[#cde7e5] bg-white px-3 py-2 text-sm text-[#073735] outline-none ring-[#0f8f8b] focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#073735]">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={6}
                placeholder="Describe your issue with useful details like property name, booking id, and timeline."
                className="w-full rounded-xl border border-[#cde7e5] bg-white px-3 py-2 text-sm text-[#073735] outline-none ring-[#0f8f8b] focus:ring-2"
              />
            </label>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#e7f4f3] bg-[#f8fffe] px-3 py-2">
              <div className="inline-flex items-center gap-2 text-xs text-[#073735]/70">
                <AlertCircle size={14} />
                Subject min 5 chars, message min 15 chars.
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => submitMutation.mutate()}
                className="rounded-full bg-[#0f8f8b] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#0c6764] disabled:opacity-60"
              >
                {submitMutation.isPending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
