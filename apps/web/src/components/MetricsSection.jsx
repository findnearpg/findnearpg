import { useIntersectionObserver } from '@/__create/useIntersectionObserver';
import { useQuery } from '@tanstack/react-query';
import { Building2, Globe, TrendingUp, Users } from 'lucide-react';
import MetricsCard from './MetricsCard';

export default function MetricsSection() {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });

  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['homepage-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/home/stats');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes garbage collection
    refetchOnWindowFocus: false,
  });

  const totalProperties = Number(metricsData?.totals?.properties || 0);
  const verifiedOwners = Number(metricsData?.totals?.owners || 0);
  const happyTenants = Number(metricsData?.totals?.users || 0);
  const cities = Number(metricsData?.totals?.citiesCovered || 0);

  const metrics = [
    {
      icon: Building2,
      value: totalProperties,
      label: 'Total Properties',
      suffix: '',
    },
    {
      icon: Users,
      value: verifiedOwners,
      label: 'Verified Owners',
      suffix: '',
    },
    {
      icon: TrendingUp,
      value: happyTenants,
      label: 'Happy Tenants',
      suffix: '',
    },
    {
      icon: Globe,
      value: cities,
      label: 'Cities Covered',
      suffix: '',
    },
  ];

  return (
    <section
      ref={ref}
      className={`bg-white px-4 py-10 sm:px-6 sm:py-24 md:py-32 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-6 text-center sm:mb-16">
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-[#073735] sm:mb-6 sm:text-4xl md:text-5xl">
            Best Place <span className="text-[#0f8f8b]">Listings</span>
          </h2>
          <p className="mx-auto max-w-2xl text-xs text-[#073735]/60 sm:text-lg">
            Browse trusted PG options with verified owners, active listings, and strong renter
            demand.
          </p>
          <a
            href="/account/owner"
            className="mt-4 inline-flex rounded-full bg-[#0f8f8b] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#0f8f8b]/30 transition-all hover:scale-105 hover:bg-[#0c6764] active:scale-95 sm:mt-6 sm:px-6 sm:py-3"
          >
            Add Your Property
          </a>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-gray-200 rounded-3xl animate-pulse" />
              ))
            : metrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={`transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
                  }}
                >
                  <MetricsCard
                    icon={metric.icon}
                    value={metric.value}
                    label={metric.label}
                    suffix={metric.suffix}
                    animateOnce={isVisible}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
