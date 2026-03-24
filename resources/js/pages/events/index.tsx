import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, Event, PaginatedResponse } from '@/types';
import { CalendarDays, MapPin, Plus, Search, Users, Clock } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';
import { eventStatusBadge } from '@/lib/color-badges';

interface EventType { value: string; label: string; }
interface Filters { search: string; type: string; filter: string; }
interface Props {
    events: PaginatedResponse<Event>;
    filters: Filters;
    eventTypes: EventType[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Events', href: '/events' }];

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

export default function EventIndex({ events, filters, eventTypes }: Props) {
    const { auth } = usePage().props as { auth: { user: { permissions: string[] } | null } };
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        router.get('/events', { search, type: filters.type, filter: filters.filter }, { preserveState: true });
    }, [search, filters]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        router.get('/events', { ...filters, search, [key]: value === 'all' ? '' : value }, { preserveState: true });
    }, [filters, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Events" />
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
                        <p className="text-muted-foreground">Discover and register for campus events</p>
                    </div>
                    {auth.user && (
                        <Link href="/events/create">
                            <Button><Plus className="mr-2 h-4 w-4" />Create Event</Button>
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                    </form>

                    <Select value={filters.type || 'all'} onValueChange={(v) => handleFilterChange('type', v)}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            {eventTypes.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.filter} onValueChange={(v) => handleFilterChange('filter', v)}>
                        <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="past">Past Events</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Event Grid */}
                {events.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {events.data.map((event) => (
                                <Link key={event.id} href={`/events/${event.slug}`} className="group">
                                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                                        <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-muted">
                                            {event.cover_url ? (
                                                <img src={event.cover_url} alt={event.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                <Badge className={eventStatusBadge(event.status)}>{event.status}</Badge>
                                                {event.is_paid && <Badge variant="secondary">{event.formatted_fee}</Badge>}
                                                {!event.is_paid && <Badge variant="outline" className="bg-background/80">Free</Badge>}
                                            </div>
                                        </div>
                                        <CardContent className="space-y-3 p-4">
                                            <div>
                                                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                                                {event.club && <p className="text-sm text-muted-foreground">{event.club.name}</p>}
                                            </div>
                                            <div className="space-y-1.5 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 shrink-0" />
                                                    <span>{formatDate(event.start_datetime)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 shrink-0" />
                                                    <span>{formatTime(event.start_datetime)} — {formatTime(event.end_datetime)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 shrink-0" />
                                                    <span className="line-clamp-1">{event.venue}</span>
                                                </div>
                                                {event.capacity && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 shrink-0" />
                                                        <span>{(event as any).registered_count ?? 0} / {event.capacity} registered</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                        <DataPagination data={events} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No events found</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {filters.search || filters.type ? 'Try adjusting your filters.' : 'Check back soon for upcoming events!'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
