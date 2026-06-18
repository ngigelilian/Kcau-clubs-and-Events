import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { BreadcrumbItem, PaginatedResponse, Event, Club } from '@/types';
import {
    CheckCircle2, X, Eye, MapPin, Calendar, Users,
    ArrowLeft, CheckCircle, Clock
} from 'lucide-react';
import { useState } from 'react';

interface PendingEvent extends Omit<Event, 'creator' | 'club'> {
    creator: { name: string; avatar?: string };
    club?: Club;
    cover_url?: string;
}

interface Props {
    pendingEvents: PaginatedResponse<PendingEvent>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Events', href: '/admin/events' },
    { title: 'Pending Approval', href: '/admin/events/approve' },
];

function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-KE', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
}

function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

export default function EventApproveQueue({ pendingEvents }: Props) {
    const [rejectEvent, setRejectEvent] = useState<PendingEvent | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    function handleApprove(id: number) {
        router.post(`/admin/events/${id}/approve`, {}, { preserveScroll: true });
    }

    function handleReject() {
        if (!rejectEvent) return;
        setProcessing(true);
        router.post(`/admin/events/${rejectEvent.id}/reject`, { reason: rejectReason }, {
            onSuccess: () => { setRejectEvent(null); setRejectReason(''); },
            onFinish: () => setProcessing(false),
        });
    }

    const isEmpty = pendingEvents.data.length === 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Event Approval Queue" />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Clock className="h-6 w-6 text-amber-500" />
                            Event Approval Queue
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {pendingEvents.total > 0
                                ? <>{pendingEvents.total} event{pendingEvents.total !== 1 ? 's' : ''} awaiting review</>
                                : 'No events pending approval'}
                        </p>
                    </div>
                    <Link href="/admin/events">
                        <Button variant="outline" size="sm" className="shrink-0">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            All Events
                        </Button>
                    </Link>
                </div>

                {/* Empty State */}
                {isEmpty ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-5">
                                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">All caught up!</p>
                                <p className="text-muted-foreground mt-1">No events pending approval right now.</p>
                            </div>
                            <Link href="/admin/events">
                                <Button variant="outline">
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Back to All Events
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {pendingEvents.data.map((event) => (
                            <Card key={event.id} className="overflow-hidden border-l-4 border-l-amber-400">
                                <CardContent className="p-0">
                                    <div className="flex gap-0 sm:gap-4 p-4 sm:p-5">
                                        {/* Cover */}
                                        <div className="hidden sm:block shrink-0">
                                            {event.cover_url ? (
                                                <img
                                                    src={event.cover_url}
                                                    alt={event.title}
                                                    className="w-32 h-20 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-32 h-20 rounded-lg bg-gradient-to-br from-[#182b5c] to-[#2a4494] flex items-center justify-center">
                                                    <Calendar className="h-8 w-8 text-white/40" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-start gap-2 flex-wrap">
                                                <h3 className="font-bold text-lg leading-tight flex-1">{event.title}</h3>
                                                <Badge variant="outline" className="shrink-0 capitalize text-xs">
                                                    {event.type === 'school' ? 'School-Wide' : 'Club'}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                {event.club && (
                                                    <span className="font-medium text-foreground">{event.club.name}</span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Avatar className="h-4 w-4">
                                                        <AvatarImage src={event.creator.avatar} />
                                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                                            {event.creator.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    by {event.creator.name}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {fmt(event.start_datetime)} {fmtTime(event.start_datetime)}
                                                    {' → '}
                                                    {fmt(event.end_datetime)} {fmtTime(event.end_datetime)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {event.venue}
                                                </span>
                                                {event.capacity && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        Capacity: {event.capacity}
                                                    </span>
                                                )}
                                                {event.is_paid && (
                                                    <span className="text-emerald-600 font-medium">
                                                        KES {(event.fee_amount / 100).toLocaleString('en-KE')}
                                                    </span>
                                                )}
                                            </div>

                                            {event.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                                    {event.description}
                                                </p>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                                <Link href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                        View Full Details
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleApprove(event.id)}
                                                >
                                                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => { setRejectEvent(event); setRejectReason(''); }}
                                                >
                                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <DataPagination data={pendingEvents} />
                    </div>
                )}
            </div>

            {/* Reject Dialog */}
            <Dialog open={!!rejectEvent} onOpenChange={(o) => !o && setRejectEvent(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {rejectEvent && (
                            <p className="text-sm text-muted-foreground">
                                You are rejecting <strong className="text-foreground">{rejectEvent.title}</strong>. Please provide a reason so the organizer can address the issues.
                            </p>
                        )}
                        <div className="space-y-1.5">
                            <Label>Rejection Reason</Label>
                            <Textarea
                                rows={4}
                                placeholder="e.g. The event description is incomplete. Please provide more details about the agenda and expected outcomes."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setRejectEvent(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            disabled={processing || !rejectReason.trim()}
                            onClick={handleReject}
                        >
                            <X className="mr-1.5 h-4 w-4" />
                            Reject Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
