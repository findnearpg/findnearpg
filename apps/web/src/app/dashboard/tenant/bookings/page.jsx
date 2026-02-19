'use client';

import { useEffect } from 'react';

export default function TenantBookingsRedirectPage() {
  useEffect(() => {
    window.location.replace('/dashboard/user/bookings');
  }, []);

  return null;
}
