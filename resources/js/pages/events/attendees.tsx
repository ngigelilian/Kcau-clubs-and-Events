import { Head, router } from '@inertiajs/react';
import {
    Users, UserCheck, UserX, Clock, Search, Download,
    QrCode, AlertCircle, ArrowUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import DataPagination from '@/components/shared/data-pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Event, EventRegistration, PaginatedResponse } from '@/types';

interface AttendeeRegistration extends Omit<EventRegistration, 'user'> {
    user: { id: number; name: string; email: string; avatar: string; student_id: string };
    check_in_token: string | null;
    is_waitlisted: boolean;
    waitlist_position: number | null;
    checked_in_at: string | null;
}

interface Props {
    event: Event;
    registrations: PaginatedResponse<AttendeeRegistration>;
    stats: { total: number; attended: number; cancelled: number; waitlisted: number };
}

function fmtDate(str: string | null) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(str: string | null) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ reg }: { reg: AttendeeRegistration }) {
    if (reg.is_waitlisted) {
        return (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                Waitlist #{reg.waitlist_position}
            </Badge>
        );
    }
    if (reg.status === 'attended') return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300">Attended</Badge>;
    if (reg.status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300">Registered</Badge>;
}

export default function EventAttendees({ event, registrations, stats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.slug}` },
        { title: 'Attendees', href: `/events/${event.slug}/attendees` },
    ];

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [qrTarget, setQrTarget] = useState<AttendeeRegistration | null>(null);
    const [copied, setCopied] = useState(false);

    const filtered = useMemo(() => registrations.data.filter(r => {
        if (statusFilter !== 'all') {
            if (statusFilter === 'waitlisted' && !r.is_waitlisted) return false;
            if (statusFilter !== 'waitlisted' && r.status !== statusFilter) return false;
        }
        if (search) {
            const q = search.toLowerCase();
            return (
                r.user.name.toLowerCase().includes(q) ||
                r.user.email.toLowerCase().includes(q) ||
                r.user.student_id?.toLowerCase().includes(q)
            );
        }
        return true;
    }), [registrations.data, search, statusFilter]);

    const mainRows = filtered.filter(r => !r.is_waitlisted);
    const waitlistRows = filtered.filter(r => r.is_waitlisted);

    const allMainIds = mainRows.map(r => r.id);
    const allSelected = allMainIds.length > 0 && allMainIds.every(id => selectedIds.includes(id));

    function toggleAll() {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(allMainIds);
    }

    function toggleOne(id: number) {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }

    function handleMarkAttendance(reg: AttendeeRegistration) {
        router.post(`/events/${event.slug}/attendees/${reg.user.id}/mark-attendance`);
    }

    function handleBulkMarkAttended() {
        router.post(`/events/${event.slug}/attendees/bulk-mark-attendance`, { ids: selectedIds });
    }

    const checkInUrl = qrTarget?.check_in_token
        ? `${window.location.origin}/events/${event.slug}/check-in/${qrTarget.check_in_token}`
        : '';
    const qrSrc = checkInUrl
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(checkInUrl)}`
        : '';

    function handleCopyLink() {
        if (!checkInUrl) return;
        navigator.clipboard.writeText(checkInUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Attendees — ${event.title}`} />

            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manage Attendees</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track registrations and check-in status for <span className="font-medium text-foreground">{event.title}</span>
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5">
                        <div className="rounded-xl bg-blue-100 dark:bg-blue-900 p-3 shrink-0">
                            <Users className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">Total Registered</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-5">
                        <div className="rounded-xl bg-green-100 dark:bg-green-900 p-3 shrink-0">
                            <UserCheck className="h-5 w-5 text-green-700 dark:text-green-300" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.attended}</p>
                            <p className="text-sm text-muted-foreground">Attended</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                        <div className="rounded-xl bg-destructive/10 p-3 shrink-0">
                            <UserX className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-destructive">{stats.cancelled}</p>
                            <p className="text-sm text-muted-foreground">Cancelled</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-5">
                        <div className="rounded-xl bg-amber-100 dark:bg-amber-900 p-3 shrink-0">
                            <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.waitlisted}</p>
                            <p className="text-sm text-muted-foreground">Waitlisted</p>
                        </div>
                    </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name, email, student ID..."
                            className="pl-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="registered">Registered</SelectItem>
                            <SelectItem value="attended">Attended</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="waitlisted">Waitlisted</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => { window.location.href = `/events/${event.slug}/attendees/export`; }}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <span className="text-sm text-muted-foreground ml-auto">
                        Showing {filtered.length} of {registrations.total} attendees
                    </span>
                </div>

                {/* Main Table */}
                <div className="rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="rounded border-border"
                                    />
                                </TableHead>
                                <TableHead>Attendee</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Registered</TableHead>
                                <TableHead>Checked In</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mainRows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        No attendees match your filters
                                    </TableCell>
                                </TableRow>
                            )}
                            {mainRows.map(r => (
                                <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(r.id)}
                                            onChange={() => toggleOne(r.id)}
                                            className="rounded border-border"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 shrink-0">
                                                <AvatarImage src={r.user.avatar} />
                                                <AvatarFallback className="bg-[#182b5c]/10 text-[#182b5c] font-semibold text-sm">
                                                    {r.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm leading-tight">{r.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{r.user.student_id || '—'}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{r.user.email}</TableCell>
                                    <TableCell><StatusBadge reg={r} /></TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{fmtDate(r.registered_at)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{fmtDateTime(r.checked_in_at ?? null)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {r.status === 'registered' && !r.is_waitlisted && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMarkAttendance(r)}
                                                    className="h-8 text-xs"
                                                >
                                                    <UserCheck className="mr-1 h-3.5 w-3.5" />
                                                    Mark Attended
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQrTarget(r)}
                                                className="h-8 text-xs"
                                            >
                                                <QrCode className="mr-1 h-3.5 w-3.5" />
                                                QR Code
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DataPagination data={registrations} />

                {/* Waitlist Section */}
                {stats.waitlisted > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden mt-8">
                        <div className="bg-amber-100 dark:bg-amber-900 px-6 py-3 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                            <span className="font-semibold text-amber-800 dark:text-amber-200">
                                Waitlist ({stats.waitlisted} people)
                            </span>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-amber-200 dark:border-amber-800 hover:bg-amber-100/50 dark:hover:bg-amber-900/50">
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead>Attendee</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Registered</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {waitlistRows.map(r => (
                                    <TableRow key={r.id} className="border-amber-200 dark:border-amber-800 hover:bg-amber-100/30 dark:hover:bg-amber-900/30 transition-colors">
                                        <TableCell></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 shrink-0">
                                                    <AvatarImage src={r.user.avatar} />
                                                    <AvatarFallback className="bg-amber-200 text-amber-800 font-semibold text-sm">
                                                        {r.user.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm leading-tight">{r.user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{r.user.student_id || '—'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{r.user.email}</TableCell>
                                        <TableCell><StatusBadge reg={r} /></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{fmtDate(r.registered_at)}</TableCell>
                                        <TableCell className="font-medium text-amber-800 dark:text-amber-300">
                                            #{r.waitlist_position}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs border-amber-300 hover:bg-amber-100"
                                                onClick={() => router.post(`/events/${event.slug}/attendees/${r.user.id}/promote`)}
                                            >
                                                <ArrowUp className="mr-1 h-3.5 w-3.5" />
                                                Promote
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

            </div>

            {/* QR Code Modal */}
            <Dialog open={!!qrTarget} onOpenChange={() => setQrTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Check-in QR Code</DialogTitle>
                        <DialogDescription>Scan at event entrance</DialogDescription>
                    </DialogHeader>
                    {qrTarget && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={qrTarget.user.avatar} />
                                    <AvatarFallback className="bg-[#182b5c]/10 text-[#182b5c] font-semibold">
                                        {qrTarget.user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{qrTarget.user.name}</p>
                                    <p className="text-xs text-muted-foreground">{qrTarget.user.student_id}</p>
                                </div>
                            </div>

                            {qrTarget.check_in_token ? (
                                <>
                                    <img
                                        src={qrSrc}
                                        alt="QR Code"
                                        className="mx-auto rounded-xl border p-2 bg-white"
                                        width={250}
                                        height={250}
                                    />
                                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded select-all block text-center mt-2 break-all">
                                        {qrTarget.check_in_token}
                                    </code>
                                    <div className="flex gap-2 mt-2">
                                        <a href={qrSrc} download="qr-checkin.png" className="flex-1">
                                            <Button variant="outline" className="w-full text-xs h-9">
                                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                                Download QR
                                            </Button>
                                        </a>
                                        <Button variant="outline" className="flex-1 text-xs h-9" onClick={handleCopyLink}>
                                            {copied ? 'Copied!' : 'Copy Link'}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Present this QR code or share it with the attendee for event check-in
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No check-in token generated for this attendee.
                                </p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bulk Action Banner */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-0 inset-x-0 z-50 bg-[#182b5c] text-white py-3 px-6 flex items-center justify-between shadow-2xl">
                    <span className="font-medium">{selectedIds.length} attendee{selectedIds.length !== 1 ? 's' : ''} selected</span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            className="bg-[#d0b216] text-[#182b5c] font-bold hover:bg-[#b89d12]"
                            onClick={handleBulkMarkAttended}
                        >
                            <UserCheck className="mr-1.5 h-4 w-4" />
                            Mark All Attended
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
