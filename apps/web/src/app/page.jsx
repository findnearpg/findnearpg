'use client';

import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import MetricsSection from '@/components/MetricsSection';
import PropertyCard from '@/components/PropertyCard';
import SearchWithFilters from '@/components/SearchWithFilters';
import TestimonialsSection from '@/components/TestimonialsSection';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Home, Shield, Utensils, Zap } from 'lucide-react';

const POPULAR_CITIES = [
  {
    city: 'Bengaluru',
    image:
      'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=900&q=80',
  },
  {
    city: 'Pune',
    image:
      'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=900&q=80',
  },
  {
    city: 'Hyderabad',
    image:
      'https://images.pexels.com/photos/26826170/pexels-photo-26826170.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    city: 'Mumbai',
    image:
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=900&q=80',
  },
  {
    city: 'Delhi',
    image:
      'https://images.unsplash.com/photo-1592639296346-560c37a0f711?auto=format&fit=crop&w=900&q=80',
  },
  {
    city: 'Chennai',
    image:
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=80',
  },
];

export function meta() {
  return [
    { title: 'FindNearPG - Best PG Listings in Bengaluru, Pune, Hyderabad & More' },
    {
      name: 'description',
      content:
        'Find verified PGs in Bengaluru, Pune, Hyderabad, Mumbai, Delhi, and Chennai. Compare amenities, pricing, and reviews. Fast search, trusted listings, and direct owner access.',
    },
    {
      name: 'keywords',
      content:
        'PG in Bengaluru, PG in Bangalore, PG near me, boys PG, girls PG, coliving, PG listings India',
    },
    { property: 'og:title', content: 'FindNearPG - Best PG Listings Across Top Indian Cities' },
    {
      property: 'og:description',
      content: 'Search verified PGs with real reviews, clear pricing, and easy city-wise browsing.',
    },
  ];
}

export default function HomePage() {
  const websiteJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FindNearPG',
    url: 'https://findnearpg.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://findnearpg.com/search?city={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  });
  const cityImageFallback =
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?auto=format&fit=crop&w=900&q=80';
  const { data: properties, isLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties?limit=6');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 2,
  });
  const { data: homeStats } = useQuery({
    queryKey: ['homepage-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/home/stats');
      if (!response.ok) throw new Error('Failed to fetch home stats');
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#eef9f8] via-white to-[#f5fbfb] pb-10 pt-6 sm:pb-20 sm:pt-16">
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[#0f8f8b]/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#073735]/10 blur-3xl sm:h-64 sm:w-64" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="mb-3 text-[42px] font-black leading-[1.05] tracking-tight text-[#073735] max-[360px]:text-[34px] sm:mb-4 sm:text-5xl lg:text-6xl">
              Find verified PGs in <span className="text-[#0f8f8b]">minutes</span>, not weeks.
            </h1>
            <p className="mb-5 max-w-2xl text-sm text-[#073735]/75 sm:mb-8 sm:text-lg">
              Search city-wise PG listings, compare essentials quickly, and connect directly with
              property owners.
            </p>

            <SearchWithFilters defaultCity="Bengaluru" />

            <div className="mt-4 flex flex-wrap gap-2 max-[360px]:gap-1.5">
              {['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai'].map((city) => (
                <a
                  key={city}
                  href={`/search?city=${encodeURIComponent(city)}`}
                  className="rounded-full border border-[#cde7e5] bg-white px-3 py-1 text-xs font-semibold text-[#073735] hover:border-[#0f8f8b] hover:text-[#0f8f8b] max-[360px]:px-2 max-[360px]:text-[11px]"
                >
                  {city}
                </a>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 max-[360px]:gap-2 sm:flex sm:flex-wrap">
              <a
                href="/search"
                className="text-center rounded-full bg-[#073735] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#052826] max-[360px]:px-4 max-[360px]:py-2"
              >
                View All Listings
              </a>
              <a
                href="/account/owner"
                className="text-center rounded-full border border-[#0f8f8b] px-5 py-2.5 text-sm font-bold text-[#0f8f8b] hover:bg-[#0f8f8b]/10 max-[360px]:px-4 max-[360px]:py-2"
              >
                Add Your Property
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:mt-8 sm:max-w-md sm:grid-cols-2 sm:gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                <Home size={16} className="text-[#0f8f8b]" />
                <div>
                  <p className="text-[13px] font-bold text-[#073735]">Verified PGs</p>
                  <p className="text-[11px] text-[#073735]/65">Checked listings</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
                <Zap size={16} className="text-[#0f8f8b]" />
                <div>
                  <p className="text-[13px] font-bold text-[#073735]">Fast Search</p>
                  <p className="text-[11px] text-[#073735]/65">City and area wise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-8 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-end justify-between sm:mb-12">
            <div>
              <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-[#073735] sm:text-4xl">
                Popular Cities
              </h2>
              <p className="max-w-md text-xs text-[#073735]/65 sm:text-base">
                Bengaluru (Bangalore) is listed once to avoid duplicate city names.
              </p>
            </div>
            <a
              href="/search"
              className="hidden items-center text-sm font-bold text-[#0f8f8b] md:flex"
            >
              View all cities <ChevronRight size={16} className="ml-1" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-[360px]:gap-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {POPULAR_CITIES.map((item) => (
              <a
                key={item.city}
                href={`/search?city=${encodeURIComponent(item.city)}`}
                className="group relative h-24 overflow-hidden rounded-xl bg-[#dcefee] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl sm:h-40 sm:rounded-2xl"
              >
                <img
                  src={item.image}
                  alt={`${item.city} PG listings`}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = cityImageFallback;
                  }}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#073735]/85 to-[#073735]/20" />
                <div className="absolute inset-x-0 bottom-2 text-center text-white sm:bottom-3">
                  <p className="text-xs font-bold sm:text-lg">{item.city}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-white/80 sm:text-[10px]">
                    {Number(homeStats?.cityCounts?.[item.city] || 0).toLocaleString()} properties
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5fbfb] px-4 py-8 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight text-[#073735] sm:text-4xl">
                Featured Listings
              </h2>
              <p className="max-w-md text-xs text-[#073735]/65 sm:text-base">
                Quality PG options picked from live listings.
              </p>
            </div>
            <a href="/search" className="hidden text-sm font-bold text-[#0f8f8b] md:inline-flex">
              Search all PGs
            </a>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-gray-200" />
                ))
              : properties?.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <MetricsSection />

      <section className="bg-white px-4 py-8 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 text-center text-2xl font-extrabold tracking-tight text-[#073735] sm:text-4xl">
            Why users choose <span className="text-[#0f8f8b]">FindNearPG</span>
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            <div className="rounded-2xl bg-[#f1f9f9] p-4 sm:rounded-3xl sm:p-6">
              <Shield className="mb-3 text-[#0f8f8b]" size={22} />
              <h3 className="mb-1.5 text-lg font-bold text-[#073735] sm:text-xl">
                Verified Listings
              </h3>
              <p className="text-xs text-[#073735]/70 sm:text-sm">
                Every listing is checked before publication.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f1f9f9] p-4 sm:rounded-3xl sm:p-6">
              <Utensils className="mb-3 text-[#0f8f8b]" size={22} />
              <h3 className="mb-1.5 text-lg font-bold text-[#073735] sm:text-xl">
                Clear Amenities
              </h3>
              <p className="text-xs text-[#073735]/70 sm:text-sm">
                Food, room type, and essentials are clearly listed.
              </p>
            </div>
            <div className="rounded-2xl bg-[#f1f9f9] p-4 sm:rounded-3xl sm:p-6">
              <Zap className="mb-3 text-[#0f8f8b]" size={22} />
              <h3 className="mb-1.5 text-lg font-bold text-[#073735] sm:text-xl">Direct Contact</h3>
              <p className="text-xs text-[#073735]/70 sm:text-sm">
                Reach out faster and decide confidently.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-4 mb-8 overflow-hidden rounded-[24px] bg-[#073735] px-4 py-7 sm:mx-6 sm:mb-20 sm:rounded-[42px] sm:px-8 sm:py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="mb-2 text-2xl font-extrabold leading-tight text-white sm:text-4xl">
              Are you a PG Owner?
            </h2>
            <p className="text-sm text-white/80 sm:text-base">
              Add your property, manage listing visibility, and get quality tenant leads.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
              <a
                href="/account/owner"
                className="text-center rounded-full bg-[#0f8f8b] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0c6764]"
              >
                Add Your Property
              </a>
              <a
                href="mailto:support@findnearpg.com?subject=PG%20Owner%20Support"
                className="text-center rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                Contact Sales
              </a>
            </div>
          </div>
          <a
            href="/search"
            className="inline-flex h-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20"
          >
            Search Live PG Listings
            <ChevronRight size={16} />
          </a>
        </div>
      </section>

      <FAQSection />
      <Footer />

      <script type="application/ld+json">{websiteJsonLd}</script>
    </div>
  );
}
