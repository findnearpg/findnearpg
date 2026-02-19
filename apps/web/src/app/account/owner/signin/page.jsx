'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function OwnerSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/owner/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const raw = await response.text();
      let json = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = {};
      }
      if (!response.ok) throw new Error(json.error || 'Failed to sign in');
      return json;
    },
    onSuccess: () => {
      toast.success('Signed in as owner');
      window.location.href = '/dashboard/owner/overview';
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to sign in');
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:rounded-[28px] sm:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">Owner Sign In</h1>
          <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
            Access your owner dashboard and manage listings.
          </p>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              signInMutation.mutate();
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Owner email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Password"
              required
            />

            <button
              type="submit"
              disabled={signInMutation.isPending}
              className="w-full rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60 sm:text-base"
            >
              {signInMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4">
            <a
              href="/account/owner/forgot-password"
              className="text-sm font-semibold text-[#0f8f8b] hover:text-[#0c6764]"
            >
              Forgot password?
            </a>
          </div>

          <p className="text-sm text-[#073735]/60 mt-6">
            New owner?{' '}
            <a href="/account/owner/signup" className="text-[#0f8f8b] font-semibold">
              Create owner account
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
