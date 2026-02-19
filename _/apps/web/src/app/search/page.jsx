"use client";

import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SearchPage() {
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [budget, setBudget] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setCity(searchParams.get("city") || "");
      setGender(searchParams.get("gender") || "");
      setBudget(searchParams.get("maxPrice") || "");
    }
  }, []);

  const {
    data: properties,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["search-properties", city, gender, budget],
    queryFn: async () => {
      let url = `/api/properties?city=${city}&gender=${gender}&maxPrice=${budget}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  useEffect(() => {
    refetch();
  }, [city, gender, budget, refetch]);

  const resultsTitle = isLoading
    ? "Searching..."
    : `${properties?.length || 0} PGs found in ${city || "All Cities"}`;

  const resultsGridContent = isLoading ? (
    [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="bg-gray-200 h-[400px] rounded-2xl animate-pulse"
      ></div>
    ))
  ) : properties?.length === 0 ? (
    <div className="col-span-full py-32 text-center bg-white rounded-[40px] border border-dashed border-gray-200">
      <div className="w-20 h-20 bg-[#f1f9f9] rounded-full flex items-center justify-center mx-auto mb-6 text-[#0f8f8b]">
        <Search size={40} />
      </div>
      <h3 className="text-2xl font-extrabold text-[#073735] mb-2">
        No matching PGs found
      </h3>
      <p className="text-[#073735]/60 mb-8">
        Try adjusting your filters or searching in a different area.
      </p>
      <button
        onClick={() => {
          setCity("");
          setGender("");
          setBudget("");
        }}
        className="text-[#0f8f8b] font-bold hover:underline"
      >
        Clear all filters
      </button>
    </div>
  ) : (
    properties?.map((property) => (
      <PropertyCard key={property.id} property={property} />
    ))
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Header */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 relative">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0f8f8b]"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by city or area..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#0f8f8b] font-bold text-[#073735]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#0f8f8b] font-bold text-[#073735] appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="">Any Gender</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="co-ed">Co-ed</option>
              </select>

              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#0f8f8b] font-bold text-[#073735] appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="">Any Budget</option>
                <option value="5000">Under ₹5,000</option>
                <option value="10000">Under ₹10,000</option>
                <option value="15000">Under ₹15,000</option>
                <option value="20000">Under ₹20,000</option>
              </select>

              <button
                onClick={() => setIsFilterOpen(true)}
                className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm flex items-center space-x-2"
              >
                <SlidersHorizontal size={20} className="text-[#0f8f8b]" />
                <span className="font-bold text-[#073735] hidden sm:inline">
                  More Filters
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-[#073735]">
            {resultsTitle}
          </h2>
          <div className="flex items-center space-x-2 text-[#073735]/40 font-bold uppercase tracking-widest text-xs">
            <span>Sort by:</span>
            <button className="text-[#0f8f8b] flex items-center">
              Relevance <ChevronDown size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {resultsGridContent}
        </div>
      </main>

      {/* Mobile Filter Sidebar / Modal would go here */}

      <Footer />
    </div>
  );
}
