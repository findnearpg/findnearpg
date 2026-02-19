import { Star } from 'lucide-react';

export default function TestimonialCard({ review }) {
  const {
    rating = 5,
    comment = '',
    user_name = 'Anonymous',
    property_title = 'Luxury PG',
  } = review || {};

  // Render stars
  const stars = [1, 2, 3, 4, 5].map((star) => (
    <Star
      key={star}
      size={14}
      className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
    />
  ));

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[#e7f4f3] bg-gradient-to-br from-white to-[#f8fffe] p-4 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:border-[#0f8f8b]/30 hover:shadow-md hover:shadow-[#0f8f8b]/10 sm:rounded-2xl sm:p-6 sm:hover:scale-105 sm:hover:shadow-lg sm:hover:shadow-[#0f8f8b]/15">
      {/* Quote mark decoration */}
      <div className="absolute right-3 top-3 text-3xl font-extrabold text-[#0f8f8b] opacity-10 sm:right-4 sm:top-4 sm:text-4xl">
        "
      </div>

      {/* Stars */}
      <div className="mb-2.5 flex items-center gap-1">{stars}</div>

      {/* Comment */}
      <p className="mb-3.5 flex-1 text-xs leading-relaxed text-[#073735]/80 line-clamp-3 sm:text-sm">
        {comment || 'Great experience! Would definitely recommend this PG to everyone.'}
      </p>

      {/* Divider */}
      <div className="mb-3 h-px bg-gradient-to-r from-[#e7f4f3] to-transparent sm:mb-4" />

      {/* User Info */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#073735] sm:text-sm">
            {user_name}
          </p>
          <p className="truncate text-[11px] text-[#073735]/60 sm:text-xs">{property_title}</p>
        </div>
        <div className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0f8f8b] to-[#073735] text-[11px] font-bold text-white sm:h-10 sm:w-10 sm:text-xs">
          {user_name.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
