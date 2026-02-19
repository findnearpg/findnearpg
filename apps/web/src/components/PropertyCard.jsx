import { Coffee, MapPin, ShieldCheck, Star, Wifi } from 'lucide-react';

export default function PropertyCard({ property }) {
  const {
    title,
    city,
    area,
    price,
    amenities,
    gender_allowed,
    sharing,
    images,
    slug,
    review_average,
    review_count,
  } = property;
  const sharingLabel =
    sharing === '1'
      ? '1 Sharing'
      : sharing === '2'
        ? '2 Sharing'
        : sharing === '3'
          ? '3 Sharing'
          : sharing === 'all123'
            ? '1/2/3 Sharing'
            : 'Sharing NA';

  const ratingValue = Number(review_average || 0);
  const reviewCount = Number(review_count || 0);

  return (
    <div className="group mx-auto flex h-full w-full max-w-[380px] flex-col overflow-hidden rounded-xl border border-[#ECECEC] bg-gradient-to-br from-white to-[#f8fffe] transition-all duration-300 hover:scale-[1.01] hover:border-[#0f8f8b]/30 hover:shadow-lg hover:shadow-[#0f8f8b]/10 sm:max-w-none sm:rounded-2xl sm:hover:scale-105 sm:hover:shadow-2xl sm:hover:shadow-[#0f8f8b]/15">
      {/* Image Gallery Preview */}
      <div className="relative aspect-[2/1] overflow-hidden sm:aspect-[4/3]">
        <img
          src={
            images?.[0] ||
            'https://images.unsplash.com/photo-1522771739844-649f43921f01?auto=format&fit=crop&q=80&w=800'
          }
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          <div
            className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider sm:px-3 sm:text-[10px] ${
              gender_allowed === 'boys'
                ? 'bg-blue-500 text-white'
                : gender_allowed === 'girls'
                  ? 'bg-pink-500 text-white'
                  : 'bg-purple-500 text-white'
            }`}
          >
            {gender_allowed} Only
          </div>
          <div className="rounded-full bg-[#0f8f8b] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white sm:px-3 sm:text-[10px]">
            {sharingLabel}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        <div className="mb-1 flex items-center text-[9px] font-bold uppercase tracking-widest text-[#0f8f8b] sm:mb-2 sm:text-[10px]">
          <MapPin size={12} className="mr-1" />
          {area}, {city}
        </div>

        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
          <h3 className="line-clamp-1 min-w-0 text-base font-bold text-[#073735] transition-colors group-hover:text-[#0f8f8b] sm:text-lg">
            {title}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-[#073735] sm:px-2 sm:py-1 sm:text-xs">
            <Star size={11} className="fill-amber-400 text-amber-400 sm:h-3 sm:w-3" />
            {reviewCount > 0 ? `${ratingValue.toFixed(1)} (${reviewCount})` : '0.0 (0)'}
          </span>
        </div>

        {/* Mini Amenities */}
        <div className="mb-3 flex items-center space-x-2.5 text-[#073735]/60 sm:mb-4 sm:space-x-4">
          <div className="flex items-center space-x-1">
            <Wifi size={14} />
            <span className="text-[11px] sm:text-xs">WiFi</span>
          </div>
          <div className="flex items-center space-x-1">
            <Coffee size={14} />
            <span className="text-[11px] sm:text-xs">Food</span>
          </div>
          <div className="flex items-center space-x-1">
            <ShieldCheck size={14} />
            <span className="text-[11px] sm:text-xs">Secure</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 sm:pt-4">
          <div>
            <span className="text-xs text-[#073735]/60 sm:text-sm">Starts from</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-extrabold text-[#0f8f8b] sm:text-xl">
                ₹{Number.parseFloat(price).toLocaleString()}
              </span>
              <span className="text-[11px] text-[#073735]/60 sm:text-xs">/mo</span>
            </div>
          </div>
          <a
            href={`/pg/${slug}`}
            className="rounded-xl bg-[#0f8f8b] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-[#0f8f8b]/20 transition-all hover:bg-[#0c6764] sm:px-5 sm:py-2.5 sm:text-xs"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
}
