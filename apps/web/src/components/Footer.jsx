import { Mail, MapPin, Phone } from 'lucide-react';

const CITIES = ['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Delhi', 'Chennai', 'Noida', 'Kolkata'];

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#073735] bg-gradient-to-b from-[#073735] to-[#062c2a] px-4 pb-6 pt-8 text-white sm:px-6 sm:pb-8 sm:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-5 border-b border-white/10 pb-6 sm:pb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 space-y-3 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f8f8b]">
                <MapPin size={16} />
              </div>
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">
                FindNear<span className="text-[#0f8f8b]">PG</span>
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-white/75 sm:text-sm">
              Find verified PGs with transparent pricing, direct owner access, and easier booking
              decisions.
            </p>
            <ul className="space-y-1.5 text-xs text-white/80 sm:text-sm">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-[#0f8f8b]" />
                +91 123 456 7890
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-[#0f8f8b]" />
                findnearpg@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-[#0f8f8b]" />
                Bengaluru, Karnataka
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-[#0f8f8b] sm:mb-4 sm:text-base">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs text-white/75 sm:space-y-2 sm:text-sm">
              <li>
                <a href="/" className="transition-colors hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/search" className="transition-colors hover:text-white">
                  Search PGs
                </a>
              </li>
              <li>
                <a href="/account/owner" className="transition-colors hover:text-white">
                  Add Your Property
                </a>
              </li>
              <li>
                <a href="/#faq" className="transition-colors hover:text-white">
                  FAQs
                </a>
              </li>
              <li>
                <a href="/dashboard/owner/help" className="transition-colors hover:text-white">
                  Owner Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-[#0f8f8b] sm:mb-4 sm:text-base">Policies</h4>
            <ul className="space-y-1.5 text-xs text-white/75 sm:space-y-2 sm:text-sm">
              <li>
                <a href="/privacy-policy" className="transition-colors hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="transition-colors hover:text-white">
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="transition-colors hover:text-white">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="mb-3 text-sm font-bold text-[#0f8f8b] sm:mb-4 sm:text-base">
              Popular Cities
            </h4>
            <div className="grid grid-cols-3 gap-1.5 text-xs text-white/75 sm:grid-cols-2 sm:gap-2 sm:text-sm">
              {CITIES.map((city) => (
                <a
                  key={city}
                  href={`/search?city=${encodeURIComponent(city)}`}
                  className="transition-colors hover:text-white"
                >
                  {city}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-[11px] text-white/50 sm:mt-6 sm:text-xs">
          © {new Date().getFullYear()} FindNearPG. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
