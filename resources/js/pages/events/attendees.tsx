import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem, Event, EventRegistration, PaginatedResponse } from '@/types';
import { CheckCircle } from 'lucide-react';

interface Props {
    event: Event;
    registrations: PaginatedResponse<EventRegistration>;
}

export default function EventAttendees({ event, registrations }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.slug}` },
        { title: 'Attendees', href: `/events/${event.slug}/attendees` },
    ];

    const handleMarkAttendance = (userId: number) => {
        router.post(`/events/${event.slug}/attendees/${userId}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendees - ${event.title}`} />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Attendees</h1>
                    <p className="text-muted-foreground">{event.title}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Registered Participants ({registrations.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrations.data.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={reg.user?.avatar} />
                                                    <AvatarFallback>{reg.user?.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{reg.user?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{reg.user?.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{reg.user?.student_id || '—'}</TableCell>
                                        <TableCell>
                                            <Badge variant={reg.status === 'attended' ? 'default' : 'secondary'}>
                                                {reg.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {reg.status !== 'attended' && (
                                                <Button size="sm" variant="outline" onClick={() => handleMarkAttendance(reg.user_id)}>
                                                    <CheckCircle className="mr-1 h-3.5 w-3.5" />Mark Attended
                                                </Button>
                                            )}
                                            {reg.status === 'attended' && (
                                                <span className="text-sm text-green-600 flex items-center gap-1 justify-end">
                                                    <CheckCircle className="h-4 w-4" /> Attended
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="mt-4">
                            <DataPagination data={registrations} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
