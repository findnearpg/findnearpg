import { useIntersectionObserver } from '@/__create/useIntersectionObserver';
import {
  AlertCircle,
  AlertTriangle,
  CreditCard,
  FileQuestion,
  HelpCircle,
  Home,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import FAQItem from './FAQItem';

const FAQ_DATA = [
  {
    id: 1,
    question: 'How do I book a PG?',
    answer:
      "Browse our listings on FindNearPG, select your preferred PG, fill in your details, and complete the payment. Our team will verify your booking and you'll receive a confirmation email within 24 hours.",
    icon: Home,
  },
  {
    id: 2,
    question: 'What payment methods are accepted?',
    answer:
      'We accept all major credit/debit cards, UPI, net banking, and wallet payments through our secure payment gateway. You can also pay in installments for long-term bookings.',
    icon: CreditCard,
  },
  {
    id: 3,
    question: 'Can I cancel my booking?',
    answer:
      'Yes, you can cancel your booking up to 7 days before your move-in date for a full refund. Cancellations within 7 days will be subject to a 10% cancellation fee per our terms and conditions.',
    icon: AlertCircle,
  },
  {
    id: 4,
    question: 'How are PGs verified on FindNearPG?',
    answer:
      'Every PG on our platform goes through a rigorous 50-point physical verification process including hygiene checks, amenity verification, documentation review, and owner credibility assessment before being listed.',
    icon: ShieldCheck,
  },
  {
    id: 5,
    question: 'Do you offer tours or site visits?',
    answer:
      'Yes! We recommend visiting the PG before booking. You can schedule a virtual tour with the owner or arrange an in-person visit. Contact our support team to help coordinate your visit.',
    icon: FileQuestion,
  },
  {
    id: 6,
    question: 'What if I have issues with the landlord?',
    answer:
      'FindNearPG acts as a mediator between tenants and landlords. Report any issues through our support portal, and our team will investigate and help resolve disputes within 48 hours.',
    icon: AlertTriangle,
  },
  {
    id: 7,
    question: 'Are utilities included in the rent?',
    answer:
      "Utility charges vary by property. Check the listing details for each PG to see what's included (electricity, water, internet, etc.). This information is clearly mentioned in the property description.",
    icon: HelpCircle,
  },
  {
    id: 8,
    question: 'How do I report suspicious listings?',
    answer:
      "If you find a suspicious listing or scam, please report it immediately through the 'Report' button on the property page or email support@findnearpg.com with details. We take fraud very seriously.",
    icon: AlertTriangle,
  },
];

export default function FAQSection() {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [openId, setOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = FAQ_DATA.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section
      id="faq"
      ref={ref}
      className={`bg-white px-4 py-10 sm:px-6 sm:py-24 md:py-32 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="mb-6 text-center sm:mb-16">
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-[#073735] sm:mb-6 sm:text-4xl md:text-5xl">
            Frequently Asked <span className="text-[#0f8f8b]">Questions</span>
          </h2>
          <p className="text-xs text-[#073735]/60 sm:text-lg">
            Find answers to common questions about booking, payments, and our verification process.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 sm:mb-8">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f8f8b] sm:left-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#e7f4f3] bg-[#f8fffe] py-2.5 pl-10 pr-4 text-sm text-[#073735] placeholder:text-[#073735]/40 focus:border-[#0f8f8b] focus:outline-none focus:ring-2 focus:ring-[#0f8f8b]/10 sm:py-4 sm:pl-12"
          />
        </div>

        {/* FAQ Items */}
        <div className="rounded-2xl border border-[#e7f4f3] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: isVisible ? `${index * 50}ms` : '0ms',
                }}
              >
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  icon={faq.icon}
                  isOpen={openId === faq.id}
                  onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                />
              </div>
            ))
          ) : (
            <div className="px-4 py-12 sm:px-6 text-center text-[#073735]/60">
              <p className="text-sm sm:text-base">
                No FAQs found matching your search. Try different keywords.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center sm:mt-12">
          <p className="mb-3 text-xs text-[#073735]/70 sm:mb-4 sm:text-base">
            Can't find what you're looking for?
          </p>
          <a
            href="/support/contact"
            className="inline-block rounded-full bg-[#0f8f8b] px-6 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-[#0c6764] active:scale-95 sm:px-8 sm:py-3"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
