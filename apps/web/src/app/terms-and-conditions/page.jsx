'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';

export function meta() {
  return [
    { title: 'Terms and Conditions | FindNearPG' },
    { name: 'description', content: 'Terms and conditions for using FindNearPG platform.' },
  ];
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 text-[#073735] sm:px-6">
        <h1 className="text-3xl font-extrabold">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-[#073735]/70">Last updated: February 18, 2026</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#073735]/85">
          <p>
            By using FindNearPG, you agree to provide accurate information for inquiry and booking
            requests.
          </p>
          <p>
            Property details are provided by owners and may change. Users should verify key terms
            before move-in.
          </p>
          <p>Any misuse, fraud, scraping, or abusive behavior may result in account suspension.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
