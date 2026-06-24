import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    MapPin,
    Users,
    CalendarCheck,
    LogIn,
    Menu,
    X,
    Shield,
    Bookmark,
    Share2,
    Twitter,
    Instagram,
    Linkedin,
    Crown,
    Sparkles,
    ArrowRight,
    Clock,
    ChevronRight,
    Star,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types/auth';
import type { Club, Event } from '@/types/models';

// ─── Settings Types ───────────────────────────────────────────────────────────

interface Settings {
    hero_headline?: { value: string };
    hero_subtitle?: { value: string };
    hero_cta_primary?: { value: string };
    hero_cta_secondary?: { value: string };
    site_announcement?: { value: string };
    announcement_color?: { value: string };
    show_featured_events?: { value: string };
    show_clubs_section?: { value: string };
    show_leaderboard?: { value: string };
    ai_enabled?: { value: string };
    footer_text?: { value: string };
    contact_email?: { value: string };
    contact_phone?: { value: string };
}

function setting(s: Settings, key: keyof Settings, fallback = '') {
    return s[key]?.value ?? fallback;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    featuredEvents: (Event & { registered_count?: number })[];
    upcomingEvents: (Event & { registered_count?: number })[];
    topClubs: Club[];
    stats: { total_events: number; active_clubs: number; total_students: number };
    leaderboard: { user: { name: string; avatar?: string; department?: string }; total_points: number }[];
    settings: Settings;
    auth: { user: User | null };
    canLogin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function progressColor(pct: number) {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
}

function getCountdown(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'Now';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
}

// ─── CountUp ─────────────────────────────────────────────────────────────────

function CountUp({ to, duration = 2000 }: { to: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        let start = 0;
        const step = to / (duration / 16);
        const t = setInterval(() => {
            start = Math.min(start + step, to);
            setCount(Math.floor(start));
            if (start >= to) clearInterval(t);
        }, 16);
        return () => clearInterval(t);
    }, [to, duration]);

    return <span>{count.toLocaleString()}</span>;
}

// ─── Sticky Navbar ────────────────────────────────────────────────────────────

function Navbar({ auth }: { auth: { user: User | null } }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const navLinks = [
        { label: 'Home', href: '/' },
        { label: 'Events', href: '/events' },
        { label: 'Clubs', href: '/clubs' },
        { label: 'Leaderboard', href: '/leaderboard' },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-[#182b5c] shadow-2xl' : 'bg-[#182b5c]/95 backdrop-blur-md'
            }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d0b216]">
                            <Shield className="h-5 w-5 text-[#182b5c]" />
                        </div>
                        <span className="font-bold text-[#d0b216] text-lg tracking-wide">KCAU Events</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#d0b216] px-4 py-2 text-sm font-bold text-[#182b5c] hover:bg-[#b89b10] transition-all"
                                >
                                    <Zap className="h-3.5 w-3.5" />
                                    My Hub
                                </Link>
                                <Avatar className="h-8 w-8 border-2 border-[#d0b216]/50">
                                    {auth.user.avatar && <AvatarImage src={auth.user.avatar} />}
                                    <AvatarFallback className="bg-[#d0b216] text-[#182b5c] text-xs font-bold">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#d0b216]/70 px-4 py-2 text-sm font-bold text-[#d0b216] hover:bg-[#d0b216] hover:text-[#182b5c] transition-all"
                            >
                                <LogIn className="h-4 w-4" />
                                Sign In
                            </Link>
                        )}

                        {/* Hamburger */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden rounded-lg p-2 text-white/80 hover:bg-white/10 transition"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/10 bg-[#182b5c] px-4 py-4 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!auth.user && (
                        <Link
                            href="/login"
                            onClick={() => setMobileOpen(false)}
                            className="block mt-2 rounded-lg bg-[#d0b216] px-4 py-3 text-center text-sm font-bold text-[#182b5c]"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
}

// ─── Announcement Banner ──────────────────────────────────────────────────────

function AnnouncementBanner({ settings }: { settings: Settings }) {
    const [dismissed, setDismissed] = useState(false);
    const text = setting(settings, 'site_announcement');
    const color = setting(settings, 'announcement_color', '#d0b216');

    if (!text || dismissed) return null;

    return (
        <div
            className="relative z-[60] text-center py-2 px-4 text-sm font-medium text-[#182b5c]"
            style={{ backgroundColor: color }}
        >
            <span>{text}</span>
            <button
                onClick={() => setDismissed(true)}
                className="ml-4 opacity-60 hover:opacity-100 transition font-bold"
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
}

// ─── Live Ticker ──────────────────────────────────────────────────────────────

function LiveTicker({ events }: { events: Event[] }) {
    const today = new Date().toDateString();
    const todayEvents = events.filter((e) => new Date(e.start_datetime).toDateString() === today);

    if (todayEvents.length === 0) return null;

    const tickerContent = todayEvents.map((e) => `📅 ${e.title}`).join('  ·  ');

    return (
        <div className="bg-[#182b5c]/90 border-y border-[#d0b216]/20 py-2.5 overflow-hidden">
            <div className="flex items-center gap-3 px-4">
                <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-red-400 pr-3 border-r border-white/20">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    LIVE NOW
                </span>
                <div className="overflow-hidden flex-1">
                    <div className="whitespace-nowrap text-sm text-white/80 animate-[marquee_30s_linear_infinite]">
                        {tickerContent}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerContent}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, featured = false }: { event: Event & { registered_count?: number }; featured?: boolean }) {
    const registered = event.registered_count ?? 0;
    const capacity = event.capacity ?? 0;
    const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
    const spotsLeft = capacity > 0 ? capacity - registered : null;
    const isFree = !event.is_paid;
    const countdown = getCountdown(event.start_datetime);

    const [bookmarked, setBookmarked] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('bookmarked_events') ?? '[]');
            return saved.includes(event.id);
        } catch {
            return false;
        }
    });

    const toggleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const saved: number[] = JSON.parse(localStorage.getItem('bookmarked_events') ?? '[]');
        const updated = bookmarked ? saved.filter((id) => id !== event.id) : [...saved, event.id];
        localStorage.setItem('bookmarked_events', JSON.stringify(updated));
        setBookmarked(!bookmarked);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
    };

    return (
        <Link
            href={`/events/${event.slug}`}
            className={`group relative flex flex-col rounded-2xl overflow-hidden border bg-white dark:bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                featured ? 'min-w-[300px] w-[300px] snap-start flex-shrink-0' : ''
            }`}
        >
            {/* Cover */}
            <div className="relative aspect-video bg-gradient-to-br from-[#182b5c] to-[#0d1e42] overflow-hidden">
                {event.cover_url ? (
                    <img
                        src={event.cover_url}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <CalendarDays className="h-14 w-14 text-white/20" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Date chip */}
                <span className="absolute bottom-2 left-2 rounded-lg bg-[#d0b216] px-2.5 py-1 text-xs font-bold text-[#182b5c]">
                    {formatShortDate(event.start_datetime)}
                </span>

                {/* Countdown */}
                <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-xs font-medium text-white">
                    <Clock className="h-3 w-3" />
                    {countdown}
                </span>

                {/* Bookmark */}
                <button
                    onClick={toggleBookmark}
                    className={`absolute top-2 right-2 rounded-full p-1.5 backdrop-blur transition-all ${
                        bookmarked ? 'bg-[#d0b216] text-[#182b5c]' : 'bg-black/40 text-white hover:bg-[#d0b216] hover:text-[#182b5c]'
                    }`}
                >
                    <Bookmark className="h-3.5 w-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-4 space-y-2">
                {event.club && (
                    <span className="text-xs font-medium text-[#182b5c] dark:text-blue-300 bg-[#182b5c]/8 dark:bg-blue-950/30 rounded-full px-2 py-0.5 self-start">
                        {event.club.name}
                    </span>
                )}

                <h3 className="font-semibold line-clamp-2 text-sm leading-snug group-hover:text-[#182b5c] dark:group-hover:text-[#d0b216] transition">
                    {event.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{formatTime(event.start_datetime)}</span>
                </div>

                {event.venue && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{event.venue}</span>
                    </div>
                )}

                {/* Capacity bar */}
                {capacity > 0 && (
                    <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{registered}/{capacity} spots</span>
                            {spotsLeft !== null && spotsLeft < 10 && spotsLeft > 0 && (
                                <span className="font-bold text-red-500">{spotsLeft} spots left!</span>
                            )}
                            {spotsLeft === 0 && <span className="font-bold text-red-500">Full</span>}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-1 mt-auto">
                    <Badge
                        variant="outline"
                        className={isFree ? 'text-emerald-600 border-emerald-200 text-xs' : 'text-[#182b5c] border-[#d0b216]/50 text-xs'}
                    >
                        {isFree ? 'Free' : event.formatted_fee}
                    </Badge>
                    <div className="flex items-center gap-2">
                        <button onClick={handleShare} className="text-muted-foreground hover:text-[#182b5c] transition opacity-0 group-hover:opacity-100">
                            <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold text-[#d0b216] flex items-center gap-0.5">
                            Register <ArrowRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ settings }: { settings: Settings }) {
    const footerText = setting(settings, 'footer_text', `© ${new Date().getFullYear()} KCA University. All rights reserved.`);
    const email = setting(settings, 'contact_email', 'events@kcau.ac.ke');
    const phone = setting(settings, 'contact_phone', '+254 700 000 000');

    return (
        <footer className="bg-[#182b5c] text-white pt-16 pb-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
                    {/* Col 1: Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d0b216]">
                                <Shield className="h-6 w-6 text-[#182b5c]" />
                            </div>
                            <span className="font-bold text-xl text-[#d0b216]">KCAU Events</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">
                            The official platform for KCA University student activities, clubs, and events.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="#" className="text-white/50 hover:text-[#d0b216] transition" aria-label="Twitter">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-white/50 hover:text-[#d0b216] transition" aria-label="Instagram">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-white/50 hover:text-[#d0b216] transition" aria-label="LinkedIn">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Quick Links */}
                    <div>
                        <h4 className="font-bold text-[#d0b216] mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-2.5">
                            {[
                                { label: 'Home', href: '/' },
                                { label: 'Events', href: '/events' },
                                { label: 'Clubs', href: '/clubs' },
                                { label: 'Leaderboard', href: '/leaderboard' },
                                { label: 'Support', href: '/tickets/create' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-white/60 hover:text-white hover:pl-1 transition-all">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3: Contact */}
                    <div>
                        <h4 className="font-bold text-[#d0b216] mb-4 text-sm uppercase tracking-wider">Contact</h4>
                        <ul className="space-y-2.5 text-sm text-white/60">
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">📧</span>
                                <a href={`mailto:${email}`} className="hover:text-white transition">{email}</a>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">📞</span>
                                <a href={`tel:${phone}`} className="hover:text-white transition">{phone}</a>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">📍</span>
                                <span>Enterprise Road, Industrial Area, Nairobi, Kenya</span>
                            </li>
                        </ul>
                    </div>

                    {/* Col 4: Info */}
                    <div>
                        <h4 className="font-bold text-[#d0b216] mb-4 text-sm uppercase tracking-wider">About</h4>
                        <p className="text-sm text-white/60 leading-relaxed mb-4">
                            KCA University was founded in 1989 and is one of Kenya's leading universities in technology and commerce education.
                        </p>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#d0b216]/30 px-3 py-1.5 text-xs text-[#d0b216]/80">
                            <Sparkles className="h-3 w-3" />
                            Powered by KCAU AI
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
                    {footerText}
                </div>
            </div>
        </footer>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Welcome({
    featuredEvents,
    upcomingEvents,
    topClubs,
    stats,
    leaderboard = [],
    settings,
    auth,
}: Props) {
    const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [activeClubCategory, setActiveClubCategory] = useState<string>('all');

    const headline = setting(settings, 'hero_headline', 'Your University Life, Elevated.');
    const words = headline.split(' ');
    const lastWord = words.pop();
    const firstPart = words.join(' ');

    const filteredEvents = upcomingEvents.filter((e) => {
        const d = new Date(e.start_datetime);
        const now = new Date();
        if (activeFilter === 'today') return d.toDateString() === now.toDateString();
        if (activeFilter === 'week') {
            const weekAhead = new Date(now.getTime() + 7 * 86400000);
            return d >= now && d <= weekAhead;
        }
        if (activeFilter === 'month') {
            const monthAhead = new Date(now.getTime() + 30 * 86400000);
            return d >= now && d <= monthAhead;
        }
        return true;
    });

    const clubCategories = ['all', 'academic', 'sports', 'cultural', 'technology', 'social', 'religious'];
    const filteredClubs = topClubs.filter(
        (c) => activeClubCategory === 'all' || c.category === activeClubCategory
    );

    const showFeatured = setting(settings, 'show_featured_events', '1') === '1';
    const showClubs = setting(settings, 'show_clubs_section', '1') === '1';
    const showLeaderboard = setting(settings, 'show_leaderboard', '1') === '1';

    const allEvents = [...featuredEvents, ...upcomingEvents];

    return (
        <>
            <Head title="Welcome to KCAU Events">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700,800&display=swap"
                    rel="stylesheet"
                />
                <style>{`
                    @keyframes marquee {
                        from { transform: translateX(100%); }
                        to { transform: translateX(-100%); }
                    }
                    @keyframes float-slow {
                        0%, 100% { transform: translateY(0px) rotate(3deg); }
                        50% { transform: translateY(-12px) rotate(3deg); }
                    }
                    @keyframes float-slow-reverse {
                        0%, 100% { transform: translateY(0px) rotate(-2deg) translateY(-16px); }
                        50% { transform: translateY(-8px) rotate(-2deg) translateY(-16px); }
                    }
                    .animate-float { animation: float-slow 4s ease-in-out infinite; }
                    .animate-float-r { animation: float-slow-reverse 4.5s ease-in-out infinite; }
                    .card-glass {
                        background: rgba(255,255,255,0.08);
                        backdrop-filter: blur(12px);
                        border: 1px solid rgba(255,255,255,0.15);
                    }
                    .step-line::after {
                        content: '';
                        position: absolute;
                        top: 24px;
                        left: calc(50% + 24px);
                        width: calc(100% - 48px);
                        height: 2px;
                        background: linear-gradient(to right, #d0b216, #d0b21640);
                    }
                `}</style>
            </Head>

            <div className="min-h-screen bg-background font-sans text-foreground antialiased">
                {/* Announcement Banner */}
                <AnnouncementBanner settings={settings} />

                {/* Navbar */}
                <Navbar auth={auth} />

                {/* ── SECTION 1: HERO ──────────────────────────────────────────── */}
                <section className="relative flex min-h-screen items-center bg-[#182b5c] overflow-hidden pt-16">
                    {/* Animated orbs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#d0b216]/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#d0b216]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-[#d0b216]/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                    </div>

                    {/* Subtle grid pattern */}
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }}
                    />

                    <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* LEFT */}
                            <div>
                                {/* Badge */}
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d0b216]/40 bg-[#d0b216]/5 px-4 py-1.5 text-xs font-medium text-[#d0b216]/80">
                                    🎓 KCA University · Est. 1989
                                </div>

                                {/* Headline */}
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white">
                                    {firstPart}{' '}
                                    <span className="text-[#d0b216] relative">
                                        {lastWord}
                                        <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                                            <path d="M0 6 Q100 0 200 6" stroke="#d0b216" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                                        </svg>
                                    </span>
                                </h1>

                                {/* Subtitle */}
                                <p className="mt-7 max-w-lg text-xl text-white/70 leading-relaxed">
                                    {setting(settings, 'hero_subtitle', 'Discover clubs, register for events, earn points, and connect with thousands of KCA University students — all in one place.')}
                                </p>

                                {/* CTAs */}
                                <div className="mt-10 flex flex-wrap gap-4">
                                    <Link
                                        href="/events"
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#d0b216] px-8 py-3.5 font-bold text-[#182b5c] text-base shadow-lg shadow-[#d0b216]/25 hover:bg-[#b89b10] hover:scale-105 transition-all"
                                    >
                                        {setting(settings, 'hero_cta_primary', 'Explore Events')}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/clubs"
                                        className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-white font-semibold text-base hover:bg-white/10 hover:border-white/50 transition-all"
                                    >
                                        {setting(settings, 'hero_cta_secondary', 'Browse Clubs')}
                                    </Link>
                                </div>

                                {/* Animated stats */}
                                <div className="mt-12 flex flex-wrap gap-6">
                                    {[
                                        { value: stats.total_events, label: 'Events', suffix: '+' },
                                        { value: stats.active_clubs, label: 'Clubs', suffix: '' },
                                        { value: stats.total_students, label: 'Students', suffix: '+' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="flex flex-col items-center gap-1">
                                            <span className="text-3xl font-extrabold text-white">
                                                <CountUp to={stat.value} />
                                                {stat.suffix}
                                            </span>
                                            <span className="text-xs font-medium text-white/50 uppercase tracking-widest">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT — decorative floating cards */}
                            <div className="hidden lg:flex flex-col items-center justify-center relative h-[480px]">
                                {/* Main event card */}
                                <div className="animate-float absolute top-0 right-0 w-72 card-glass rounded-2xl p-5 shadow-2xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-[#d0b216] bg-[#d0b216]/15 px-2.5 py-1 rounded-full">
                                            📅 Upcoming
                                        </span>
                                        <span className="text-xs text-white/50 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> 2d 4h
                                        </span>
                                    </div>
                                    <h4 className="text-white font-bold text-sm mb-1">Annual Tech Summit 2025</h4>
                                    <p className="text-white/50 text-xs mb-3">ICT Club · Main Auditorium</p>
                                    <div className="space-y-1.5 mb-3">
                                        <div className="flex justify-between text-xs text-white/50">
                                            <span>120/200 spots</span>
                                            <span className="text-amber-400 font-medium">60% full</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                            <div className="h-full w-[60%] rounded-full bg-amber-400" />
                                        </div>
                                    </div>
                                    <button className="w-full rounded-lg bg-[#d0b216] py-2 text-xs font-bold text-[#182b5c] hover:bg-[#b89b10] transition">
                                        Register Now →
                                    </button>
                                </div>

                                {/* Club card */}
                                <div className="animate-float-r absolute bottom-10 left-0 w-64 card-glass rounded-2xl p-4 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-[#d0b216] flex items-center justify-center text-[#182b5c] font-black text-sm shrink-0">
                                            SC
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">Students Council</p>
                                            <p className="text-white/50 text-xs">Academic · 243 members</p>
                                        </div>
                                    </div>
                                    <p className="text-white/60 text-xs line-clamp-2 mb-3">Representing student interests and organizing campus governance activities.</p>
                                    <button className="w-full rounded-lg border border-[#d0b216]/40 py-1.5 text-xs font-bold text-[#d0b216] hover:bg-[#d0b216]/10 transition">
                                        Join Club
                                    </button>
                                </div>

                                {/* Points badge */}
                                <div className="absolute top-1/2 left-1/4 card-glass rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#d0b216] flex items-center justify-center">
                                        <Crown className="h-4 w-4 text-[#182b5c]" />
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-bold">+150 pts</p>
                                        <p className="text-white/50 text-[10px]">Event attended!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                        <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
                            <div className="w-1 h-2 rounded-full bg-white/40" />
                        </div>
                    </div>
                </section>

                {/* ── LIVE TICKER ───────────────────────────────────────────────── */}
                <LiveTicker events={allEvents} />

                {/* ── SECTION 2: FEATURED EVENTS ───────────────────────────────── */}
                {showFeatured && featuredEvents.length > 0 && (
                    <section className="bg-white dark:bg-background py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-10 flex items-end justify-between">
                                <div>
                                    <h2 className="border-l-4 border-[#d0b216] pl-4 text-3xl font-bold">Featured Events</h2>
                                    <p className="mt-1 pl-5 text-muted-foreground text-sm">Hand-picked highlights just for you</p>
                                </div>
                                <Link href="/events" className="flex items-center gap-1 font-semibold text-[#d0b216] hover:underline text-sm">
                                    View All <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#d0b216]/30">
                                {featuredEvents.map((event) => (
                                    <EventCard key={event.id} event={event} featured />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── SECTION 3: UPCOMING EVENTS GRID ──────────────────────────── */}
                {upcomingEvents.length > 0 && (
                    <section className="bg-gray-50 dark:bg-muted/20 py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold">Upcoming Events</h2>
                                    <p className="mt-1 text-muted-foreground text-sm">Don't miss what's happening on campus</p>
                                </div>
                                {/* Filters */}
                                <div className="flex gap-2 flex-wrap">
                                    {(['all', 'today', 'week', 'month'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setActiveFilter(f)}
                                            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all capitalize ${
                                                activeFilter === f
                                                    ? 'bg-[#182b5c] text-white shadow-md'
                                                    : 'bg-white dark:bg-muted border text-muted-foreground hover:border-[#182b5c]/30'
                                            }`}
                                        >
                                            {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {filteredEvents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredEvents.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-muted-foreground">
                                    <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>No events found for this period.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── SECTION 4: CLUBS SHOWCASE ─────────────────────────────────── */}
                {showClubs && topClubs.length > 0 && (
                    <section className="bg-white dark:bg-background py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mb-10 flex items-end justify-between">
                                <div>
                                    <h2 className="border-l-4 border-[#d0b216] pl-4 text-3xl font-bold">Clubs to Explore</h2>
                                    <p className="mt-1 pl-5 text-muted-foreground text-sm">Find your community on campus</p>
                                </div>
                                <Link href="/clubs" className="flex items-center gap-1 font-semibold text-[#d0b216] hover:underline text-sm">
                                    View All Clubs <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Category filter */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {clubCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveClubCategory(cat)}
                                        className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                                            activeClubCategory === cat
                                                ? 'bg-[#182b5c] text-white shadow-md'
                                                : 'bg-muted border text-muted-foreground hover:border-[#182b5c]/30'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {filteredClubs.length > 0 ? (
                                <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                                    {filteredClubs.map((club) => (
                                        <Link
                                            key={club.id}
                                            href={`/clubs/${club.slug}`}
                                            className="group flex flex-col rounded-2xl border bg-white dark:bg-card p-5 hover:shadow-lg hover:-translate-y-1 hover:border-[#d0b216]/40 transition-all duration-200"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <Avatar className="h-11 w-11 shrink-0 rounded-xl border-2 border-[#182b5c]/10">
                                                    {club.logo_url && <AvatarImage src={club.logo_url} alt={club.name} />}
                                                    <AvatarFallback className="bg-[#182b5c] text-white text-xs font-bold rounded-xl">
                                                        {getInitials(club.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <Badge variant="outline" className="text-[10px] capitalize mb-1 border-[#182b5c]/20">
                                                        {club.category}
                                                    </Badge>
                                                    <h3 className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-[#182b5c] transition">
                                                        {club.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-3">{club.description}</p>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />
                                                    {club.active_members_count ?? 0}
                                                </span>
                                                <span className="text-xs font-bold text-[#d0b216] group-hover:gap-1.5 flex items-center gap-1 transition-all">
                                                    Join Now <ArrowRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>No clubs in this category yet.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── SECTION 5: LEADERBOARD ────────────────────────────────────── */}
                {showLeaderboard && leaderboard.length > 0 && (
                    <section className="bg-[#182b5c] py-20">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-extrabold text-[#d0b216]">🏆 Top Students This Month</h2>
                                <p className="mt-2 text-white/60">Earn points by attending events and joining clubs</p>
                            </div>

                            <div className="space-y-3">
                                {leaderboard.slice(0, 5).map((entry, index) => {
                                    if (!entry.user) return null;
                                    const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600', 'text-white/60', 'text-white/60'];
                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-all ${
                                                index === 0
                                                    ? 'bg-[#d0b216]/20 border border-[#d0b216]/40 shadow-lg shadow-[#d0b216]/10'
                                                    : 'bg-white/5 border border-white/10 hover:bg-white/8'
                                            }`}
                                        >
                                            <div className={`w-8 text-center font-black text-xl ${rankColors[index]}`}>
                                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                            </div>
                                            <Avatar className="h-10 w-10 border-2 border-white/20">
                                                {entry.user.avatar && <AvatarImage src={entry.user.avatar} />}
                                                <AvatarFallback className="bg-[#d0b216] text-[#182b5c] text-xs font-bold">
                                                    {getInitials(entry.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-semibold text-sm truncate">{entry.user.name}</p>
                                                {entry.user.department && (
                                                    <p className="text-white/50 text-xs truncate">{entry.user.department}</p>
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold text-sm ${
                                                index === 0 ? 'bg-[#d0b216] text-[#182b5c]' : 'bg-white/10 text-[#d0b216]'
                                            }`}>
                                                <TrendingUp className="h-3.5 w-3.5" />
                                                {entry.total_points.toLocaleString()} pts
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-center mt-8">
                                <Link
                                    href="/leaderboard"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#d0b216]/40 px-6 py-3 text-sm font-semibold text-[#d0b216] hover:bg-[#d0b216]/10 transition"
                                >
                                    View Full Leaderboard <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── SECTION 6: HOW IT WORKS ───────────────────────────────────── */}
                <section className="bg-white dark:bg-background py-20">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold">How It Works</h2>
                            <p className="mt-3 text-muted-foreground">Get started in 3 simple steps</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {[
                                {
                                    num: '01',
                                    icon: <LogIn className="h-6 w-6 text-[#182b5c]" />,
                                    title: 'Sign In with Google',
                                    desc: 'Use your @students.kcau.ac.ke or @kcau.ac.ke account for instant, secure access.',
                                },
                                {
                                    num: '02',
                                    icon: <Users className="h-6 w-6 text-[#182b5c]" />,
                                    title: 'Join Clubs',
                                    desc: 'Browse clubs by category and become a member of the ones you love.',
                                },
                                {
                                    num: '03',
                                    icon: <CalendarCheck className="h-6 w-6 text-[#182b5c]" />,
                                    title: 'Attend Events',
                                    desc: 'Register, pay via M-Pesa, and get your digital check-in QR code.',
                                },
                            ].map((step, i) => (
                                <div key={step.num} className="relative flex flex-col items-center text-center px-4">
                                    {/* Connector line */}
                                    {i < 2 && (
                                        <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] right-[-50%] h-px bg-gradient-to-r from-[#d0b216]/60 to-[#d0b216]/10" />
                                    )}
                                    <div className="relative mb-5">
                                        <div className="h-20 w-20 rounded-2xl bg-[#d0b216] flex items-center justify-center shadow-lg shadow-[#d0b216]/30">
                                            {step.icon}
                                        </div>
                                        <span className="absolute -top-2 -right-2 text-xs font-black text-[#182b5c] bg-white rounded-full w-6 h-6 flex items-center justify-center shadow border border-[#d0b216]/30">
                                            {step.num}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-base mb-2">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SECTION 7: TESTIMONIALS ───────────────────────────────────── */}
                <section className="bg-gradient-to-br from-[#182b5c] to-[#0d1e42] py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-extrabold text-white">What Students Are Saying</h2>
                            <p className="mt-2 text-white/60">Real experiences from your fellow KCAUites</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {[
                                {
                                    name: 'Amina Wanjiku',
                                    year: '3rd Year · Bachelor of IT',
                                    quote: 'I found my passion in the Robotics Club through this platform. The event registration system is incredibly smooth — paid via M-Pesa in seconds!',
                                    initials: 'AW',
                                },
                                {
                                    name: 'Brian Otieno',
                                    year: '2nd Year · Bachelor of Commerce',
                                    quote: 'The leaderboard feature motivates me to attend more events. I\'m currently 3rd in my department and aiming for the top spot this semester!',
                                    initials: 'BO',
                                },
                                {
                                    name: 'Cynthia Njoroge',
                                    year: '4th Year · Bachelor of Accounting',
                                    quote: 'As a club leader, managing events here is a breeze. Check-in with QR codes, real-time attendance tracking — it\'s everything we needed.',
                                    initials: 'CN',
                                },
                            ].map((t) => (
                                <div
                                    key={t.name}
                                    className="rounded-2xl p-6 space-y-4"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-11 w-11 rounded-full bg-[#d0b216] flex items-center justify-center font-black text-[#182b5c] text-sm shrink-0">
                                            {t.initials}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">{t.name}</p>
                                            <p className="text-white/50 text-xs">{t.year}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-3.5 w-3.5 text-[#d0b216] fill-[#d0b216]" />
                                        ))}
                                    </div>
                                    <p className="text-white/75 text-sm italic leading-relaxed">"{t.quote}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SECTION 8: CTA BANNER ─────────────────────────────────────── */}
                <section className="bg-[#d0b216] py-20">
                    <div className="mx-auto max-w-3xl px-4 text-center">
                        <h2 className="text-4xl font-extrabold text-[#182b5c]">Ready to Get Involved?</h2>
                        <p className="mt-4 text-lg text-[#182b5c]/70">
                            Join thousands of KCA University students already using the platform
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#182b5c] px-10 py-4 font-bold text-white text-base hover:bg-[#0d1e42] transition-all hover:scale-105"
                                >
                                    Go to My Hub <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <a
                                    href="/auth/google/redirect"
                                    className="inline-flex items-center gap-3 rounded-xl bg-[#182b5c] px-10 py-4 font-bold text-white text-base hover:bg-[#0d1e42] transition-all hover:scale-105 shadow-xl"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Sign in with Google
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <Footer settings={settings} />
            </div>
        </>
    );
}
