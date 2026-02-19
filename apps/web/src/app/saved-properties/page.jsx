'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import PropertyCard from '@/components/PropertyCard';
import { useQuery } from '@tanstack/react-query';
import { BookmarkCheck } from 'lucide-react';
import { useEffect } from 'react';

export default function SavedPropertiesPage() {
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['saved-page-session'],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const isAllowed = Boolean(session?.authenticated && session?.role === 'user');

  const {
    data: saved = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['saved-properties'],
    enabled: isAllowed,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await fetch('/api/properties?saved=true&limit=100');
      if (!response.ok) throw new Error('Failed to fetch saved properties');
      return response.json();
    },
  });

  useEffect(() => {
    if (!isSessionLoading && !isAllowed && typeof window !== 'undefined') {
      window.location.href = `/account/user/signin?next=${encodeURIComponent('/saved-properties')}`;
    }
  }, [isAllowed, isSessionLoading]);

  if (!isAllowed) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#073735] sm:text-3xl">
            Saved Properties
          </h1>
          <p className="mt-1 text-sm text-[#073735]/65">
            Your shortlisted PGs, ready to compare and book.
          </p>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[360px] animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-extrabold text-[#073735]">
              Unable to load saved properties
            </h2>
            <p className="mt-2 text-sm text-[#073735]/65">
              {error.message || 'Please refresh and try again.'}
            </p>
          </div>
        ) : saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#cfe7e5] bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f9f9] text-[#0f8f8b]">
              <BookmarkCheck size={26} />
            </div>
            <h2 className="text-xl font-extrabold text-[#073735]">No saved properties yet</h2>
            <p className="mt-2 text-sm text-[#073735]/65">
              Tap the save button on any PG to add it here.
            </p>
            <a
              href="/search"
              className="mt-6 inline-flex rounded-full bg-[#0f8f8b] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0c6764]"
            >
              Browse PGs
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
