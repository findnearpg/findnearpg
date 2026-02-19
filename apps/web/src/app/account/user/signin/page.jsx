'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function UserSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/user/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
      toast.success('Signed in successfully');
      const next = new URLSearchParams(window.location.search).get('next') || '/search';
      window.location.href = next;
    },
    onError: (error) => toast.error(error.message || 'Failed to sign in'),
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:rounded-[28px] sm:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">User Login</h1>
          <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
            Sign in to book PG and view your bookings.
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
              placeholder="Email"
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

          <p className="mt-6 text-sm text-[#073735]/60">
            New user?{' '}
            <a href="/account/user/signup" className="font-semibold text-[#0f8f8b]">
              Create account
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
