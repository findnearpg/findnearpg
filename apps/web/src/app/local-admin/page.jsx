'use client';

import { useEffect } from 'react';

export default function LocalAdminEntryPage() {
  useEffect(() => {
    window.location.replace('/admin');
  }, []);
  return null;
}
