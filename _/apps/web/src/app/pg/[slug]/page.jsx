"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Star,
  MapPin,
  Wifi,
  Coffee,
  ShieldCheck,
  Check,
  Clock,
  Users,
  ArrowLeft,
  Phone,
  Share2,
  Heart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PropertyDetailPage({ params }) {
  const { slug } = params;
  const [selectedRoom, setSelectedRoom] = useState("Single Sharing");

  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property", slug],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${slug}`);
      if (!response.ok) throw new Error("Property not found");
      return response.json();
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) throw new Error("Booking failed");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Booking request sent! Our team will contact you shortly.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to book");
    },
  });

  const handleBookNow = () => {
    // In a real app, we'd get userId from auth context
    bookingMutation.mutate({
      userId: 1, // Placeholder
      propertyId: property.id,
      roomType: selectedRoom,
      amount: property.price,
    });
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="p-20 text-center">Loading...</div>
      </div>
    );
  if (error || !property)
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="p-20 text-center">Property not found.</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Navigation / Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-[#073735]/60 hover:text-[#0f8f8b] font-semibold transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to listings</span>
          </button>
          <div className="flex items-center space-x-4">
            <button className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm hover:text-red-500 transition-colors">
              <Heart size={20} />
            </button>
            <button className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm hover:text-[#0f8f8b] transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left: Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={
                    property.images?.[0] ||
                    "https://images.unsplash.com/photo-1522771739844-649f43921f01?auto=format&fit=crop&q=80&w=1200"
                  }
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={
                        property.images?.[0] ||
                        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=300"
                      }
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Title and Info */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <div className="px-3 py-1 bg-[#f1f9f9] text-[#0f8f8b] text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Verified Property
                </div>
                <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  <Star size={10} className="fill-current" />
                  <span>4.8 (124 reviews)</span>
                </div>
              </div>

              <h1 className="text-4xl font-extrabold text-[#073735] mb-4 tracking-tight">
                {property.title}
              </h1>

              <div className="flex items-center text-[#073735]/60 mb-8">
                <MapPin size={18} className="mr-2 text-[#0f8f8b]" />
                <span className="font-medium text-lg">
                  {property.area}, {property.city}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      Gender
                    </div>
                    <div className="font-bold text-[#073735] capitalize">
                      {property.gender_allowed}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      WiFi
                    </div>
                    <div className="font-bold text-[#073735]">High Speed</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      Food
                    </div>
                    <div className="font-bold text-[#073735]">3 Meals</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      Security
                    </div>
                    <div className="font-bold text-[#073735]">24/7 CCTV</div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-xl font-bold text-[#073735] mb-4">
                  About this PG
                </h3>
                <p className="text-[#073735]/70 leading-relaxed">
                  {property.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-[#073735] mb-8">
                What this place offers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                {[
                  "High-speed Internet",
                  "Daily Cleaning",
                  "Organic Food",
                  "Gym Access",
                  "24/7 Power Backup",
                  "Laundry Service",
                  "CCTV Surveillance",
                  "Lounge Area",
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                      <Check size={14} />
                    </div>
                    <span className="text-[#073735]/70 font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sidebar Sticky Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-[#073735]/5 border border-gray-100">
                <div className="flex items-baseline space-x-2 mb-8">
                  <span className="text-4xl font-extrabold text-[#0f8f8b]">
                    ₹{parseFloat(property.price).toLocaleString()}
                  </span>
                  <span className="text-[#073735]/40 font-bold uppercase tracking-widest text-xs">
                    / per month
                  </span>
                </div>

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-[#073735]/40 uppercase tracking-widest mb-3">
                      Room Type
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "Single Sharing",
                        "Double Sharing",
                        "Triple Sharing",
                      ].map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedRoom(type)}
                          className={`w-full py-4 px-6 rounded-2xl border-2 transition-all text-left font-bold ${
                            selectedRoom === type
                              ? "border-[#0f8f8b] bg-[#f1f9f9] text-[#0f8f8b]"
                              : "border-gray-100 bg-gray-50 text-[#073735]/40 hover:border-gray-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBookNow}
                  disabled={bookingMutation.isPending}
                  className="w-full bg-[#0f8f8b] hover:bg-[#0c6764] text-white font-extrabold text-lg py-5 rounded-full shadow-xl shadow-[#0f8f8b]/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {bookingMutation.isPending ? "Booking..." : "Book Now"}
                </button>

                <p className="text-center text-[#073735]/40 text-xs mt-6 font-medium">
                  Free cancellation within 24 hours of moving in.
                </p>
              </div>

              {/* Owner Card */}
              <div className="bg-[#073735] p-8 rounded-[40px] text-white">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-14 h-14 bg-[#0f8f8b] rounded-full flex items-center justify-center font-bold text-xl">
                    JS
                  </div>
                  <div>
                    <div className="font-bold text-lg">John Smith</div>
                    <div className="text-white/60 text-sm">
                      Owner since 2021
                    </div>
                  </div>
                </div>
                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-3">
                  <Phone size={18} />
                  <span>Call Owner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
