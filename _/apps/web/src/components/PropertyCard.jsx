import { Star, MapPin, Users, Wifi, Coffee, ShieldCheck } from "lucide-react";

export default function PropertyCard({ property }) {
  const { title, city, area, price, amenities, gender_allowed, images, slug } =
    property;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-[#ECECEC] hover:border-[#0f8f8b]/30 hover:shadow-2xl hover:shadow-[#0f8f8b]/10 transition-all duration-300 flex flex-col h-full">
      {/* Image Gallery Preview */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={
            images?.[0] ||
            "https://images.unsplash.com/photo-1522771739844-649f43921f01?auto=format&fit=crop&q=80&w=800"
          }
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              gender_allowed === "boys"
                ? "bg-blue-500 text-white"
                : gender_allowed === "girls"
                  ? "bg-pink-500 text-white"
                  : "bg-purple-500 text-white"
            }`}
          >
            {gender_allowed} Only
          </div>
        </div>
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold text-[#073735]">4.8</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center text-[#0f8f8b] text-[10px] font-bold uppercase tracking-widest mb-2">
          <MapPin size={12} className="mr-1" />
          {area}, {city}
        </div>

        <h3 className="font-bold text-lg text-[#073735] mb-3 group-hover:text-[#0f8f8b] transition-colors line-clamp-1">
          {title}
        </h3>

        {/* Mini Amenities */}
        <div className="flex items-center space-x-4 mb-4 text-[#073735]/60">
          <div className="flex items-center space-x-1">
            <Wifi size={14} />
            <span className="text-xs">WiFi</span>
          </div>
          <div className="flex items-center space-x-1">
            <Coffee size={14} />
            <span className="text-xs">Food</span>
          </div>
          <div className="flex items-center space-x-1">
            <ShieldCheck size={14} />
            <span className="text-xs">Secure</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-sm text-[#073735]/60">Starts from</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold text-[#0f8f8b]">
                ₹{parseFloat(price).toLocaleString()}
              </span>
              <span className="text-xs text-[#073735]/60">/mo</span>
            </div>
          </div>
          <a
            href={`/pg/${slug}`}
            className="bg-[#0f8f8b] hover:bg-[#0c6764] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#0f8f8b]/20"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
}
