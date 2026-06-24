import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays, MapPin, Users, Clock, ArrowLeft, Share2, CheckCircle,
    Edit2, Copy, Timer, CalendarX, AlertCircle, CalendarCheck, Ticket,
    Star, MessageSquare, ThumbsUp
} from 'lucide-react';
import type { FormEvent} from 'react';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { eventStatusBadge } from '@/lib/color-badges';
import type { BreadcrumbItem, Event, EventRegistration, EventSession, EventFeedback, EventFeedbackStats } from '@/types';

// ============================================================
// Extended Types
// ============================================================

interface ExtendedEvent extends Event {
    sessions: EventSession[];
    feedback_stats: EventFeedbackStats | null;
    waitlist_count: number;
    registered_count: number;
    user_feedback: EventFeedback | null;
    recent_feedback: (EventFeedback & { user: { name: string; avatar: string } })[];
}

interface ExtendedRegistration extends EventRegistration {
    check_in_token: string | null;
    is_waitlisted: boolean;
    waitlist_position: number | null;
}

interface Props {
    event: ExtendedEvent;
    userRegistration: ExtendedRegistration | null;
    relatedEvents: (Event & { registered_count: number })[];
}

// ============================================================
// Helper Functions
// ============================================================

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-KE', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
}

function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function getTimeLeft(dateStr: string) {
    const diff = Math.max(0, new Date(dateStr).getTime() - new Date().getTime());
    return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        done: diff === 0,
    };
}

function getDuration(start: string, end: string) {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ============================================================
// Sub-components
// ============================================================

function StarRating({
    value,
    onChange,
    readonly = false,
}: {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
}) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    onClick={() => !readonly && onChange?.(star)}
                    className={`text-3xl transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                >
                    <span style={{ color: star <= (hovered || value) ? '#d0b216' : '#d1d5db' }}>★</span>
                </button>
            ))}
        </div>
    );
}

function CountdownTimer({ dateStr }: { dateStr: string }) {
    const [tl, setTl] = useState(getTimeLeft(dateStr));

    useEffect(() => {
        const t = setInterval(() => setTl(getTimeLeft(dateStr)), 1000);
        return () => clearInterval(t);
    }, [dateStr]);

    if (tl.done) {
        return <div className="text-center text-muted-foreground text-sm">Event has started</div>;
    }

    const isUrgent = tl.days === 0;

    return (
        <div>
            <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
                Event starts in
            </p>
            <div className="grid grid-cols-4 gap-2 text-center">
                {[
                    { val: tl.days, label: 'Days' },
                    { val: tl.hours, label: 'Hours' },
                    { val: tl.minutes, label: 'Min' },
                    { val: tl.seconds, label: 'Sec' },
                ].map(({ val, label }) => (
                    <div key={label} className="flex flex-col items-center">
                        <div
                            className={`text-2xl font-mono font-bold rounded-lg p-2 w-full text-center ${
                                isUrgent
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                    : 'bg-[#182b5c]/5 text-[#182b5c] dark:bg-[#182b5c]/20 dark:text-blue-300'
                            }`}
                        >
                            {String(val).padStart(2, '0')}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Main Component
// ============================================================

export default function EventShow({ event, userRegistration, relatedEvents }: Props) {
    const { auth } = usePage().props as {
        auth: { user: { id: number; name: string; avatar?: string; phone?: string; permissions: string[]; roles: string[] } | null };
    };
    const user = auth.user;
    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super-admin');

    // M-Pesa dialog
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? '');

    // Share dialog
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // Feedback form
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(true);
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.slug}` },
    ];

    const handleRegister = () => {
        if (event.is_paid) {
            setPhoneDialogOpen(true);
            return;
        }
        router.post(`/events/${event.slug}/register`);
    };

    const handlePaidRegistration = (e: FormEvent) => {
        e.preventDefault();
        router.post(
            `/events/${event.slug}/register`,
            { phone_number: phoneNumber || undefined },
            { onSuccess: () => setPhoneDialogOpen(false) },
        );
    };

    const handleCancelRegistration = () => {
        if (confirm('Cancel your registration for this event?')) {
            router.delete(`/events/${event.slug}/register`);
        }
    };

    const handleLeaveWaitlist = () => {
        if (confirm('Leave the waitlist for this event?')) {
            router.delete(`/events/${event.slug}/register`);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSubmitFeedback = (e: FormEvent) => {
        e.preventDefault();
        if (feedbackRating === 0) return;
        setSubmittingFeedback(true);
        router.post(
            `/events/${event.slug}/feedback`,
            { rating: feedbackRating, comment: feedbackComment, would_recommend: wouldRecommend },
            { onFinish: () => setSubmittingFeedback(false) },
        );
    };

    // Derived values
    const hasSessions = event.sessions && event.sessions.length > 0;
    const speakers = hasSessions
        ? Array.from(
            new Map(
                event.sessions
                    .filter((s) => s.speaker_name)
                    .map((s) => [
                        s.speaker_name,
                        {
                            name: s.speaker_name!,
                            bio: s.speaker_bio,
                            avatar_url: s.speaker_avatar_url,
                            sessions: event.sessions.filter((ss) => ss.speaker_name === s.speaker_name).map((ss) => ss.title),
                        },
                    ]),
            ).values(),
        )
        : [];
    const hasSpeakers = speakers.length > 0;
    const isCompleted = event.status === 'completed';
    const isUpcoming = event.status === 'approved';

    const capacityPercent = event.capacity && event.registered_count !== undefined
        ? Math.min(100, Math.round((event.registered_count / event.capacity) * 100))
        : 0;

    const capacityColor =
        capacityPercent < 70 ? 'bg-green-500' : capacityPercent < 90 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.title} />

            {/* ============================================================
                HERO SECTION
            ============================================================ */}
            <div className="relative aspect-[4/3] lg:aspect-[21/9] overflow-hidden bg-[#182b5c]">
                {event.cover_url && (
                    <img
                        src={event.cover_url}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}

                {/* Background gradient overlay */}
                <div
                    className={`absolute inset-0 bg-gradient-to-br from-[#182b5c] to-[#0f1e42] ${
                        event.cover_url ? 'opacity-60' : 'opacity-100'
                    }`}
                />

                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <Link
                        href="/events"
                        className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Events
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white border border-white/20 hover:bg-white/10 gap-2"
                        onClick={() => setShareDialogOpen(true)}
                    >
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>

                {/* Bottom overlay content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={eventStatusBadge(event.status)}>{event.status}</Badge>
                        <Badge
                            variant="outline"
                            className="bg-white/10 text-white border-white/30"
                        >
                            {event.type === 'club' ? 'Club Event' : 'School-Wide'}
                        </Badge>
                        {event.club?.category && (
                            <Badge
                                variant="outline"
                                className="bg-white/10 text-white border-white/30 capitalize"
                            >
                                {event.club.category}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-2 max-w-4xl leading-tight">
                        {event.title}
                    </h1>
                    {event.club && (
                        <Link
                            href={`/clubs/${event.club.slug}`}
                            className="text-[#d0b216] hover:underline font-medium mt-2 inline-block"
                        >
                            by {event.club.name}
                        </Link>
                    )}
                </div>
            </div>

            {/* ============================================================
                MAIN LAYOUT
            ============================================================ */}
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* ============================================================
                        LEFT COLUMN
                    ============================================================ */}
                    <div className="flex-1 min-w-0">
                        <Tabs defaultValue="overview">
                            <TabsList className="w-full justify-start sticky top-0 bg-background z-10 border-b rounded-none px-0 mb-6 h-auto gap-0 overflow-x-auto flex-nowrap">
                                <TabsTrigger
                                    value="overview"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#182b5c] data-[state=active]:text-[#182b5c] px-4 py-2.5 shrink-0"
                                >
                                    Overview
                                </TabsTrigger>
                                {hasSessions && (
                                    <TabsTrigger
                                        value="schedule"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#182b5c] data-[state=active]:text-[#182b5c] px-4 py-2.5 shrink-0"
                                    >
                                        Schedule
                                    </TabsTrigger>
                                )}
                                {hasSpeakers && (
                                    <TabsTrigger
                                        value="speakers"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#182b5c] data-[state=active]:text-[#182b5c] px-4 py-2.5 shrink-0"
                                    >
                                        Speakers
                                    </TabsTrigger>
                                )}
                                <TabsTrigger
                                    value="attendees"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#182b5c] data-[state=active]:text-[#182b5c] px-4 py-2.5 shrink-0"
                                >
                                    Attendees
                                </TabsTrigger>
                                {isCompleted && (
                                    <TabsTrigger
                                        value="feedback"
                                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#182b5c] data-[state=active]:text-[#182b5c] px-4 py-2.5 shrink-0"
                                    >
                                        Feedback
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            {/* ---- OVERVIEW TAB ---- */}
                            <TabsContent value="overview" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">About this Event</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                                            {event.description}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Event details grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg bg-[#182b5c]/8 flex items-center justify-center">
                                            <CalendarDays className="h-4 w-4 text-[#182b5c]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date</p>
                                            <p className="font-medium text-sm">{formatDate(event.start_datetime)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg bg-[#182b5c]/8 flex items-center justify-center">
                                            <Clock className="h-4 w-4 text-[#182b5c]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Time</p>
                                            <p className="font-medium text-sm">
                                                {formatTime(event.start_datetime)} — {formatTime(event.end_datetime)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg bg-[#182b5c]/8 flex items-center justify-center">
                                            <MapPin className="h-4 w-4 text-[#182b5c]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Venue</p>
                                            <a
                                                href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-sm hover:underline text-[#182b5c]"
                                            >
                                                {event.venue}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg bg-[#182b5c]/8 flex items-center justify-center">
                                            <Timer className="h-4 w-4 text-[#182b5c]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Duration</p>
                                            <p className="font-medium text-sm">
                                                {getDuration(event.start_datetime, event.end_datetime)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg bg-[#182b5c]/8 flex items-center justify-center">
                                            <Users className="h-4 w-4 text-[#182b5c]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Capacity</p>
                                            <p className="font-medium text-sm">
                                                {event.capacity ? `${event.capacity} seats` : 'Unlimited'}
                                            </p>
                                        </div>
                                    </div>

                                    {event.registration_deadline && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 shrink-0 h-9 w-9 rounded-lg bg-[#182b5c]/8 flex items-center justify-center">
                                                <CalendarX className="h-4 w-4 text-[#182b5c]" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Registration Deadline</p>
                                                <p className="font-medium text-sm">
                                                    {formatDate(event.registration_deadline)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Organizer section */}
                                <div className="mt-6">
                                    {event.club ? (
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border">
                                            <Avatar className="h-12 w-12 shrink-0">
                                                {event.club.logo_url ? (
                                                    <AvatarImage src={event.club.logo_url} alt={event.club.name} />
                                                ) : null}
                                                <AvatarFallback className="bg-[#182b5c] text-white font-semibold">
                                                    {event.club.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Organized by</p>
                                                <Link
                                                    href={`/clubs/${event.club.slug}`}
                                                    className="font-semibold hover:underline text-[#182b5c]"
                                                >
                                                    {event.club.name}
                                                </Link>
                                            </div>
                                        </div>
                                    ) : event.creator ? (
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border">
                                            <Avatar className="h-12 w-12 shrink-0">
                                                <AvatarImage src={event.creator.avatar} />
                                                <AvatarFallback className="bg-[#182b5c] text-white font-semibold">
                                                    {event.creator.name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Organized by</p>
                                                <p className="font-semibold">{event.creator.name}</p>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </TabsContent>

                            {/* ---- SCHEDULE TAB ---- */}
                            {hasSessions && (
                                <TabsContent value="schedule">
                                    <h3 className="font-semibold text-lg mb-6">Event Schedule</h3>
                                    <div className="space-y-0">
                                        {[...event.sessions]
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                            .map((session) => (
                                                <div key={session.id} className="flex gap-4">
                                                    {/* Time column */}
                                                    <div className="w-24 shrink-0 text-right pt-4">
                                                        <p className="text-[#d0b216] font-bold text-sm">
                                                            {formatTime(session.start_time)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatTime(session.end_time)}
                                                        </p>
                                                    </div>
                                                    {/* Connector line */}
                                                    <div className="flex flex-col items-center mx-2">
                                                        <div className="mt-5 h-3 w-3 rounded-full bg-[#d0b216] shrink-0" />
                                                        <div className="flex-1 w-px bg-[#d0b216]/30" />
                                                    </div>
                                                    {/* Session card */}
                                                    <div className="flex-1 rounded-xl border p-4 mb-3">
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <p className="font-semibold">{session.title}</p>
                                                            {session.location && (
                                                                <span className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded shrink-0">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {session.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {session.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {session.description}
                                                            </p>
                                                        )}
                                                        {session.speaker_name && (
                                                            <div className="mt-3 flex items-center gap-3">
                                                                <Avatar className="h-8 w-8 shrink-0">
                                                                    {session.speaker_avatar_url && (
                                                                        <AvatarImage src={session.speaker_avatar_url} />
                                                                    )}
                                                                    <AvatarFallback className="bg-[#182b5c] text-white text-xs">
                                                                        {session.speaker_name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-sm">{session.speaker_name}</p>
                                                                    {session.speaker_bio && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                                            {session.speaker_bio}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </TabsContent>
                            )}

                            {/* ---- SPEAKERS TAB ---- */}
                            {hasSpeakers && (
                                <TabsContent value="speakers">
                                    <h3 className="font-semibold text-lg mb-6">Speakers &amp; Presenters</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {speakers.map((speaker) => (
                                            <Card key={speaker.name} className="p-5">
                                                <div className="flex gap-4">
                                                    <Avatar className="h-16 w-16 shrink-0">
                                                        {speaker.avatar_url && (
                                                            <AvatarImage src={speaker.avatar_url} />
                                                        )}
                                                        <AvatarFallback className="bg-[#182b5c] text-white text-lg font-semibold">
                                                            {speaker.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-bold">{speaker.name}</p>
                                                        {speaker.bio && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {speaker.bio}
                                                            </p>
                                                        )}
                                                        {speaker.sessions.length > 0 && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                Speaking in:{' '}
                                                                {speaker.sessions.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>
                            )}

                            {/* ---- ATTENDEES TAB ---- */}
                            <TabsContent value="attendees">
                                <div className="space-y-6">
                                    {/* Capacity bar */}
                                    {event.capacity && event.registered_count !== undefined && (
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="font-medium">
                                                    {event.registered_count} of {event.capacity} spots filled
                                                </span>
                                                <span className="text-muted-foreground">{capacityPercent}%</span>
                                            </div>
                                            <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${capacityColor}`}
                                                    style={{ width: `${capacityPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Waitlist notice */}
                                    {event.waitlist_count > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span className="text-sm font-medium">
                                                Waitlist: {event.waitlist_count} people waiting
                                            </span>
                                        </div>
                                    )}

                                    {/* User waitlist position */}
                                    {userRegistration?.is_waitlisted && (
                                        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                                                        You are #{userRegistration.waitlist_position} on the waitlist
                                                    </p>
                                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                        You'll be notified if a spot opens up.
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Attendee avatars */}
                                    {event.registrations && event.registrations.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-4">Who's Attending</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {event.registrations.slice(0, 30).map((reg) => (
                                                    <div
                                                        key={reg.id}
                                                        className="flex flex-col items-center text-center w-16"
                                                    >
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={reg.user?.avatar} />
                                                            <AvatarFallback className="bg-[#182b5c]/10 text-[#182b5c] font-medium text-xs">
                                                                {reg.user?.name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-muted-foreground line-clamp-1 mt-1 w-full">
                                                            {reg.user?.name?.split(' ')[0]}
                                                        </span>
                                                    </div>
                                                ))}
                                                {event.registrations.length > 30 && (
                                                    <div className="flex items-center text-sm text-muted-foreground self-center">
                                                        +{event.registrations.length - 30} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {event.registrations?.length === 0 && (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">No attendees yet. Be the first to register!</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* ---- FEEDBACK TAB ---- */}
                            {isCompleted && (
                                <TabsContent value="feedback">
                                    <div className="space-y-6">
                                        {/* Submit feedback form */}
                                        {!event.user_feedback && userRegistration?.status === 'attended' && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <MessageSquare className="h-5 w-5 text-[#d0b216]" />
                                                        Share Your Experience
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <form onSubmit={handleSubmitFeedback} className="space-y-5">
                                                        <div>
                                                            <Label className="text-sm font-medium mb-2 block">
                                                                Your Rating
                                                            </Label>
                                                            <StarRating
                                                                value={feedbackRating}
                                                                onChange={setFeedbackRating}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="feedback-comment" className="text-sm font-medium mb-2 block">
                                                                Your Comment{' '}
                                                                <span className="text-muted-foreground font-normal">
                                                                    ({feedbackComment.length}/1000)
                                                                </span>
                                                            </Label>
                                                            <Textarea
                                                                id="feedback-comment"
                                                                value={feedbackComment}
                                                                onChange={(e) => setFeedbackComment(e.target.value.slice(0, 1000))}
                                                                placeholder="Tell others what you thought about this event..."
                                                                rows={4}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Switch
                                                                id="would-recommend"
                                                                checked={wouldRecommend}
                                                                onCheckedChange={setWouldRecommend}
                                                            />
                                                            <Label htmlFor="would-recommend" className="text-sm cursor-pointer">
                                                                Would you recommend this event?
                                                            </Label>
                                                        </div>
                                                        <Button
                                                            type="submit"
                                                            disabled={feedbackRating === 0 || submittingFeedback}
                                                            className="bg-[#d0b216] text-[#182b5c] font-bold hover:bg-[#b89e14] w-full"
                                                        >
                                                            {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                                        </Button>
                                                    </form>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Existing user feedback */}
                                        {event.user_feedback && (
                                            <Card className="border-[#d0b216]/30 bg-[#d0b216]/5">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="h-4 w-4 text-[#d0b216]" />
                                                        <span className="text-sm font-medium">You already submitted feedback</span>
                                                    </div>
                                                    <StarRating value={event.user_feedback.rating} readonly />
                                                    {event.user_feedback.comment && (
                                                        <p className="text-sm text-muted-foreground mt-2">
                                                            {event.user_feedback.comment}
                                                        </p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Community reviews */}
                                        {event.feedback_stats && event.feedback_stats.total_feedback > 0 && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Star className="h-5 w-5 text-[#d0b216]" />
                                                        Community Reviews
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-5">
                                                    {/* Rating summary */}
                                                    <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/40">
                                                        <div className="text-center">
                                                            <p className="text-4xl font-bold text-[#d0b216]">
                                                                {event.feedback_stats.avg_rating.toFixed(1)}
                                                            </p>
                                                            <StarRating value={Math.round(event.feedback_stats.avg_rating)} readonly />
                                                        </div>
                                                        <Separator orientation="vertical" className="h-16" />
                                                        <div className="text-sm text-muted-foreground space-y-1">
                                                            <p className="font-medium text-foreground">
                                                                {event.feedback_stats.total_feedback} reviews
                                                            </p>
                                                            <div className="flex items-center gap-1">
                                                                <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                                                                <span>
                                                                    {event.feedback_stats.would_recommend_percent}% would recommend
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Recent reviews */}
                                                    {event.recent_feedback && event.recent_feedback.length > 0 && (
                                                        <div className="space-y-4">
                                                            {event.recent_feedback.map((fb) => (
                                                                <div key={fb.id} className="flex gap-3">
                                                                    <Avatar className="h-9 w-9 shrink-0">
                                                                        <AvatarImage src={fb.user.avatar} />
                                                                        <AvatarFallback className="text-xs bg-[#182b5c]/10 text-[#182b5c]">
                                                                            {fb.user.name.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                                                            <p className="font-medium text-sm">{fb.user.name}</p>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {formatDate(fb.created_at)}
                                                                            </span>
                                                                        </div>
                                                                        <StarRating value={fb.rating} readonly />
                                                                        {fb.comment && (
                                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                                {fb.comment}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {isCompleted && !event.feedback_stats?.total_feedback && !userRegistration && (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm">No feedback yet for this event.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>

                    {/* ============================================================
                        RIGHT SIDEBAR
                    ============================================================ */}
                    <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
                        <div className="space-y-4 lg:sticky lg:top-6">

                            {/* Card 1 — Event Details */}
                            <Card>
                                <CardContent className="space-y-3 p-5">
                                    <div className="flex items-center gap-3">
                                        <CalendarDays className="h-4 w-4 text-[#182b5c] shrink-0" />
                                        <span className="text-sm">{formatDate(event.start_datetime)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-[#182b5c] shrink-0" />
                                        <span className="text-sm">
                                            {formatTime(event.start_datetime)} — {formatTime(event.end_datetime)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-[#182b5c] shrink-0" />
                                        <a
                                            href={`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm hover:underline text-[#182b5c]"
                                        >
                                            {event.venue}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Ticket className="h-4 w-4 text-[#182b5c] shrink-0" />
                                        <span className="text-sm font-medium">
                                            {event.is_paid ? event.formatted_fee : 'Free Event'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Users className="h-4 w-4 text-[#182b5c] shrink-0" />
                                        <span className="text-sm">
                                            {event.registered_count} registered
                                            {event.capacity ? ` / ${event.capacity}` : ''}
                                        </span>
                                    </div>
                                    {event.registration_deadline && (
                                        <div className="flex items-center gap-3">
                                            <CalendarX className="h-4 w-4 text-[#182b5c] shrink-0" />
                                            <span className="text-sm">
                                                Deadline: {formatDate(event.registration_deadline)}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Card 2 — Countdown Timer */}
                            {isUpcoming && (
                                <Card>
                                    <CardContent className="p-5">
                                        <CountdownTimer dateStr={event.start_datetime} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Card 3 — Registration Progress */}
                            {event.capacity && event.registered_count !== undefined && (
                                <Card>
                                    <CardContent className="p-5 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">
                                                {event.registered_count} of {event.capacity} spots taken
                                            </span>
                                            <span className="text-muted-foreground">{capacityPercent}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${capacityColor}`}
                                                style={{ width: `${capacityPercent}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {event.available_spots !== null && event.available_spots !== undefined
                                                ? event.available_spots > 0
                                                    ? `${event.available_spots} spots remaining`
                                                    : 'Event is full'
                                                : ''}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Card 4 — Registration CTA */}
                            <Card>
                                <CardContent className="p-5 space-y-3">
                                    {!user ? (
                                        <>
                                            <Button
                                                className="w-full bg-[#182b5c] hover:bg-[#1e3570] text-white font-semibold"
                                                size="lg"
                                                asChild
                                            >
                                                <Link href="/login">Sign in to Register</Link>
                                            </Button>
                                            <p className="text-xs text-center text-muted-foreground">
                                                Use your KCAU Google account
                                            </p>
                                        </>
                                    ) : userRegistration && !userRegistration.is_waitlisted && userRegistration.status === 'registered' ? (
                                        <>
                                            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-4 dark:bg-green-950 dark:border-green-800">
                                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                                                <span className="font-medium text-green-800 dark:text-green-300">
                                                    You're registered!
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
                                                onClick={handleCancelRegistration}
                                            >
                                                Cancel Registration
                                            </Button>
                                        </>
                                    ) : userRegistration?.is_waitlisted ? (
                                        <>
                                            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950 dark:border-amber-800">
                                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-amber-800 dark:text-amber-300">
                                                        You're on the waitlist
                                                    </p>
                                                    {userRegistration.waitlist_position && (
                                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                                                            Position #{userRegistration.waitlist_position}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleLeaveWaitlist}
                                            >
                                                Leave Waitlist
                                            </Button>
                                        </>
                                    ) : userRegistration?.status === 'attended' ? (
                                        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 p-4 dark:bg-blue-950 dark:border-blue-800">
                                            <CalendarCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span className="font-medium text-blue-800 dark:text-blue-300">
                                                You attended this event
                                            </span>
                                        </div>
                                    ) : event.is_registration_open && !userRegistration ? (
                                        event.is_paid ? (
                                            <Button
                                                className="w-full bg-[#d0b216] hover:bg-[#b89e14] text-[#182b5c] font-bold"
                                                size="lg"
                                                onClick={() => setPhoneDialogOpen(true)}
                                            >
                                                <Ticket className="mr-2 h-4 w-4" />
                                                Pay &amp; Register — {event.formatted_fee}
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full bg-[#d0b216] hover:bg-[#b89e14] text-[#182b5c] font-bold"
                                                size="lg"
                                                onClick={handleRegister}
                                            >
                                                Register Now — Free
                                            </Button>
                                        )
                                    ) : (
                                        <div className="text-center text-sm text-muted-foreground py-2">
                                            Registration is closed
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Card 5 — Admin/Creator Actions */}
                            {user && (isAdmin || event.created_by === user.id) && (
                                <Card>
                                    <CardContent className="p-4 space-y-2">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
                                            Manage
                                        </p>
                                        <Link href={`/events/${event.slug}/edit`} className="block">
                                            <Button variant="outline" className="w-full justify-start gap-2">
                                                <Edit2 className="h-4 w-4" />
                                                Edit Event
                                            </Button>
                                        </Link>
                                        <Link href={`/events/${event.slug}/attendees`} className="block">
                                            <Button variant="outline" className="w-full justify-start gap-2">
                                                <Users className="h-4 w-4" />
                                                Manage Attendees
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start gap-2"
                                            onClick={() => {
                                                if (confirm('Clone this event?')) {
                                                    router.post(`/events/${event.slug}/clone`);
                                                }
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                            Clone Event
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                {/* ============================================================
                    RELATED EVENTS
                ============================================================ */}
                {relatedEvents && relatedEvents.length > 0 && (
                    <div className="mt-12">
                        <h2 className="font-bold text-xl mb-4">More Events You Might Like</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
                            {relatedEvents.map((rel) => (
                                <div
                                    key={rel.id}
                                    className="w-[300px] shrink-0 snap-start rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="relative aspect-[16/9] bg-[#182b5c]">
                                        {rel.cover_url ? (
                                            <img
                                                src={rel.cover_url}
                                                alt={rel.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#182b5c] to-[#0f1e42]" />
                                        )}
                                        {/* Date chip */}
                                        <div className="absolute top-3 left-3 bg-white/95 rounded-lg px-2 py-1 text-xs font-semibold text-[#182b5c] shadow-sm">
                                            {new Date(rel.start_datetime).toLocaleDateString('en-KE', {
                                                month: 'short', day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <h3 className="font-semibold line-clamp-2 text-sm leading-snug">
                                            {rel.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="line-clamp-1">{rel.venue}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {rel.registered_count} going
                                            </span>
                                            <Link href={`/events/${rel.slug}`}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs h-7 border-[#182b5c]/30 text-[#182b5c] hover:bg-[#182b5c] hover:text-white"
                                                >
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
                M-PESA DIALOG
            ============================================================ */}
            <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter M-Pesa Phone Number</DialogTitle>
                        <DialogDescription>
                            Use a Safaricom number to receive the STK push for this event payment.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaidRegistration} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-phone-number">Phone Number</Label>
                            <Input
                                id="event-phone-number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="2547XXXXXXXX or 07XXXXXXXX"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setPhoneDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-[#182b5c] text-white hover:bg-[#1e3570]">
                                Send STK Push
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ============================================================
                SHARE DIALOG
            ============================================================ */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share This Event</DialogTitle>
                        <DialogDescription>
                            Spread the word about {event.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={handleCopyLink}
                        >
                            <Copy className="h-4 w-4" />
                            {copied ? 'Link Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={() => {
                                window.open(
                                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}&url=${encodeURIComponent(window.location.href)}`,
                                    '_blank',
                                );
                            }}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            Share on X / Twitter
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={() => {
                                window.open(
                                    `https://wa.me/?text=${encodeURIComponent(event.title + ' ' + window.location.href)}`,
                                    '_blank',
                                );
                            }}
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Share on WhatsApp
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
