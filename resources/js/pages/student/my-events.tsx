import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import DataPagination from '@/components/shared/data-pagination';
import type {
    BreadcrumbItem, PaginatedResponse, EventRegistration, Event,
} from '@/types';
import type { User } from '@/types/auth';
import {
    CalendarDays, CalendarCheck, Clock, MapPin, QrCode,
    CalendarX, Star, Download, Copy, X, RotateCcw,
} from 'lucide-react';
import { useState } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(d: string) {
    return new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}
function initials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

type ExtendedRegistration = EventRegistration & {
    event: Event & { cover_url?: string };
    check_in_token?: string | null;
    is_waitlisted?: boolean;
    waitlist_position?: number | null;
};

interface Props {
    registrations: PaginatedResponse<ExtendedRegistration>;
    tab: string;
    counts: { upcoming: number; past: number; waitlisted: number; cancelled: number };
}

// ─── QR Dialog ───────────────────────────────────────────────────────────────

function QrDialog({
    open, onClose, token, eventTitle, userName,
}: { open: boolean; onClose: () => void; token: string; eventTitle: string; userName: string }) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(token)}`;
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(token).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm text-center">
                <DialogHeader>
                    <DialogTitle className="text-center">My QR Code</DialogTitle>
                </DialogHeader>
                <p className="font-semibold text-sm">{eventTitle}</p>
                <p className="text-xs text-muted-foreground">{userName}</p>
                <div className="flex justify-center py-3">
                    <img src={qrUrl} alt="Check-in QR" className="rounded-xl border w-52 h-52" />
                </div>
                <code className="block font-mono text-xs bg-muted rounded px-2 py-1 break-all">{token}</code>
                <div className="flex gap-2 justify-center pt-2">
                    <a href={qrUrl} download="qr-code.png" target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                            <Download className="w-3 h-3" /> Download QR
                        </Button>
                    </a>
                    <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                        <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy Token'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: string }) {
    const config: Record<string, { icon: React.ReactNode; title: string; sub: string }> = {
        upcoming: {
            icon: <CalendarDays className="w-12 h-12 text-muted-foreground/50" />,
            title: 'No upcoming events',
            sub: 'Register for an event to see it here.',
        },
        past: {
            icon: <CalendarCheck className="w-12 h-12 text-muted-foreground/50" />,
            title: 'No past events',
            sub: 'Events you have attended will appear here.',
        },
        waitlisted: {
            icon: <Clock className="w-12 h-12 text-muted-foreground/50" />,
            title: 'Not on any waitlist',
            sub: 'Waitlisted events will appear here.',
        },
        cancelled: {
            icon: <CalendarX className="w-12 h-12 text-muted-foreground/50" />,
            title: 'No cancelled registrations',
            sub: 'You haven\'t cancelled any registrations.',
        },
    };
    const c = config[tab] ?? config.upcoming;
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
            {c.icon}
            <p className="font-semibold text-lg">{c.title}</p>
            <p className="text-sm text-muted-foreground">{c.sub}</p>
            <Link href="/events">
                <Button className="mt-2 bg-[#182b5c] hover:bg-[#1e3a7a]">Browse Events</Button>
            </Link>
        </div>
    );
}

// ─── Status Ribbon ────────────────────────────────────────────────────────────

function StatusRibbon({ reg }: { reg: ExtendedRegistration }) {
    if (reg.is_waitlisted) {
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Waitlisted</Badge>;
    }
    if (reg.status === 'cancelled') {
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Cancelled</Badge>;
    }
    if (reg.status === 'attended') {
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Attended</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 border-green-200">Registered</Badge>;
}

// ─── Registration Card ────────────────────────────────────────────────────────

function RegistrationCard({
    reg, tab, onQr, user,
}: { reg: ExtendedRegistration; tab: string; onQr: (token: string, title: string) => void; user: User }) {
    const ev = reg.event;
    const isUpcoming = tab === 'upcoming';
    const isPast = tab === 'past';
    const isWaitlisted = tab === 'waitlisted' || !!reg.is_waitlisted;
    const isCancelled = tab === 'cancelled' || reg.status === 'cancelled';
    const isAttended = reg.status === 'attended';
    const hasNoFeedback = isPast && isAttended && !ev.user_feedback;

    function handleCancel() {
        if (confirm('Cancel your registration for this event?')) {
            router.delete(`/events/${ev.slug}/register`);
        }
    }
    function handleLeaveWaitlist() {
        if (confirm('Remove yourself from the waitlist?')) {
            router.delete(`/events/${ev.slug}/waitlist`);
        }
    }

    return (
        <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
            {/* Cover */}
            <div className="aspect-video relative">
                {ev.cover_url ? (
                    <img src={ev.cover_url} alt={ev.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#182b5c] to-[#1e3a7a]" />
                )}
                <div className="absolute top-2 right-2">
                    <StatusRibbon reg={reg} />
                </div>
            </div>

            <CardContent className="p-4">
                <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-1">{ev.title}</h3>
                {ev.club && (
                    <p className="text-xs text-muted-foreground mb-2">{ev.club.name}</p>
                )}

                <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="w-3 h-3 flex-shrink-0" />
                        <span>{formatDate(ev.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{formatTime(ev.start_datetime)} – {formatTime(ev.end_datetime)}</span>
                    </div>
                    {ev.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{ev.venue}</span>
                        </div>
                    )}
                </div>

                <Separator className="mb-3" />

                <div className="flex flex-wrap gap-2 items-center">
                    <Link href={`/events/${ev.slug}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">View Event</Button>
                    </Link>

                    {isUpcoming && !isWaitlisted && reg.check_in_token && (
                        <Button size="sm" variant="outline"
                            className="h-7 text-xs gap-1 text-[#182b5c] border-[#182b5c]"
                            onClick={() => onQr(reg.check_in_token!, ev.title)}>
                            <QrCode className="w-3 h-3" /> My QR Code
                        </Button>
                    )}

                    {isUpcoming && !isWaitlisted && (
                        <Button size="sm" variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={handleCancel}>
                            <X className="w-3 h-3 mr-0.5" /> Cancel
                        </Button>
                    )}

                    {hasNoFeedback && (
                        <Link href={`/events/${ev.slug}#feedback`}>
                            <Button size="sm" variant="outline"
                                className="h-7 text-xs gap-1 text-amber-600 border-amber-300">
                                <Star className="w-3 h-3" /> Leave Feedback
                            </Button>
                        </Link>
                    )}

                    {isWaitlisted && (
                        <>
                            <Badge className="bg-amber-100 text-amber-700 text-xs h-7 flex items-center">
                                Position #{reg.waitlist_position ?? '—'}
                            </Badge>
                            <Button size="sm" variant="ghost"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={handleLeaveWaitlist}>
                                Leave Waitlist
                            </Button>
                        </>
                    )}

                    {isCancelled && ev.is_registration_open && (
                        <Link href={`/events/${ev.slug}`}>
                            <Button size="sm" variant="outline"
                                className="h-7 text-xs gap-1 text-[#182b5c] border-[#182b5c]">
                                <RotateCcw className="w-3 h-3" /> Re-register
                            </Button>
                        </Link>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Events', href: '/student/my-events' },
];

const TABS = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'waitlisted', label: 'Waitlisted' },
    { value: 'cancelled', label: 'Cancelled' },
] as const;

export default function MyEvents({ registrations, tab, counts }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth.user;

    const [qrState, setQrState] = useState<{ token: string; title: string } | null>(null);

    function switchTab(value: string) {
        router.get('/student/my-events', { tab: value }, { preserveState: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Events" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">My Events</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage all your event registrations</p>
                </div>

                {/* Tab Bar */}
                <div className="flex gap-2 flex-wrap border-b pb-0">
                    {TABS.map((t) => {
                        const count = counts[t.value];
                        const active = tab === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => switchTab(t.value)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                                    active
                                        ? 'border-[#182b5c] text-[#182b5c]'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}>
                                {t.label}
                                {count > 0 && (
                                    <Badge className={`text-xs h-5 px-1.5 ${active ? 'bg-[#182b5c] text-white' : 'bg-muted text-muted-foreground'}`}>
                                        {count}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Grid or Empty */}
                {registrations.data.length === 0 ? (
                    <EmptyState tab={tab} />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {registrations.data.map((reg) => (
                                <RegistrationCard
                                    key={reg.id}
                                    reg={reg}
                                    tab={tab}
                                    onQr={(token, title) => setQrState({ token, title })}
                                    user={user}
                                />
                            ))}
                        </div>
                        <DataPagination data={registrations} />
                    </>
                )}
            </div>

            {qrState && (
                <QrDialog
                    open={!!qrState}
                    onClose={() => setQrState(null)}
                    token={qrState.token}
                    eventTitle={qrState.title}
                    userName={user.name}
                />
            )}
        </AppLayout>
    );
}
