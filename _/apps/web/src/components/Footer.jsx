import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#073735] text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0f8f8b] rounded-lg flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter">
                FindNear<span className="text-[#0f8f8b]">PG</span>
              </span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              FindNearPG is India's leading PG discovery and booking platform.
              We help students and professionals find safe, comfortable, and
              affordable accommodation.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-[#0f8f8b] rounded-full transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-[#0f8f8b] rounded-full transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-[#0f8f8b] rounded-full transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="p-2 bg-white/10 hover:bg-[#0f8f8b] rounded-full transition-colors"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-[#0f8f8b]">Company</h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Sitemap
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-[#0f8f8b]">Support</h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Booking Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Owner Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-[#0f8f8b]">
              Get in Touch
            </h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-center space-x-3">
                <Phone size={16} className="text-[#0f8f8b]" />
                <span>+91 123 456 7890</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={16} className="text-[#0f8f8b]" />
                <span>support@findnearpg.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin size={16} className="text-[#0f8f8b]" />
                <span>123, Koramangala, Bangalore, Karnataka</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 text-center text-white/40 text-xs">
          <p>
            © {new Date().getFullYear()} FindNearPG Platform. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
