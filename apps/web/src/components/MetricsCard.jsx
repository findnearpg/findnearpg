import { useEffect, useState } from 'react';

/**
 * MetricsCard - Displays a single metric with animated counter
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {number} props.value - Final value to animate to
 * @param {string} props.label - Label text
 * @param {string} props.suffix - Optional suffix (e.g., "+", "k")
 * @param {boolean} props.animateOnce - Trigger animation once visible
 */
export default function MetricsCard({ icon: Icon, value, label, suffix = '', animateOnce = true }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animateOnce) return;

    let start = 0;
    const duration = 1500; // 1.5 seconds
    const increment = value / (duration / 16); // 60fps
    let animationFrameId;

    const animate = () => {
      start += increment;
      if (start < value) {
        setDisplayValue(Math.floor(start));
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, animateOnce]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e7f4f3] bg-gradient-to-br from-white to-[#f8fffe] p-4 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:border-[#0f8f8b]/30 hover:shadow-md hover:shadow-[#0f8f8b]/10 sm:rounded-3xl sm:p-8 sm:hover:scale-105 sm:hover:shadow-lg">
      {/* Accent border on left */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#0f8f8b] to-[#0f8f8b]/30" />

      {/* Icon */}
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f8f8b]/10 text-[#0f8f8b] transition-all duration-300 group-hover:bg-[#0f8f8b] group-hover:text-white sm:mb-4 sm:h-12 sm:w-12 sm:rounded-xl">
        <Icon size={18} />
      </div>

      {/* Value */}
      <div className="mb-1.5 flex items-baseline space-x-1 sm:mb-2">
        <span className="text-2xl font-extrabold text-[#073735] sm:text-4xl">
          {displayValue.toLocaleString()}
        </span>
        <span className="text-base font-bold text-[#0f8f8b] sm:text-xl">{suffix}</span>
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-[#073735]/70 sm:text-base">{label}</p>
    </div>
  );
}
