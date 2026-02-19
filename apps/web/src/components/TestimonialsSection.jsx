import { useIntersectionObserver } from '@/__create/useIntersectionObserver';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TestimonialCard from './TestimonialCard';

export default function TestimonialsSection() {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['featured-testimonials'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/reviews?limit=12&minRating=4');
        if (!response.ok) return [];
        const data = await response.json();
        return (data.items || data).slice(0, 5);
      } catch (error) {
        console.error('Testimonials fetch error:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 45, // 45 minutes garbage collection
    refetchOnWindowFocus: false,
  });

  const displayedTestimonials = testimonials.slice(0, 4);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (!isVisible || displayedTestimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayedTestimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, displayedTestimonials.length]);

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + displayedTestimonials.length) % displayedTestimonials.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayedTestimonials.length);
  };

  return (
    <section
      ref={ref}
      className={`bg-[#f8fffe] px-4 py-10 sm:px-6 sm:py-24 md:py-32 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-6 flex flex-col justify-between md:mb-16 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-[#073735] sm:mb-4 sm:text-4xl">
              What Users Say
            </h2>
            <p className="max-w-md text-xs text-[#073735]/60 sm:text-base">
              Real experiences from real users who found their perfect PG on FindNearPG.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 md:mt-0">
            <button
              type="button"
              onClick={handlePrev}
              className="group relative h-9 w-9 rounded-full border border-[#0f8f8b]/30 bg-white text-[#0f8f8b] shadow-sm hover:bg-[#0f8f8b] hover:text-white transition-all sm:h-10 sm:w-10"
              aria-label="Previous testimonial"
            >
              <ChevronLeft
                size={20}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="group relative h-9 w-9 rounded-full border border-[#0f8f8b]/30 bg-white text-[#0f8f8b] shadow-sm hover:bg-[#0f8f8b] hover:text-white transition-all sm:h-10 sm:w-10"
              aria-label="Next testimonial"
            >
              <ChevronRight
                size={20}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div
          ref={scrollRef}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {isLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
              ))
            : displayedTestimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
                  }}
                >
                  <TestimonialCard review={testimonial} />
                </div>
              ))}
          {!isLoading && displayedTestimonials.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-[#d7ecea] bg-white p-6 text-center text-sm text-[#073735]/70">
              No public reviews yet. Reviews will appear here as soon as guests submit them.
            </div>
          ) : null}
        </div>

        {/* Carousel Indicators */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {displayedTestimonials.map((testimonial, index) => (
            <button
              type="button"
              key={testimonial.id}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-[#0f8f8b]'
                  : 'w-2 bg-[#0f8f8b]/30 hover:bg-[#0f8f8b]/60'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
