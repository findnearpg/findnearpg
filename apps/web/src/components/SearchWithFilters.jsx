import { MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export default function SearchWithFilters({ defaultCity = 'Bengaluru' }) {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState(defaultCity);

  const handleSearch = () => {
    const query = String(searchCity || '').trim();
    if (!query) {
      navigate('/search');
      return;
    }
    navigate(`/search?city=${encodeURIComponent(query)}`);
  };

  return (
    <div className="w-full">
      <div className="flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-[#d7ecea] bg-white p-2 shadow-xl shadow-[#073735]/10 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2">
          <MapPin className="text-[#0f8f8b]" size={18} />
          <input
            type="text"
            value={searchCity}
            placeholder="Search by city or area"
            onChange={(event) => setSearchCity(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            className="w-full bg-transparent text-sm font-medium text-[#073735] outline-none placeholder:text-[#073735]/50"
          />
        </label>
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f8f8b] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0c6764] sm:px-7 sm:py-3"
        >
          <Search size={16} />
          Search PGs
        </button>
      </div>
    </div>
  );
}
