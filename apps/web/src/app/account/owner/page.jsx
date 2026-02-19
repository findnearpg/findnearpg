'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function OwnerEntryPage() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['owner-entry-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) {
        return {
          authenticated: false,
          role: 'guest',
        };
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (isLoading) return;
    if (session?.authenticated && session?.role === 'owner') {
      window.location.replace('/dashboard/owner/properties');
      return;
    }
    window.location.replace('/account/owner/signin');
  }, [isLoading, session]);

  return null;
}
