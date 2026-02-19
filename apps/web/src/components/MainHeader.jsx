import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  Building2,
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  UserCircle2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function accountLinksForRole(role) {
  if (role === 'owner') {
    return {
      resetHref: '/account/owner/forgot-password',
      signInHref: '/account/owner/signin',
      roleLabel: 'Owner',
    };
  }
  if (role === 'admin') {
    return {
      resetHref: '/admin',
      signInHref: '/admin',
      roleLabel: 'Admin',
    };
  }
  return {
    resetHref: '/account/user/reset-password',
    signInHref: '/account/user/signin',
    roleLabel: 'User',
  };
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCitiesOpen, setIsCitiesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const citiesRef = useRef(null);
  const accountRef = useRef(null);

  const { data: session } = useQuery({
    queryKey: ['header-session'],
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const { data: adminSession } = useQuery({
    queryKey: ['header-admin-session'],
    staleTime: 1000 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch('/api/auth/dev-session?scope=admin');
      if (!response.ok) return null;
      return response.json();
    },
  });

  const hasPrimarySession = Boolean(session?.authenticated);
  const currentSession = hasPrimarySession
    ? session
    : adminSession?.authenticated
      ? adminSession
      : session;
  const isAdmin = Boolean(currentSession?.authenticated && currentSession?.role === 'admin');
  const role = String(currentSession?.role || 'guest');
  const isOwner = Boolean(currentSession?.authenticated && role === 'owner');
  const isUser = Boolean(currentSession?.authenticated && role === 'user');
  const isGuest = !currentSession?.authenticated;
  const links = accountLinksForRole(role);

  const primaryHref = isAdmin
    ? '/dashboard/admin'
    : isOwner
      ? '/dashboard/owner/overview'
      : '/dashboard/user/bookings';
  const primaryText = isAdmin || isOwner ? 'View Dashboard' : 'My Bookings';
  const primaryTextMobile = isAdmin || isOwner ? 'Dashboard' : 'Bookings';
  const listPropertyHref = '/account/owner';
  const displayName = String(currentSession?.name || currentSession?.email || 'User')
    .split('@')[0]
    .trim();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/dev-session', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to logout');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Logged out');
      window.location.href = links.signInHref;
    },
    onError: () => {
      toast.error('Failed to logout');
    },
  });

  useEffect(() => {
    function handleOutsideClick(event) {
      if (citiesRef.current && !citiesRef.current.contains(event.target)) setIsCitiesOpen(false);
      if (accountRef.current && !accountRef.current.contains(event.target)) setIsAccountOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="flex h-8 w-full items-center justify-center bg-[#073735] px-2 text-white">
        <p className="line-clamp-1 text-center text-[10px] font-medium sm:text-xs">
          Find verified PGs quickly in Bengaluru (Bangalore).
        </p>
      </div>

      <header className="sticky top-0 z-50 border-b border-[#e7f4f3] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <a href="/" className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f8f8b] shadow-lg shadow-[#0f8f8b]/25 sm:h-10 sm:w-10">
                <MapPin className="text-white" size={16} />
              </div>
              <span className="max-w-[160px] truncate text-[22px] font-black tracking-tight text-[#073735] max-[360px]:max-w-[120px] max-[360px]:text-[18px] sm:max-w-none sm:text-2xl">
                FindNear<span className="text-[#0f8f8b]">PG</span>
              </span>
            </a>

            <nav className="hidden items-center gap-7 md:flex">
              <a href="/" className="text-sm font-semibold text-[#073735] hover:text-[#0f8f8b]">
                Home
              </a>
              <div className="relative" ref={citiesRef}>
                <button
                  type="button"
                  onClick={() => setIsCitiesOpen((prev) => !prev)}
                  className="inline-flex items-center text-sm font-semibold text-[#073735] hover:text-[#0f8f8b]"
                >
                  Cities
                  <ChevronDown size={14} className="ml-1" />
                </button>
                {isCitiesOpen ? (
                  <div className="absolute left-0 top-10 z-50 w-52 rounded-2xl border border-[#d7ecea] bg-white p-2 shadow-2xl">
                    {['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Delhi', 'Chennai'].map(
                      (city) => (
                        <a
                          key={city}
                          href={`/search?city=${encodeURIComponent(city)}`}
                          className="block rounded-xl px-3 py-2 text-sm font-medium text-[#073735] hover:bg-[#f1f9f9]"
                        >
                          {city}
                        </a>
                      )
                    )}
                  </div>
                ) : null}
              </div>
              <a
                href="/search"
                className="text-sm font-semibold text-[#073735] hover:text-[#0f8f8b]"
              >
                Search PGs
              </a>
              <a
                href={listPropertyHref}
                className="text-sm font-semibold text-[#073735] hover:text-[#0f8f8b]"
              >
                Add Your Property
              </a>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {isGuest ? (
                <>
                  <a
                    href="/account/user/signin"
                    className="hidden text-sm font-semibold text-[#073735] hover:text-[#0f8f8b] sm:inline-flex"
                  >
                    Login
                  </a>
                  <a
                    href="/account/user/signup"
                    className="rounded-full bg-[#0f8f8b] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0f8f8b]/25 hover:bg-[#0c6764]"
                  >
                    Register
                  </a>
                </>
              ) : (
                <>
                  <div className="relative hidden sm:block" ref={accountRef}>
                    <button
                      type="button"
                      onClick={() => setIsAccountOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#cde7e5] bg-white px-3 py-2 text-sm font-semibold text-[#073735] hover:border-[#0f8f8b]"
                    >
                      <UserCircle2 size={16} />
                      {displayName}
                    </button>
                    {isAccountOpen ? (
                      <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#d7ecea] bg-white p-3 shadow-2xl">
                        <div className="rounded-xl bg-[#f8fffe] p-3">
                          <p className="text-base font-bold text-[#073735]">
                            {currentSession?.name || displayName}
                          </p>
                          <p className="text-xs text-[#073735]/65">
                            {currentSession?.email || '-'}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#0f8f8b]">
                            <ShieldCheck size={12} />
                            {links.roleLabel}
                          </p>
                        </div>
                        <div className="mt-3 space-y-2">
                          {isUser ? (
                            <a
                              href="/saved-properties"
                              className="block rounded-xl border border-[#e7f4f3] px-3 py-2 text-sm font-semibold text-[#073735] hover:bg-[#f1f9f9]"
                            >
                              Saved Properties
                            </a>
                          ) : null}
                          <a
                            href={links.resetHref}
                            className="block rounded-xl border border-[#e7f4f3] px-3 py-2 text-sm font-semibold text-[#073735] hover:bg-[#f1f9f9]"
                          >
                            Reset Password
                          </a>
                          <button
                            type="button"
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                            className="w-full rounded-xl bg-[#073735] px-3 py-2 text-left text-sm font-semibold text-white hover:bg-[#0c6764] disabled:opacity-60"
                          >
                            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <a
                    href={primaryHref}
                    className="whitespace-nowrap rounded-full bg-[#0f8f8b] px-3 py-2 text-xs font-bold text-white shadow-lg shadow-[#0f8f8b]/25 hover:bg-[#0c6764] max-[360px]:px-2.5 max-[360px]:text-[11px] sm:px-4 sm:text-sm"
                  >
                    <span className="sm:hidden">{primaryTextMobile}</span>
                    <span className="hidden sm:inline">{primaryText}</span>
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="rounded-lg p-2 text-[#073735] md:hidden"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[70] bg-[#073735]/20 px-3 pb-3 pt-24 md:hidden transition-all duration-300 ${
          isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onMouseDown={() => setIsMenuOpen(false)}
      >
        <div
          className={`mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#d9ecea] bg-gradient-to-b from-white via-white to-[#f7fcfb] shadow-2xl transition-all duration-300 ${
            isMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-2 scale-[0.98]'
          }`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="max-h-[78vh] overflow-y-auto px-4 py-4">
            {!isGuest ? (
              <div className="mb-3 flex items-center justify-between border-b border-[#e7f4f3] pb-2">
                <p className="text-xs font-medium tracking-wide text-[#073735]/70">Welcome back</p>
                <p className="max-w-[60%] truncate text-sm font-bold text-[#073735]">
                  {displayName || 'User'}
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <a
                href="/"
                className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <Home size={18} className="text-[#0f8f8b]" />
                  Home
                </span>
                <ChevronRight size={16} className="text-[#073735]/45" />
              </a>
              <a
                href="/search"
                className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <Search size={18} className="text-[#0f8f8b]" />
                  Search PGs
                </span>
                <ChevronRight size={16} className="text-[#073735]/45" />
              </a>
              <a
                href={listPropertyHref}
                className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <Building2 size={18} className="text-[#0f8f8b]" />
                  Add Your Property
                </span>
                <ChevronRight size={16} className="text-[#073735]/45" />
              </a>
            </div>

            <div className="mt-4 space-y-2 border-t border-[#e7f4f3] pt-4">
              {isGuest ? (
                <>
                  <a
                    href="/account/user/signin"
                    className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                    <ChevronRight size={16} className="text-[#073735]/45" />
                  </a>
                  <a
                    href="/account/user/signup"
                    className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                    <ChevronRight size={16} className="text-[#073735]/45" />
                  </a>
                </>
              ) : (
                <>
                  <a
                    href={primaryHref}
                    className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserCircle2 size={18} className="text-[#0f8f8b]" />
                      {primaryText}
                    </span>
                    <ChevronRight size={16} className="text-[#073735]/45" />
                  </a>
                  {isUser ? (
                    <a
                      href="/saved-properties"
                      className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Bookmark size={18} className="text-[#0f8f8b]" />
                        Saved Properties
                      </span>
                      <ChevronRight size={16} className="text-[#073735]/45" />
                    </a>
                  ) : null}
                  <a
                    href={links.resetHref}
                    className="flex items-center justify-between rounded-xl border border-[#deeeec] bg-white px-3 py-2.5 text-[14px] font-bold text-[#073735]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck size={18} className="text-[#0f8f8b]" />
                      Reset Pass
                    </span>
                    <ChevronRight size={16} className="text-[#073735]/45" />
                  </a>
                  <button
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="flex w-full items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-[14px] font-bold text-rose-700 disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut size={18} />
                      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
