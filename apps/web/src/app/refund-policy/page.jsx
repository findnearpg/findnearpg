'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';

export function meta() {
  return [
    { title: 'Refund Policy | FindNearPG' },
    {
      name: 'description',
      content: 'Refund terms for FindNearPG related payments and cancellations.',
    },
  ];
}

export default function RefundPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 text-[#073735] sm:px-6">
        <h1 className="text-3xl font-extrabold">Refund Policy</h1>
        <p className="mt-2 text-sm text-[#073735]/70">Last updated: February 18, 2026</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#073735]/85">
          <p>
            Any eligible refund request must be raised through support@findnearpg.com with booking
            reference details.
          </p>
          <p>
            Approved refunds are processed to the original payment method within 7-10 business days.
          </p>
          <p>
            Charges related to owner-collected rent at property are managed directly between tenant
            and property owner.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
