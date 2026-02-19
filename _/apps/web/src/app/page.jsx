"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import {
  Search,
  MapPin,
  ChevronRight,
  Home,
  Shield,
  Utensils,
  Zap,
} from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [searchCity, setSearchCity] = useState("Bangalore");

  const handleSearch = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/search?city=${encodeURIComponent(searchCity)}`;
    }
  };

  const { data: properties, isLoading } = useQuery({
    queryKey: ["featured-properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties?limit=6");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-br from-[#f1f9f9] to-white">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#0f8f8b]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#0f8f8b]/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-[#073735] leading-[1.1] tracking-tight mb-8">
              Find your{" "}
              <span className="text-[#0f8f8b] relative">
                home away from home
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="#0f8f8b"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-xl text-[#073735]/70 mb-12 leading-relaxed max-w-xl">
              Discover and book verified PGs with ease. Transparent pricing,
              secure payments, and a community of happy tenants.
            </p>

            {/* Search Bar */}
            <div className="bg-white p-2 rounded-3xl shadow-2xl shadow-[#073735]/10 border border-gray-100 flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
              <div className="flex-1 flex items-center px-4 w-full">
                <MapPin className="text-[#0f8f8b] mr-3" size={20} />
                <input
                  type="text"
                  placeholder="Enter city or area..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full py-4 text-lg font-medium text-[#073735] placeholder:text-[#073735]/30 focus:outline-none"
                />
              </div>
              <div className="hidden sm:block w-[1px] h-10 bg-gray-200"></div>
              <button
                onClick={handleSearch}
                className="w-full sm:w-auto bg-[#0f8f8b] hover:bg-[#0c6764] text-white font-bold text-lg px-8 py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <Search size={20} />
                <span>Search PG</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Home className="text-[#0f8f8b]" size={20} />
                </div>
                <div>
                  <div className="font-bold text-[#073735]">2,500+</div>
                  <div className="text-xs text-[#073735]/60">Verified PGs</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Zap className="text-[#0f8f8b]" size={20} />
                </div>
                <div>
                  <div className="font-bold text-[#073735]">10k+</div>
                  <div className="text-xs text-[#073735]/60">Happy Tenants</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <h2 className="text-4xl font-extrabold text-[#073735] mb-4 tracking-tight">
                Popular Cities
              </h2>
              <p className="text-[#073735]/60 max-w-md">
                Find accommodations in India's top education and tech hubs.
              </p>
            </div>
            <button className="hidden md:flex items-center text-[#0f8f8b] font-bold hover:translate-x-1 transition-transform">
              View all cities <ChevronRight size={18} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              "Bangalore",
              "Pune",
              "Hyderabad",
              "Mumbai",
              "Delhi",
              "Chennai",
            ].map((city) => (
              <a
                key={city}
                href={`/search?city=${city}`}
                className="group relative h-40 rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm hover:shadow-xl transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#073735]/80 to-transparent"></div>
                <div className="relative z-10 text-center">
                  <div className="font-bold text-white text-lg group-hover:scale-110 transition-transform">
                    {city}
                  </div>
                  <div className="text-[10px] text-white/70 uppercase tracking-widest font-bold">
                    150+ Properties
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured PGs */}
      <section className="py-24 px-6 bg-[#f1f9f9]/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <h2 className="text-4xl font-extrabold text-[#073735] mb-4 tracking-tight">
                Featured Listings
              </h2>
              <p className="text-[#073735]/60 max-w-md">
                Our hand-picked selections based on amenities and reviews.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 h-[400px] rounded-2xl animate-pulse"
                  ></div>
                ))
              : properties?.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#073735] mb-6 tracking-tight">
              Why Choose <span className="text-[#0f8f8b]">FindNearPG?</span>
            </h2>
            <p className="text-lg text-[#073735]/60 max-w-2xl mx-auto">
              We've redesigned the PG discovery experience to be transparent,
              secure, and hassle-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Feature 1 */}
            <div className="bg-[#f1f9f9] p-10 rounded-[40px] relative overflow-hidden group">
              <div className="w-16 h-16 bg-[#0f8f8b] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#0f8f8b]/20 text-white">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#073735] mb-4">
                Verified Listings
              </h3>
              <p className="text-[#073735]/60 leading-relaxed">
                Every PG on our platform undergoes a strict 50-point physical
                verification process before going live.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#f1f9f9] p-10 rounded-[40px] relative overflow-hidden group">
              <div className="w-16 h-16 bg-[#0f8f8b] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#0f8f8b]/20 text-white">
                <Utensils size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#073735] mb-4">
                Quality Food
              </h3>
              <p className="text-[#073735]/60 leading-relaxed">
                Check detailed meal plans and food reviews before you move in.
                Hygiene is our top priority.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#f1f9f9] p-10 rounded-[40px] relative overflow-hidden group">
              <div className="w-16 h-16 bg-[#0f8f8b] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#0f8f8b]/20 text-white">
                <zap size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#073735] mb-4">
                Zero Brokerage
              </h3>
              <p className="text-[#073735]/60 leading-relaxed">
                Book directly from owners. No hidden costs or heavy commissions.
                Save big on your relocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Owner CTA Section */}
      <section className="py-24 px-6 bg-[#073735] rounded-[60px] mx-6 mb-24 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#0f8f8b]/20 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between relative z-10">
          <div className="lg:max-w-2xl text-center lg:text-left mb-12 lg:mb-0">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Are you a PG Owner? <br />
              <span className="text-[#0f8f8b]">
                Grow your business with us.
              </span>
            </h2>
            <p className="text-xl text-white/70 mb-10 leading-relaxed">
              Join 5,000+ owners who have scaled their occupancy using our smart
              listing and booking management tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="w-full sm:w-auto bg-[#0f8f8b] hover:bg-[#0c6764] text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl shadow-black/20 transition-all transform hover:scale-105 active:scale-95">
                List Your Property
              </button>
              <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-10 py-5 rounded-full backdrop-blur-md transition-all">
                Contact Sales
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-md">
            {/* Decorative Mockup or Illustration */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 shadow-2xl">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-[#0f8f8b] rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-32 h-2 bg-white/20 rounded"></div>
                  <div className="w-20 h-2 bg-white/10 rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-white/5 rounded-2xl"></div>
                <div className="h-24 bg-white/5 rounded-2xl"></div>
                <div className="h-24 bg-white/5 rounded-2xl"></div>
                <div className="h-24 bg-white/5 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
