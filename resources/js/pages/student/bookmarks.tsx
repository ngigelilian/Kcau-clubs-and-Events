import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays, MapPin, Clock, BookmarkX, Trash2, Users,
} from 'lucide-react';
import DataPagination from '@/components/shared/data-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedResponse, Event } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(d: string) {
    return new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

// ─── types ────────────────────────────────────────────────────────────────────

type BookmarkEntry = { id: number; event: Event & { registered_count?: number; cover_url?: string } };

interface Props {
    bookmarks: PaginatedResponse<BookmarkEntry>;
}

// ─── main ─────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Bookmarks', href: '/student/bookmarks' },
];

export default function Bookmarks({ bookmarks }: Props) {
    function removeBookmark(slug: string) {
        router.post(`/events/${slug}/bookmark`, {}, {
            preserveScroll: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Bookmarks" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            My Bookmarks
                            {bookmarks.total > 0 && (
                                <Badge className="bg-[#182b5c] text-white ml-2">
                                    {bookmarks.total}
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Events you've saved for later</p>
                    </div>
                </div>

                {/* Empty state */}
                {bookmarks.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <BookmarkX className="w-14 h-14 text-muted-foreground/40" />
                        <p className="text-lg font-semibold">No bookmarked events yet</p>
                        <p className="text-sm text-muted-foreground">Save events you're interested in and they'll appear here.</p>
                        <Link href="/events">
                            <Button className="bg-[#182b5c] hover:bg-[#1e3a7a] mt-1">Browse Events</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {bookmarks.data.map(({ id, event: ev }) => (
                                <Card key={id} className="relative overflow-hidden hover:shadow-md transition-shadow group">
                                    {/* Cover */}
                                    <div className="aspect-video relative overflow-hidden">
                                        {ev.cover_url ? (
                                            <img src={ev.cover_url} alt={ev.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#182b5c] to-[#1e3a7a]" />
                                        )}

                                        {/* Remove bookmark button */}
                                        <button
                                            onClick={() => removeBookmark(ev.slug)}
                                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-destructive rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove bookmark">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Status badge */}
                                        {ev.status === 'cancelled' && (
                                            <Badge className="absolute bottom-2 left-2 bg-red-600 text-white text-xs">
                                                Cancelled
                                            </Badge>
                                        )}
                                        {ev.status === 'completed' && (
                                            <Badge className="absolute bottom-2 left-2 bg-slate-600 text-white text-xs">
                                                Ended
                                            </Badge>
                                        )}
                                    </div>

                                    <CardContent className="p-4">
                                        {/* Event type + category */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {ev.club && (
                                                <Badge variant="outline" className="text-xs">{ev.club.name}</Badge>
                                            )}
                                            {ev.is_paid && (
                                                <Badge className="bg-[#d0b216]/20 text-amber-700 text-xs">
                                                    {ev.formatted_fee ?? 'Paid'}
                                                </Badge>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-2">{ev.title}</h3>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <CalendarDays className="w-3 h-3 flex-shrink-0" />
                                                <span>{formatDate(ev.start_datetime)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                <span>{formatTime(ev.start_datetime)}</span>
                                            </div>
                                            {ev.venue && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{ev.venue}</span>
                                                </div>
                                            )}
                                            {ev.registered_count !== undefined && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Users className="w-3 h-3 flex-shrink-0" />
                                                    <span>
                                                        {ev.registered_count} registered
                                                        {ev.capacity ? ` / ${ev.capacity} capacity` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 flex gap-2">
                                            <Link href={`/events/${ev.slug}`} className="flex-1">
                                                <Button size="sm"
                                                    className="w-full h-8 text-xs bg-[#182b5c] hover:bg-[#1e3a7a]">
                                                    View Event
                                                </Button>
                                            </Link>
                                            {ev.is_registration_open && ev.status === 'approved' && (
                                                <Link href={`/events/${ev.slug}`}>
                                                    <Button size="sm" variant="outline"
                                                        className="h-8 text-xs border-[#d0b216] text-amber-700">
                                                        Register
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <DataPagination data={bookmarks} />
                    </>
                )}
            </div>
        </AppLayout>
    );
}
