import { ChevronDown, Search, User, MapPin } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Slim utility bar */}
      <div className="w-full h-8 bg-[#073735] text-white flex items-center justify-center px-4">
        <div className="text-center text-[10px] sm:text-xs font-medium">
          <span>Find your perfect PG today in Bangalore! 🏠 </span>
          <a
            href="#"
            className="underline hover:text-[#0f8f8b] transition-colors ml-1"
          >
            Browse now
          </a>
        </div>
      </div>

      {/* Main sticky header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#ECECEC] backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#0f8f8b] rounded-xl flex items-center justify-center shadow-lg shadow-[#0f8f8b]/20">
                <MapPin className="text-white" size={20} />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-[#073735]">
                FindNear<span className="text-[#0f8f8b]">PG</span>
              </span>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="/"
                className="font-semibold text-sm text-[#073735] hover:text-[#0f8f8b] transition-colors"
              >
                Home
              </a>
              <div className="relative group">
                <button className="flex items-center font-semibold text-sm text-[#073735] group-hover:text-[#0f8f8b] transition-colors">
                  Cities
                  <ChevronDown size={14} className="ml-1" />
                </button>
                {/* Dropdown would go here */}
              </div>
              <a
                href="#"
                className="font-semibold text-sm text-[#073735] hover:text-[#0f8f8b] transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="font-semibold text-sm text-[#073735] hover:text-[#0f8f8b] transition-colors"
              >
                List Your PG
              </a>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center space-x-4">
              <button className="hidden sm:flex items-center space-x-1 font-semibold text-sm text-[#073735] hover:text-[#0f8f8b] transition-colors">
                <User size={18} />
                <span>Login</span>
              </button>
              <button className="bg-[#0f8f8b] hover:bg-[#0c6764] text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-[#0f8f8b]/30 transition-all transform hover:scale-105 active:scale-95">
                Sign Up
              </button>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-[#073735]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div
                  className={`w-6 h-0.5 bg-current mb-1.5 transition-all ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-current mb-1.5 transition-all ${isMenuOpen ? "opacity-0" : ""}`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-current transition-all ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-6 space-y-4 animate-in slide-in-from-top duration-300">
            <a href="/" className="block font-semibold text-[#073735]">
              Home
            </a>
            <a href="#" className="block font-semibold text-[#073735]">
              Browse PGs
            </a>
            <a href="#" className="block font-semibold text-[#073735]">
              List Your PG
            </a>
            <a href="#" className="block font-semibold text-[#073735]">
              Support
            </a>
          </div>
        )}
      </header>
    </>
  );
}
