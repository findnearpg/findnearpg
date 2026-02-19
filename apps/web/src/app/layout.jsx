'use client';

import LoadingSpinner from '@/components/LoadingSpinner';
import {
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useIsMutating,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function GlobalQueryLoader() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const busy = isFetching > 0 || isMutating > 0;
    if (busy) {
      setShowLoader(true);
      return;
    }
    const timer = setTimeout(() => setShowLoader(false), 120);
    return () => clearTimeout(timer);
  }, [isFetching, isMutating]);

  return showLoader ? <LoadingSpinner fullScreen label="loading" /> : null;
}

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <GlobalQueryLoader />
    </QueryClientProvider>
  );
}
