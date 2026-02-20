'use client';

import Footer from '@/components/Footer';
import Header from '@/components/MainHeader';
import PropertyCard from '@/components/PropertyCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Coffee,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  Users,
  Wifi,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

let recaptchaScriptPromise = null;

function getRecaptchaApi(grecaptcha) {
  const execute =
    typeof grecaptcha?.enterprise?.execute === 'function'
      ? (key, options) => grecaptcha.enterprise.execute(key, options)
      : typeof grecaptcha?.execute === 'function'
        ? (key, options) => grecaptcha.execute(key, options)
        : null;
  const ready =
    typeof grecaptcha?.enterprise?.ready === 'function'
      ? (cb) => grecaptcha.enterprise.ready(cb)
      : typeof grecaptcha?.ready === 'function'
        ? (cb) => grecaptcha.ready(cb)
        : null;
  return { execute, ready };
}

function waitForRecaptchaApi(timeoutMs = 6000) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const { execute, ready } = getRecaptchaApi(window.grecaptcha);
      if (execute && ready) {
        resolve(window.grecaptcha);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(window.grecaptcha || null);
        return;
      }
      setTimeout(tick, 120);
    };
    tick();
  });
}

function loadRecaptcha(siteKey) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const existingApi = getRecaptchaApi(window.grecaptcha);
  if (existingApi.execute && existingApi.ready) {
    return Promise.resolve(window.grecaptcha);
  }
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-recaptcha="google-v3"]');
    if (existing) {
      existing.addEventListener('load', async () => resolve(await waitForRecaptchaApi()), {
        once: true,
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')), {
        once: true,
      });
      waitForRecaptchaApi().then(resolve);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.dataset.recaptcha = 'google-v3';
    script.onload = async () => resolve(await waitForRecaptchaApi());
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
}

async function createRecaptchaToken({ siteKey, action }) {
  if (!siteKey) {
    throw new Error('reCAPTCHA site key missing');
  }
  const grecaptcha = await loadRecaptcha(siteKey);
  const { execute, ready } = getRecaptchaApi(grecaptcha);
  if (!execute || !ready) {
    throw new Error('reCAPTCHA not available');
  }
  return new Promise((resolve, reject) => {
    ready(async () => {
      try {
        const token = await execute(siteKey, { action });
        resolve(String(token || ''));
      } catch {
        reject(new Error('reCAPTCHA verification failed'));
      }
    });
  });
}

export default function PropertyDetailPage({ params }) {
  const { slug } = params;
  const queryClient = useQueryClient();
  const recaptchaSiteKey = String(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      import.meta.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
      ''
  ).trim();
  const [selectedRoomKey, setSelectedRoomKey] = useState('1');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [savedByMe, setSavedByMe] = useState(false);
  const mobileGalleryRef = useRef(null);

  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['property', slug],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${slug}`);
      if (!response.ok) throw new Error('Property not found');
      return response.json();
    },
  });
  const { data: session } = useQuery({
    queryKey: ['property-session'],
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const { data: similarProperties = [], isLoading: isSimilarLoading } = useQuery({
    queryKey: ['similar-properties', property?.id, property?.city],
    enabled: Boolean(property?.id && property?.city),
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        city: String(property.city),
        limit: '8',
      });
      const response = await fetch(`/api/properties?${searchParams.toString()}`);
      if (!response.ok) return [];
      const list = await response.json();
      return list.filter((item) => Number(item.id) !== Number(property.id)).slice(0, 4);
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      const booking = await bookingResponse.json();
      if (!bookingResponse.ok) throw new Error(booking.error || 'Booking failed');
      return { booking };
    },
    onSuccess: () => {
      toast.success(
        'Booking request sent. Pay rent directly to owner at PG/location during check-in.'
      );
      window.location.href = '/dashboard/user/bookings';
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to book');
    },
  });

  const roomOptions = useMemo(() => {
    if (!property) return [];
    const sharing = String(property.sharing || '').toLowerCase();
    const sharingPrices = property.sharing_prices || {};
    const basePrice = Number(property.price || 0);
    const all = [
      {
        key: '1',
        label: 'Single Sharing',
        price: Number(sharingPrices['1'] ?? (sharing === '1' ? basePrice : 0)),
      },
      {
        key: '2',
        label: 'Double Sharing',
        price: Number(sharingPrices['2'] ?? (sharing === '2' ? basePrice : 0)),
      },
      {
        key: '3',
        label: 'Triple Sharing',
        price: Number(sharingPrices['3'] ?? (sharing === '3' ? basePrice : 0)),
      },
    ].filter((item) => Number.isFinite(item.price) && item.price > 0);

    if (sharing === 'all123') return all;
    return all.filter((item) => item.key === sharing);
  }, [property]);

  useEffect(() => {
    if (!roomOptions.length) return;
    if (!roomOptions.find((item) => item.key === selectedRoomKey)) {
      setSelectedRoomKey(roomOptions[0].key);
    }
  }, [roomOptions, selectedRoomKey]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, []);

  useEffect(() => {
    setLikeCount(Number(property?.likes?.count || 0));
    setLikedByMe(Boolean(property?.likes?.likedByMe));
    setSavedByMe(Boolean(property?.saves?.savedByMe));
  }, [property?.likes?.count, property?.likes?.likedByMe, property?.saves?.savedByMe]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/properties/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to update like');
      return data;
    },
    onSuccess: (data) => {
      setLikeCount(Number(data.likeCount || 0));
      setLikedByMe(Boolean(data.likedByMe));
      toast.success(data.likedByMe ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: (err) => {
      if (
        String(err?.message || '')
          .toLowerCase()
          .includes('forbidden')
      ) {
        toast.error('Please login first to like this property');
        return;
      }
      toast.error(err?.message || 'Unable to update like status');
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/properties/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'save_toggle' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to update save');
      return data;
    },
    onSuccess: (data) => {
      setSavedByMe(Boolean(data.savedByMe));
      queryClient.invalidateQueries({ queryKey: ['saved-properties'] });
      toast.success(data.savedByMe ? 'Property saved' : 'Removed from saved list');
    },
    onError: (err) => {
      toast.error(err?.message || 'Unable to update save status');
    },
  });

  const selectedRoom = roomOptions.find((item) => item.key === selectedRoomKey) || roomOptions[0];
  const selectedPrice = selectedRoom?.price || Number(property?.price || 0);
  const latestReviews = Array.isArray(property?.reviews?.items) ? property.reviews.items : [];
  const visibleReviews = showAllReviews ? latestReviews : latestReviews.slice(0, 3);
  const averageRating = Number(property?.reviews?.averageRating || 0);
  const reviewTotal = Number(property?.reviews?.total || 0);
  const fallbackImage =
    'https://images.unsplash.com/photo-1522771739844-649f43921f01?auto=format&fit=crop&q=80&w=1200';
  const galleryImages =
    Array.isArray(property?.images) && property.images.length ? property.images : [fallbackImage];
  const graphicImagePattern = /(?:logo|icon|badge|brand|title[-_]?logo|banner)/i;
  const getImageFitClass = (imageUrl) =>
    graphicImagePattern.test(String(imageUrl || '')) ? 'object-contain bg-white p-2' : 'object-cover';
  const safeImageIndex = Math.max(0, Math.min(selectedImageIndex, galleryImages.length - 1));
  const activeImage = galleryImages[safeImageIndex] || fallbackImage;
  const amenityItems =
    Array.isArray(property?.amenities) && property.amenities.length
      ? property.amenities
      : ['High-speed Internet', 'Daily Cleaning', 'Laundry Service', '24/7 Security'];
  const foodLabel = property?.food_option
    ? String(property.food_option).replace(/_/g, ' ')
    : 'Food info available on call';

  const handleBookNow = async () => {
    if (!session?.authenticated) {
      toast.error('Please login or sign up as user before booking.');
      window.location.href = `/account/user/signin?next=${encodeURIComponent(`/pg/${slug}`)}`;
      return;
    }
    if (session?.role !== 'user') {
      toast.error('Owners/Admins cannot book. Please use a user account.');
      return;
    }
    if (!acceptedTerms) {
      toast.error('Please accept booking terms to continue');
      return;
    }
    if (!selectedRoom) {
      toast.error('No valid room option available');
      return;
    }

    let recaptchaToken = '';
    try {
      recaptchaToken = await createRecaptchaToken({
        siteKey: recaptchaSiteKey,
        action: 'booking',
      });
    } catch (error) {
      toast.error(error?.message || 'Security check failed. Please try again.');
      return;
    }

    bookingMutation.mutate({
      userId: Number(session?.userId),
      propertyId: property.id,
      roomType: selectedRoom.label,
      amount: selectedPrice,
      acceptedTerms: true,
      recaptchaToken,
    });
  };

  const handleLikeProperty = () => {
    if (!session?.authenticated || session?.role !== 'user') {
      toast.error('Please login as user to like this property');
      window.location.href = `/account/user/signin?next=${encodeURIComponent(`/pg/${slug}`)}`;
      return;
    }
    if (likeMutation.isPending) return;
    likeMutation.mutate();
  };

  const handleSaveProperty = () => {
    if (!session?.authenticated || session?.role !== 'user') {
      toast.error('Please login as user to save properties');
      window.location.href = `/account/user/signin?next=${encodeURIComponent(`/pg/${slug}`)}`;
      return;
    }
    if (saveMutation.isPending) return;
    saveMutation.mutate();
  };

  const handleShareProperty = async () => {
    const shareUrl = window.location.href;
    const shareTitle = property?.title || 'PG listing';
    const shareText = `${shareTitle} in ${property?.area || ''}, ${property?.city || ''}`.trim();

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Property link copied');
    } catch {
      toast.error('Unable to share right now');
    }
  };

  const handleMobileGalleryScroll = () => {
    const scroller = mobileGalleryRef.current;
    if (!scroller) return;
    const index = Math.round(scroller.scrollLeft / scroller.clientWidth);
    if (index !== safeImageIndex) {
      setSelectedImageIndex(Math.max(0, Math.min(index, galleryImages.length - 1)));
    }
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="p-8 text-center sm:p-20">Loading...</div>
      </div>
    );
  if (error || !property)
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <div className="p-8 text-center sm:p-20">Property not found.</div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Navigation / Breadcrumb */}
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-[#073735]/60 hover:text-[#0f8f8b] font-semibold transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm sm:text-base">Back to listings</span>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              type="button"
              onClick={handleLikeProperty}
              className={`inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-2.5 shadow-sm transition-colors ${
                likedByMe
                  ? 'border-red-200 text-red-500'
                  : 'border-gray-100 text-[#073735]/75 hover:text-red-500'
              }`}
            >
              <Heart size={18} className={likedByMe ? 'fill-current' : ''} />
              <span className="text-xs font-semibold">{likeCount}</span>
            </button>
            <button
              type="button"
              onClick={handleShareProperty}
              className="p-2.5 bg-white rounded-full border border-gray-100 shadow-sm hover:text-[#0f8f8b] transition-colors"
            >
              <Share2 size={20} />
            </button>
            <button
              type="button"
              onClick={handleSaveProperty}
              className={`p-2.5 rounded-full border shadow-sm transition-colors ${
                savedByMe
                  ? 'border-[#0f8f8b] bg-[#f1f9f9] text-[#0f8f8b]'
                  : 'border-gray-100 bg-white hover:text-[#0f8f8b]'
              }`}
              aria-label="Save property"
              title="Save property"
            >
              <Bookmark size={20} className={savedByMe ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
          {/* Left: Content */}
          <div className="space-y-6 lg:col-span-2 lg:space-y-10">
            {/* Gallery */}
            <div className="space-y-4">
              <div
                ref={mobileGalleryRef}
                onScroll={handleMobileGalleryScroll}
                className="flex snap-x snap-mandatory gap-0 overflow-x-auto rounded-2xl shadow-xl sm:hidden"
              >
                {galleryImages.map((image, index) => (
                  <div key={`mobile-${image}`} className="min-w-full snap-start">
                    <img
                      src={image}
                      alt={`${property.title} ${index + 1}`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`aspect-[16/10] w-full ${getImageFitClass(image)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:hidden">
                {galleryImages.map((image, index) => (
                  <span
                    key={`dot-${image}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === safeImageIndex ? 'w-5 bg-[#0f8f8b]' : 'w-1.5 bg-[#cde7e5]'
                    }`}
                  />
                ))}
              </div>
              <div className="hidden aspect-[16/10] overflow-hidden rounded-2xl shadow-xl sm:block sm:aspect-[16/9] sm:rounded-3xl">
                <img
                  src={activeImage}
                  alt={property.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`w-full h-full ${getImageFitClass(activeImage)}`}
                />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {galleryImages.slice(0, 4).map((image, index) => (
                  <button
                    type="button"
                    key={`thumb-${image}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square cursor-pointer overflow-hidden rounded-xl border transition-all hover:opacity-90 sm:rounded-2xl ${
                      safeImageIndex === index ? 'border-[#0f8f8b]' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt="Thumbnail"
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full ${getImageFitClass(image)}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Title and Info */}
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[40px] sm:p-8 lg:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="px-3 py-1 bg-[#f1f9f9] text-[#0f8f8b] text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Verified Property
                </div>
                <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  <Star size={10} className="fill-current" />
                  <span>
                    {reviewTotal > 0
                      ? `${averageRating.toFixed(1)} (${reviewTotal} reviews)`
                      : 'No reviews yet'}
                  </span>
                </div>
              </div>

              <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-[#073735] sm:mb-4 sm:text-4xl">
                {property.title}
              </h1>

              <div className="mb-6 flex items-start text-[#073735]/60 sm:mb-8">
                <MapPin size={18} className="mr-2 text-[#0f8f8b]" />
                <span className="text-base font-medium sm:text-lg">
                  {property.area}, {property.city}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 border-y border-gray-50 py-5 sm:grid-cols-2 sm:gap-6 sm:py-8 md:grid-cols-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      Gender
                    </div>
                    <div className="font-bold text-[#073735] capitalize">
                      {property.gender_allowed || 'Any'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      WiFi
                    </div>
                    <div className="font-bold text-[#073735]">High Speed</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      Food
                    </div>
                    <div className="font-bold text-[#073735] capitalize">{foodLabel}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f1f9f9] rounded-xl flex items-center justify-center text-[#0f8f8b]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#073735]/40 uppercase tracking-widest">
                      Availability
                    </div>
                    <div className="font-bold text-[#073735]">
                      {Number(property.available_rooms || 0)} rooms left
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-10">
                <h3 className="text-xl font-bold text-[#073735] mb-4">About this PG</h3>
                <p className="text-[#073735]/70 leading-relaxed">
                  {property.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[40px] sm:p-8 lg:p-10">
              <h3 className="mb-6 text-xl font-bold text-[#073735] sm:mb-8 sm:text-2xl">
                What this place offers
              </h3>
              <div className="grid grid-cols-1 gap-y-3 gap-x-12 md:grid-cols-2 md:gap-y-4">
                {amenityItems.slice(0, 10).map((item) => (
                  <div key={item} className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                      <Check size={14} />
                    </div>
                    <span className="text-[#073735]/70 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[40px] sm:p-8 lg:p-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-[#073735] sm:text-2xl">Latest Reviews</h3>
                <span className="rounded-full bg-[#f1f9f9] px-3 py-1 text-xs font-bold text-[#0f8f8b]">
                  {reviewTotal > 0 ? `${averageRating.toFixed(1)} / 5` : 'No ratings'}
                </span>
              </div>
              {visibleReviews.length === 0 ? (
                <p className="text-sm text-[#073735]/65">
                  No reviews available yet for this property.
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-2xl border border-[#e5eeee] bg-[#fafdff] p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#073735]">
                          {String(review.user_name || '').trim() || 'Tenant'}
                        </p>
                        <div className="flex items-center gap-1.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`${review.id}-star-${star}`}
                              size={13}
                              className={
                                star <= Number(review.rating || 0)
                                  ? 'fill-current text-amber-500'
                                  : 'text-amber-200'
                              }
                            />
                          ))}
                          <span className="text-xs font-semibold text-amber-600">
                            {Number(review.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[#073735]/75">{review.comment || '-'}</p>
                    </article>
                  ))}
                </div>
              )}
              {latestReviews.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setShowAllReviews((prev) => !prev)}
                  className="mt-4 text-sm font-semibold text-[#0f8f8b] hover:text-[#0c6764]"
                >
                  {showAllReviews ? 'View less' : `View more (${latestReviews.length - 3})`}
                </button>
              ) : null}
            </div>
          </div>

          {/* Right: Sidebar Sticky Booking */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-24 lg:space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-[#073735]/5 sm:rounded-[40px] sm:p-8">
                <div className="mb-6 flex items-baseline space-x-2 sm:mb-8">
                  <span className="text-3xl font-extrabold text-[#0f8f8b] sm:text-4xl">
                    ₹{Number(selectedPrice || 0).toLocaleString()}
                  </span>
                  <span className="text-[#073735]/40 font-bold uppercase tracking-widest text-xs">
                    / per month
                  </span>
                </div>

                <div className="mb-6 space-y-5 sm:mb-8 sm:space-y-6">
                  <div>
                    <p className="block text-xs font-bold text-[#073735]/40 uppercase tracking-widest mb-3">
                      Room Type
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {roomOptions.map((item) => (
                        <button
                          type="button"
                          key={item.key}
                          onClick={() => setSelectedRoomKey(item.key)}
                          className={`w-full py-4 px-6 rounded-2xl border-2 transition-all text-left font-bold ${
                            selectedRoomKey === item.key
                              ? 'border-[#0f8f8b] bg-[#f1f9f9] text-[#0f8f8b]'
                              : 'border-gray-100 bg-gray-50 text-[#073735]/70 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{item.label}</span>
                            <span className="text-sm">₹{Number(item.price).toLocaleString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBookNow}
                  disabled={bookingMutation.isPending || !selectedRoom}
                  className="w-full rounded-full bg-[#0f8f8b] py-4 text-base font-extrabold text-white shadow-xl shadow-[#0f8f8b]/30 transition-all hover:scale-[1.02] hover:bg-[#0c6764] active:scale-95 disabled:opacity-50 sm:py-5 sm:text-lg"
                >
                  {bookingMutation.isPending ? 'Booking...' : 'Book Now'}
                </button>

                <label className="mt-4 flex items-start gap-2 text-xs text-[#073735]/70">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#0f8f8b]"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                  />
                  <span>
                    I agree to complete booking on platform and pay rent directly to owner at
                    PG/location during check-in.
                  </span>
                </label>
                {!session?.authenticated ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Login or sign up as user to continue booking.
                  </p>
                ) : null}
                {session?.authenticated && session?.role !== 'user' ? (
                  <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    Booking is disabled for owner/admin accounts.
                  </p>
                ) : null}

                <div className="mt-5 rounded-2xl border border-[#d7ecea] bg-[#f8fffe] p-3 text-xs text-[#073735]/75">
                  <p className="font-semibold text-[#073735]">Payment split for this room</p>
                  <p className="mt-1">
                    Total rent:{' '}
                    <span className="font-bold text-[#073735]">
                      ₹{Number(selectedPrice || 0).toLocaleString()}
                    </span>
                  </p>
                  <p>
                    Pay now on platform:{' '}
                    <span className="font-bold text-[#073735]">Not required</span>
                  </p>
                  <p>
                    Pay to owner at PG/location during move-in:{' '}
                    <span className="font-bold text-[#073735]">
                      ₹{Number(selectedPrice || 0).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 sm:mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#073735] sm:text-3xl">
              Similar Properties
            </h2>
            <a
              href={`/search?city=${encodeURIComponent(property.city || '')}`}
              className="text-sm font-semibold text-[#0f8f8b] hover:text-[#0c6764]"
            >
              View all
            </a>
          </div>
          <p className="mb-5 text-sm text-[#073735]/70 sm:mb-7">
            More verified listings in {property.city}.
          </p>
          {isSimilarLoading ? (
            <div className="rounded-2xl border border-dashed border-[#cfe7e5] bg-white p-6 text-sm text-[#073735]/65">
              Loading similar properties...
            </div>
          ) : similarProperties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cfe7e5] bg-white p-6 text-sm text-[#073735]/65">
              No similar listings available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {similarProperties.map((item) => (
                <PropertyCard key={item.id} property={item} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
