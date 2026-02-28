import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import type { BreadcrumbItem, Event } from '@/types';
import { CalendarDays, MapPin, Users, CheckCircle, XCircle, Ban, Flag } from 'lucide-react';

interface Props {
    event: Event;
}

function statusColor(status: string) {
    const map: Record<string, string> = {
        approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        draft: 'bg-gray-100 text-gray-800',
        rejected: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
}

export default function AdminEventShow({ event }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/events' },
        { title: 'Manage Events', href: '/admin/events' },
        { title: event.title, href: `/admin/events/${event.slug}` },
    ];

    const handleAction = (action: string) => {
        router.post(`/admin/events/${event.slug}/${action}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review - ${event.title}`} />
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className={statusColor(event.status)}>{event.status}</Badge>
                            <Badge variant="outline">{event.type}</Badge>
                        </div>
                        <h1 className="text-2xl font-bold">{event.title}</h1>
                        {event.club && <p className="text-muted-foreground">by {event.club.name}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {event.status === 'pending' && (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Approve this event?</AlertDialogTitle>
                                            <AlertDialogDescription>The event will be published and visible to all students.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction('approve')}>Approve</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive"><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Reject this event?</AlertDialogTitle>
                                            <AlertDialogDescription>The event will not be published.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction('reject')} className="bg-destructive text-destructive-foreground">Reject</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        {event.status === 'approved' && (
                            <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline"><Ban className="mr-2 h-4 w-4" />Cancel Event</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
                                            <AlertDialogDescription>All registrations will be cancelled.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction('cancel')} className="bg-destructive text-destructive-foreground">Cancel Event</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="outline" onClick={() => handleAction('complete')}><Flag className="mr-2 h-4 w-4" />Mark Complete</Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Cover */}
                {event.cover_url && (
                    <div className="aspect-[21/9] overflow-hidden rounded-xl bg-muted">
                        <img src={event.cover_url} alt={event.title} className="h-full w-full object-cover" />
                    </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent><div className="whitespace-pre-wrap">{event.description}</div></CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Event Info</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-primary" />{new Date(event.start_datetime).toLocaleString()}</div>
                            <div className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-primary" />{new Date(event.end_datetime).toLocaleString()}</div>
                            <Separator />
                            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{event.venue}</div>
                            {event.capacity && <div className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" />Capacity: {event.capacity}</div>}
                            <Separator />
                            <div className="text-sm"><span className="font-medium">Pricing:</span> {event.is_paid ? event.formatted_fee : 'Free'}</div>
                            {event.creator && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7"><AvatarImage src={event.creator.avatar} /><AvatarFallback>{event.creator.name?.charAt(0)}</AvatarFallback></Avatar>
                                        <span className="text-sm">{event.creator.name}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
