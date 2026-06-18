import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem, Event, PaginatedResponse } from '@/types';
import { eventStatusBadge } from '@/lib/color-badges';
import {
    CalendarDays,
    CalendarX,
    Clock,
    LayoutGrid,
    List,
    MapPin,
    Plus,
    Search,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    events: PaginatedResponse<Event & { registered_count: number }>;
    filters: { search: string; type: string; filter: string; category: string };
    eventTypes: { value: string; label: string }[];
}

type ViewMode = 'grid' | 'list';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Events', href: '/events' }];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}
function formatMonthDay(iso: string) {
    const d = new Date(iso);
    return {
        month: d.toLocaleDateString('en-KE', { month: 'short' }).toUpperCase(),
        day: d.getDate().toString(),
    };
}

/** Returns a human-readable countdown string or null if in the past */
function getCountdown(dateStr: string): string | null {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    if (days > 7) return `${days}d away`;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function progressColor(pct: number) {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
}

function isUrgent(dateStr: string) {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return diff > 0 && diff < 86_400_000 * 2; // within 2 days
}

// Category pills config
const CATEGORY_PILLS = [
    { label: 'All', value: 'all' },
    { label: 'Club Events', value: 'club' },
    { label: 'School-Wide', value: 'school' },
    { label: 'Sports', value: 'sports' },
    { label: 'Academic', value: 'academic' },
    { label: 'Cultural', value: 'cultural' },
    { label: 'Technology', value: 'technology' },
    { label: 'Social', value: 'social' },
    { label: 'Religious', value: 'religious' },
];

// Tab config
const FILTER_TABS = [
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'This Week', value: 'this_week' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Past Events', value: 'past' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventGridCard({ event }: { event: Event & { registered_count: number } }) {
    const registered = event.registered_count ?? 0;
    const capacity = event.capacity ?? 0;
    const pct = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
    const countdown = getCountdown(event.start_datetime);
    const urgent = isUrgent(event.start_datetime);
    const isFree = !event.is_paid;

    return (
        <Card className="group overflow-hidden hover:shadow-xl hover:border-[#d0b216]/50 transition-all duration-200">
            {/* Cover */}
            <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gradient-to-br from-[#182b5c] to-[#0f1e42]">
                {event.cover_url ? (
                    <img
                        src={event.cover_url}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <CalendarDays className="h-10 w-10 text-white/25" />
                    </div>
                )}
                {/* Bottom gradient */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Date chip */}
                <span className="absolute bottom-2 left-3 rounded bg-[#d0b216] px-2 py-0.5 text-xs font-bold text-[#182b5c]">
                    {formatDate(event.start_datetime).split(',')[0]}
                </span>
                {/* Status badge */}
                <span className={`absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-medium capitalize ${eventStatusBadge(event.status)}`}>
                    {event.status}
                </span>
                {/* Price badge */}
                <span
                    className={`absolute top-2 right-2 rounded px-2 py-0.5 text-xs font-bold ${
                        isFree ? 'bg-white/80 text-gray-800' : 'bg-[#d0b216]/90 text-[#182b5c]'
                    }`}
                >
                    {isFree ? 'Free' : event.formatted_fee}
                </span>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
                <h3 className="font-semibold text-base line-clamp-2 group-hover:text-[#182b5c] transition">
                    {event.title}
                </h3>
                {event.club && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span className="inline-block h-2 w-2 rounded-full bg-[#182b5c]/40 shrink-0" />
                        {event.club.name}
                    </p>
                )}
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{event.venue}</span>
                </p>

                {/* Progress bar */}
                {capacity > 0 && (
                    <div className="space-y-1 pt-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{registered} / {capacity} spots</p>
                    </div>
                )}

                {/* Countdown chip */}
                {countdown && (
                    <p className={`flex items-center gap-1 text-xs font-medium ${urgent ? 'text-red-500' : 'text-amber-500'}`}>
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {countdown}
                    </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                    <Link href={`/events/${event.slug}`}>
                        <Button
                            size="sm"
                            className="bg-[#d0b216] text-[#182b5c] font-bold hover:bg-[#b89b10] text-xs px-3"
                        >
                            Register
                        </Button>
                    </Link>
                    <Link href={`/events/${event.slug}`}>
                        <Button variant="ghost" size="sm" className="text-xs px-3">
                            Details
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
}

function EventListRow({ event }: { event: Event & { registered_count: number } }) {
    const { month, day } = formatMonthDay(event.start_datetime);
    const isFree = !event.is_paid;

    return (
        <div className="flex items-center gap-4 border-b p-4 hover:bg-muted/50 transition last:border-0">
            {/* Thumbnail */}
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#182b5c] to-[#0f1e42]">
                {event.cover_url ? (
                    <img src={event.cover_url} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <CalendarDays className="h-5 w-5 text-white/30" />
                    </div>
                )}
            </div>

            {/* Date block */}
            <div className="w-12 shrink-0 text-center">
                <p className="text-xs uppercase text-muted-foreground leading-none">{month}</p>
                <p className="text-2xl font-bold text-[#182b5c] leading-tight">{day}</p>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-1">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    {event.club?.name && <span>{event.club.name} · </span>}
                    {event.venue}
                </p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
                <span className={`hidden sm:inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${eventStatusBadge(event.status)}`}>
                    {event.status}
                </span>
                <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                        isFree ? 'bg-muted text-muted-foreground' : 'bg-[#d0b216]/20 text-[#182b5c]'
                    }`}
                >
                    {isFree ? 'Free' : event.formatted_fee}
                </span>
                <Link href={`/events/${event.slug}`}>
                    <Button variant="outline" size="sm" className="text-xs border-[#d0b216]/50 hover:bg-[#d0b216]/10">
                        View
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EventIndex({ events, filters, eventTypes }: Props) {
    const { auth } = usePage().props as { auth: { user: { permissions: string[] } | null } };

    const [search, setSearch] = useState(filters.search ?? '');
    const [view, setView] = useState<ViewMode>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('events-view') as ViewMode) ?? 'grid';
        }
        return 'grid';
    });

    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get('/events', { ...filters, search }, { preserveState: true });
        }, 400);
        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [search]);

    function setViewMode(v: ViewMode) {
        setView(v);
        localStorage.setItem('events-view', v);
    }

    function handleCategory(value: string) {
        const typeParam = value === 'all' ? '' : value;
        // 'club' / 'school' go to `type`, category values go to `category`
        const isEventType = value === 'club' || value === 'school';
        router.get(
            '/events',
            {
                ...filters,
                search,
                type: isEventType ? typeParam : filters.type,
                category: !isEventType ? typeParam : filters.category,
            },
            { preserveState: true },
        );
    }

    function handleFilterTab(value: string) {
        router.get('/events', { ...filters, search, filter: value }, { preserveState: true });
    }

    const activeCategory =
        filters.category
            ? filters.category
            : filters.type
            ? filters.type
            : 'all';

    const showFeatured =
        (filters.filter === 'upcoming' || !filters.filter) &&
        !filters.search &&
        !filters.type &&
        events.data.length > 0;

    const [featuredEvent, ...restEvents] = events.data;
    const gridEvents = showFeatured ? restEvents : events.data;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                        <p className="text-muted-foreground">Discover what's happening at KCA University</p>
                    </div>
                    {auth.user && (
                        <Link href="/events/create">
                            <Button className="bg-[#182b5c] hover:bg-[#0f1e42] text-white">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Event
                            </Button>
                        </Link>
                    )}
                </div>

                {/* ── Category Pills ── */}
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                    {CATEGORY_PILLS.map((pill) => {
                        const active = pill.value === activeCategory;
                        return (
                            <button
                                key={pill.value}
                                onClick={() => handleCategory(pill.value)}
                                className={`shrink-0 snap-start rounded-full border px-4 py-1.5 text-sm font-medium cursor-pointer transition ${
                                    active
                                        ? 'bg-[#d0b216] border-[#d0b216] text-[#182b5c] font-bold'
                                        : 'bg-background border-border text-foreground hover:border-[#d0b216]'
                                }`}
                            >
                                {pill.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Filter row ── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search events..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Tab group */}
                    <div className="flex overflow-hidden rounded-lg border bg-muted/40 p-0.5 shrink-0">
                        {FILTER_TABS.map((tab) => {
                            const active = (filters.filter || 'upcoming') === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => handleFilterTab(tab.value)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                        active
                                            ? 'bg-white shadow text-[#182b5c] font-bold dark:bg-background'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* View toggle */}
                    <div className="flex shrink-0 overflow-hidden rounded-lg border bg-muted/40 p-0.5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-md p-1.5 transition ${view === 'grid' ? 'bg-white shadow dark:bg-background' : 'text-muted-foreground'}`}
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded-md p-1.5 transition ${view === 'list' ? 'bg-white shadow dark:bg-background' : 'text-muted-foreground'}`}
                            aria-label="List view"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                {events.data.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
                        <CalendarX className="mb-4 h-16 w-16 text-muted-foreground/40" />
                        <p className="text-lg font-medium">No events found</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {filters.search || filters.type || filters.category
                                ? 'Try adjusting your filters.'
                                : 'Check back soon for upcoming events!'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Featured spotlight */}
                        {showFeatured && featuredEvent && (
                            <div className="mb-6 overflow-hidden rounded-2xl border border-[#182b5c]/20 bg-[#182b5c]/5 flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="md:w-2/5 shrink-0 aspect-video rounded-l-none md:rounded-l-2xl overflow-hidden bg-gradient-to-br from-[#182b5c] to-[#0f1e42]">
                                    {featuredEvent.cover_url ? (
                                        <img
                                            src={featuredEvent.cover_url}
                                            alt={featuredEvent.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <CalendarDays className="h-16 w-16 text-white/25" />
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 p-6 flex flex-col justify-center space-y-3">
                                    <span className="inline-flex w-fit items-center rounded-full bg-[#d0b216]/20 px-3 py-0.5 text-xs font-bold text-[#d0b216]">
                                        ★ Featured Event
                                    </span>
                                    <h2 className="text-2xl font-bold line-clamp-2">{featuredEvent.title}</h2>
                                    {featuredEvent.description && (
                                        <p className="line-clamp-3 text-sm text-muted-foreground">{featuredEvent.description}</p>
                                    )}
                                    <div className="space-y-1 mt-1">
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <CalendarDays className="h-4 w-4 shrink-0" />
                                            {formatDate(featuredEvent.start_datetime)} · {formatTime(featuredEvent.start_datetime)}
                                        </p>
                                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0" />
                                            {featuredEvent.venue}
                                        </p>
                                    </div>
                                    <div className="pt-2">
                                        <Link href={`/events/${featuredEvent.slug}`}>
                                            <Button className="bg-[#d0b216] text-[#182b5c] font-bold hover:bg-[#b89b10]">
                                                Register Now →
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid / List */}
                        {view === 'grid' ? (
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {gridEvents.map((event) => (
                                    <EventGridCard key={event.id} event={event} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border overflow-hidden">
                                {events.data.map((event) => (
                                    <EventListRow key={event.id} event={event} />
                                ))}
                            </div>
                        )}

                        <DataPagination data={events} />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
