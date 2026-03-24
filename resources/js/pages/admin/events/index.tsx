import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem, Event, PaginatedResponse } from '@/types';
import { CalendarDays, MapPin, Eye } from 'lucide-react';
import { useCallback } from 'react';
import { eventStatusBadge } from '@/lib/color-badges';

interface Filters { status: string; }
interface Props {
    events: PaginatedResponse<Event>;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/events' },
    { title: 'Manage Events', href: '/admin/events' },
];

export default function AdminEventIndex({ events, filters }: Props) {
    const handleStatusFilter = useCallback((value: string) => {
        router.get('/admin/events', { status: value === 'all' ? '' : value }, { preserveState: true });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Events" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manage Events</h1>
                        <p className="text-muted-foreground">Review and approve event submissions</p>
                    </div>
                    <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Club</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.data.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            <p className="font-medium">{event.title}</p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</p>
                                        </TableCell>
                                        <TableCell className="text-sm">{event.club?.name || 'School-Wide'}</TableCell>
                                        <TableCell className="text-sm">{new Date(event.start_datetime).toLocaleDateString()}</TableCell>
                                        <TableCell><Badge className={eventStatusBadge(event.status)}>{event.status}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{event.type}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/events/${event.slug}`}>
                                                <Button variant="ghost" size="sm"><Eye className="mr-1 h-4 w-4" />Review</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {events.data.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No events found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DataPagination data={events} />
            </div>
        </AppLayout>
    );
}
