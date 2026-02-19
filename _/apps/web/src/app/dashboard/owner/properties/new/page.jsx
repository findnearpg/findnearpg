"use client";

export default function NewPropertyPage() {
  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#073735] mb-6">
          Add New Property
        </h1>
        <p className="text-[#073735]/60 mb-4">
          This page is under construction.
        </p>
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-[#0f8f8b] hover:bg-[#0c6764] text-white font-bold rounded-lg transition-all"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
