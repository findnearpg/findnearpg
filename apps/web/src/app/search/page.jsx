'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import PropertyCard from '@/components/PropertyCard';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function meta() {
  return [
    { title: 'Search PGs | FindNearPG' },
    {
      name: 'description',
      content:
        'Search verified PGs by city, gender preference, and budget. Compare transparent rent and amenities quickly.',
    },
  ];
}

export default function SearchPage() {
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');
  const [budget, setBudget] = useState('');
  const [debouncedFilters, setDebouncedFilters] = useState({
    city: '',
    gender: '',
    budget: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setCity(searchParams.get('city') || '');
      setGender(searchParams.get('gender') || '');
      setBudget(searchParams.get('maxPrice') || '');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({ city, gender, budget });
    }, 300);
    return () => clearTimeout(timer);
  }, [city, gender, budget]);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['search-properties', debouncedFilters.city, debouncedFilters.gender, debouncedFilters.budget],
    queryFn: async () => {
      const params = new URLSearchParams({
        city: debouncedFilters.city,
        gender: debouncedFilters.gender,
        maxPrice: debouncedFilters.budget,
      });
      const url = `/api/properties?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });

  const clearFilters = () => {
    setCity('');
    setGender('');
    setBudget('');
  };
  const activeFilters = [
    city ? `City: ${city}` : '',
    gender ? `Gender: ${gender}` : '',
    budget ? `Budget: up to ₹${Number(budget).toLocaleString()}` : '',
  ].filter(Boolean);

  const resultsTitle = isLoading
    ? 'Searching PGs...'
    : `${properties?.length || 0} PGs found in ${city || 'All Cities'}`;

  const resultsGridContent = isLoading ? (
    [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div key={i} className="bg-gray-200 h-[400px] rounded-2xl animate-pulse" />
    ))
  ) : properties?.length === 0 ? (
    <div className="col-span-full rounded-[28px] border border-dashed border-gray-200 bg-white py-24 text-center sm:rounded-[40px] sm:py-32">
      <div className="w-20 h-20 bg-[#f1f9f9] rounded-full flex items-center justify-center mx-auto mb-6 text-[#0f8f8b]">
        <Search size={40} />
      </div>
      <h3 className="text-2xl font-extrabold text-[#073735] mb-2">No matching PGs found</h3>
      <p className="text-[#073735]/60 mb-8">
        Try adjusting your filters or searching in a different area.
      </p>
      <button
        type="button"
        onClick={() => {
          setCity('');
          setGender('');
          setBudget('');
        }}
        className="text-[#0f8f8b] font-bold hover:underline"
      >
        Clear all filters
      </button>
    </div>
  ) : (
    properties?.map((property) => <PropertyCard key={property.id} property={property} />)
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-4 sm:mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#073735] sm:text-3xl">
            Search PGs
          </h1>
          <p className="mt-1 text-sm text-[#073735]/65">
            Browse verified listings with live rent, room sharing, and review ratings.
          </p>
        </section>

        <div className="mb-6 rounded-2xl border border-[#dcefed] bg-white p-3 shadow-sm sm:mb-8 sm:p-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto] lg:items-center lg:gap-3">
            <div className="relative col-span-2 lg:col-span-1">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0f8f8b]"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by city or area..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-[#e5f2f1] bg-[#f8fffe] py-3 pl-11 pr-4 text-sm font-bold text-[#073735] focus:ring-2 focus:ring-[#0f8f8b]"
              />
            </div>

            <div className="relative">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="min-h-11 w-full cursor-pointer appearance-none rounded-2xl border border-[#d9ecea] bg-white px-3 py-2.5 pr-9 text-sm font-bold text-[#073735] shadow-sm outline-none transition-colors focus:border-[#0f8f8b] focus:ring-2 focus:ring-[#0f8f8b]/20 lg:px-4 lg:py-3"
              >
                <option value="">Any Gender</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="co-ed">Co-ed</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0f8f8b]"
              />
            </div>

            <div className="relative">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="min-h-11 w-full cursor-pointer appearance-none rounded-2xl border border-[#d9ecea] bg-white px-3 py-2.5 pr-9 text-sm font-bold text-[#073735] shadow-sm outline-none transition-colors focus:border-[#0f8f8b] focus:ring-2 focus:ring-[#0f8f8b]/20 lg:px-4 lg:py-3"
              >
                <option value="">Any Budget</option>
                <option value="5000">Under ₹5,000</option>
                <option value="10000">Under ₹10,000</option>
                <option value="15000">Under ₹15,000</option>
                <option value="20000">Under ₹20,000</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0f8f8b]"
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="col-span-2 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#e5f2f1] bg-white px-4 py-2.5 text-sm font-bold text-[#073735] hover:bg-[#f8fffe] lg:col-span-1"
            >
              <X size={16} className="text-[#0f8f8b]" />
              Clear
            </button>
          </div>

          {activeFilters.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full border border-[#cde7e5] bg-[#f8fffe] px-2.5 py-1 text-[11px] font-semibold text-[#073735]"
                >
                  {filter}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <h2 className="text-lg font-extrabold text-[#073735] sm:text-2xl">{resultsTitle}</h2>
          <div className="hidden items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#073735]/40 sm:flex">
            <span>Sort by:</span>
            <button type="button" className="text-[#0f8f8b] flex items-center">
              Relevance <ChevronDown size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resultsGridContent}
        </div>
      </main>

      {/* Mobile Filter Sidebar / Modal would go here */}

      <Footer />
    </div>
  );
}
