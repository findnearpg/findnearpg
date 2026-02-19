'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function UserSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/user/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password }),
      });
      const raw = await response.text();
      let json = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = {};
      }
      if (!response.ok) throw new Error(json.error || 'Failed to send OTP');
      return json;
    },
    onSuccess: () => {
      setOtpRequested(true);
      setResendSeconds(30);
      toast.success('OTP sent to your email');
    },
    onError: (error) => toast.error(error.message || 'Failed to send OTP'),
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/user/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const raw = await response.text();
      let json = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        json = {};
      }
      if (!response.ok) throw new Error(json.error || 'Failed to verify OTP');
      return json;
    },
    onSuccess: () => {
      toast.success('Account created successfully');
      window.location.href = '/search';
    },
    onError: (error) => toast.error(error.message || 'Failed to verify OTP'),
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:rounded-[28px] sm:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">
            User Registration
          </h1>
          <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
            Create user account to book PG properties.
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
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Full name"
              required
              disabled={otpRequested}
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Email"
              required
              disabled={otpRequested}
            />
            <input
              type="tel"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Mobile"
              disabled={otpRequested}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Password (min 6 chars)"
              required
              minLength={6}
              disabled={otpRequested}
            />
            {otpRequested && (
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm tracking-[0.28em] sm:text-base"
                placeholder="Enter OTP"
                required
                maxLength={6}
              />
            )}
            <button
              type="submit"
              disabled={requestOtpMutation.isPending || verifyOtpMutation.isPending}
              className="w-full rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60 sm:text-base"
            >
              {!otpRequested &&
                (requestOtpMutation.isPending ? 'Sending OTP...' : 'Send Email OTP')}
              {otpRequested &&
                (verifyOtpMutation.isPending ? 'Verifying OTP...' : 'Verify OTP & Create Account')}
            </button>
            {otpRequested ? (
              <button
                type="button"
                disabled={requestOtpMutation.isPending || resendSeconds > 0}
                onClick={() => requestOtpMutation.mutate()}
                className="w-full rounded-full bg-gray-100 px-6 py-3 text-sm font-semibold text-[#073735] hover:bg-gray-200 disabled:opacity-60 sm:text-base"
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
              </button>
            ) : null}
          </form>

          <p className="mt-6 text-sm text-[#073735]/60">
            Already registered?{' '}
            <a href="/account/user/signin" className="font-semibold text-[#0f8f8b]">
              Sign in
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
