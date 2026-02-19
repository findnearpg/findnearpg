'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['admin-login-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session?scope=admin');
      if (!response.ok) return { authenticated: false, role: 'guest' };
      return response.json();
    },
  });

  useEffect(() => {
    if (sessionLoading) return;
    if (session?.authenticated && session?.role === 'admin') {
      window.location.replace('/dashboard/admin');
    }
  }, [sessionLoading, session]);

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/admin/signin/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to send OTP');
      return json;
    },
    onSuccess: (result) => {
      setOtpRequested(true);
      toast.success(`OTP sent to ${result.maskedEmail || 'your email'}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send OTP');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/admin/signin/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to verify OTP');
      return json;
    },
    onSuccess: () => {
      toast.success('Admin login successful');
      window.location.href = '/dashboard/admin';
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to verify OTP');
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <section className="rounded-[24px] border border-gray-100 bg-white p-5 sm:rounded-[28px] sm:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">Admin Login</h1>
          <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
            Restricted access. Sign in to manage platform operations.
          </p>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!otpRequested) {
                requestOtpMutation.mutate();
                return;
              }
              verifyOtpMutation.mutate();
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Admin email"
              required
              disabled={otpRequested}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Password"
              required
              disabled={otpRequested}
            />
            {otpRequested ? (
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm tracking-[0.32em] sm:text-base"
                placeholder="Enter 6-digit OTP"
                minLength={6}
                maxLength={6}
                required
              />
            ) : null}
            <button
              type="submit"
              disabled={requestOtpMutation.isPending || verifyOtpMutation.isPending}
              className="w-full rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60 sm:text-base"
            >
              {!otpRequested
                ? requestOtpMutation.isPending
                  ? 'Sending OTP...'
                  : 'Send OTP'
                : verifyOtpMutation.isPending
                  ? 'Verifying OTP...'
                  : 'Verify OTP and Login'}
            </button>
            {otpRequested ? (
              <button
                type="button"
                className="w-full rounded-full bg-[#073735] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0c6764] sm:text-base"
                onClick={() => {
                  setOtp('');
                  requestOtpMutation.mutate();
                }}
                disabled={requestOtpMutation.isPending || verifyOtpMutation.isPending}
              >
                Resend OTP
              </button>
            ) : null}
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
