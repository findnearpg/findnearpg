'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';

export function meta() {
  return [
    { title: 'Privacy Policy | FindNearPG' },
    { name: 'description', content: 'Privacy policy for FindNearPG users, owners, and visitors.' },
  ];
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 text-[#073735] sm:px-6">
        <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#073735]/70">Last updated: February 18, 2026</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#073735]/85">
          <p>
            We collect contact details, search activity, and booking details required to provide PG
            discovery and support services.
          </p>
          <p>
            Data is used for listing discovery, communication, fraud prevention, and platform
            improvement. We do not sell personal data.
          </p>
          <p>
            You may request account data correction or deletion by writing to
            support@findnearpg.com.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
