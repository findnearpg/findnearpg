'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function OwnerForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const requestOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/owner/forgot-password/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to send OTP');
      return json;
    },
    onSuccess: () => {
      setOtpRequested(true);
      setResendSeconds(30);
      toast.success('Password reset OTP sent', {
        description: 'Check your email inbox and enter OTP below.',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send OTP');
    },
  });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => {
        if (current <= 1) return 0;
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/owner/forgot-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to reset password');
      return json;
    },
    onSuccess: () => {
      toast.success('Password reset successful', {
        description: 'You can now sign in with your new password.',
      });
      window.location.href = '/account/owner/signin';
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:rounded-[28px] sm:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">
            Owner Password Reset
          </h1>
          <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
            Verify your email via OTP and set a new password.
          </p>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!otpRequested) {
                requestOtpMutation.mutate();
                return;
              }
              resetMutation.mutate();
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Owner email"
              required
              disabled={otpRequested}
            />

            {otpRequested ? (
              <>
                <input
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm tracking-[0.28em] sm:text-base"
                  placeholder="Enter OTP"
                  maxLength={6}
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
                  placeholder="New password"
                  minLength={8}
                  required
                />
              </>
            ) : null}

            <button
              type="submit"
              disabled={requestOtpMutation.isPending || resetMutation.isPending}
              className="w-full rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60 sm:text-base"
            >
              {!otpRequested && (requestOtpMutation.isPending ? 'Sending OTP...' : 'Send OTP')}
              {otpRequested &&
                (resetMutation.isPending ? 'Resetting password...' : 'Verify OTP & Reset')}
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

          <p className="text-sm text-[#073735]/60 mt-6">
            Remembered your password?{' '}
            <a href="/account/owner/signin" className="text-[#0f8f8b] font-semibold">
              Back to sign in
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
