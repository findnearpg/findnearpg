'use client';

import { useEffect } from 'react';

export default function OwnerDashboardEntryPage() {
  useEffect(() => {
    window.location.replace('/dashboard/owner/overview');
  }, []);

  return null;
}
