'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function UserResetPasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['user-reset-password-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) return null;
      return response.json();
    },
  });

  useEffect(() => {
    if (isSessionLoading) return;
    if (!session?.authenticated || session?.role !== 'user') {
      window.location.replace('/account/user/signin?next=/account/user/reset-password');
    }
  }, [isSessionLoading, session]);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'user',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Failed to reset password');
      return json;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => toast.error(error.message || 'Failed to reset password'),
  });

  const disabled =
    resetMutation.isPending ||
    currentPassword.length < 1 ||
    newPassword.length < 6 ||
    confirmPassword !== newPassword;

  if (isSessionLoading || !session?.authenticated || session?.role !== 'user') {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8fafc]">
        <Header />
        <main className="flex-1 mx-auto max-w-lg px-4 py-10 sm:px-6">
          Checking account access...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 sm:rounded-[28px] sm:p-8">
          <h1 className="mb-2 text-2xl font-extrabold text-[#073735] sm:text-3xl">
            Reset Password
          </h1>
          <p className="mb-6 text-sm text-[#073735]/60 sm:mb-8 sm:text-base">
            Update your account password securely.
          </p>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              resetMutation.mutate();
            }}
          >
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Current password"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="New password (min 6 chars)"
              required
              minLength={6}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm sm:text-base"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={disabled}
              className="w-full rounded-full bg-[#0f8f8b] px-6 py-3 text-sm font-bold text-white hover:bg-[#0c6764] disabled:opacity-60 sm:text-base"
            >
              {resetMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
