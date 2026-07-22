import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarDays, MapPin, Clock, Users, Trophy, Star, Zap, TrendingUp,
    QrCode, ChevronRight, Bell, BookOpen, Sparkles, Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem, Event, EventRegistration, ClubMembership, Club, Announcement,
} from '@/types';
import type { User } from '@/types/auth';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}
function formatTime(d: string) {
    return new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}
function formatMonth(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { month: 'short' }).toUpperCase();
}
function formatDay(d: string) {
    return new Date(d).getDate();
}
function relativeTime(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
}
function initials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}
function pointsLevel(pts: number): string {
    if (pts < 50) return 'Newcomer';
    if (pts < 150) return 'Explorer';
    if (pts < 350) return 'Active Member';
    if (pts < 700) return 'Champion';
    return 'Legend';
}
function nextMilestone(pts: number): number {
    return (Math.floor(pts / 100) + 1) * 100;
}

// ─── types ───────────────────────────────────────────────────────────────────

interface Props {
    todayEvents: Event[];
    upcomingRegistrations: (EventRegistration & { event: Event & { cover_url?: string } })[];
    myClubs: (ClubMembership & { club: Club })[];
    stats: { events_attended: number; clubs_joined: number; points: number; rank: number };
    announcements: Announcement[];
    recommended: (Event & { cover_url?: string })[];
}

// ─── QR Dialog ───────────────────────────────────────────────────────────────

function QrDialog({
    open,
    onClose,
    token,
    eventTitle,
    userName,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    eventTitle: string;
    userName: string;
}) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm text-center">
                <DialogHeader>
                    <DialogTitle>Your QR Code</DialogTitle>
                </DialogHeader>
                <p className="text-sm font-semibold">{eventTitle}</p>
                <p className="text-xs text-muted-foreground">{userName}</p>
                <div className="flex justify-center py-4">
                    <img src={qrUrl} alt="QR Code" className="rounded-lg border w-48 h-48" />
                </div>
                <p className="font-mono text-xs bg-muted rounded px-2 py-1 break-all">{token}</p>
            </DialogContent>
        </Dialog>
    );
}

// ─── main component ───────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Student Hub', href: '/student/dashboard' },
];

export default function StudentDashboard({
    todayEvents, upcomingRegistrations, myClubs, stats, announcements, recommended,
}: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const user = auth.user;

    const [qrState, setQrState] = useState<{ token: string; title: string } | null>(null);

    const level = pointsLevel(stats.points);
    const next = nextMilestone(stats.points);
    const progress = Math.round(((stats.points % 100) / 100) * 100);

    const statCards = [
        {
            label: 'Events Attended', value: stats.events_attended, emoji: '🎉',
            gradient: 'from-emerald-500 to-green-600',
            icon: <CalendarDays className="w-10 h-10 opacity-20" />,
        },
        {
            label: 'Clubs Joined', value: stats.clubs_joined, emoji: '🏛️',
            gradient: 'from-blue-500 to-indigo-600',
            icon: <Users className="w-10 h-10 opacity-20" />,
        },
        {
            label: 'Points Earned', value: stats.points, emoji: '⭐',
            gradient: 'from-yellow-400 to-amber-500',
            icon: <Star className="w-10 h-10 opacity-20" />,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Dashboard" />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">

                {/* ── Page Header ── */}
                <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 border-2 border-[#d0b216]">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-[#182b5c] text-white text-lg font-bold">
                            {initials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">
                            {greeting()}, {user.name}! 👋
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {user.department || 'KCAU Student'} • {user.year_of_study ? `Year ${user.year_of_study}` : ''}
                        </p>
                        {user.student_id && (
                            <Badge className="mt-1 bg-[#182b5c] text-white text-xs">
                                ID: {user.student_id}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label}
                            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} text-white p-4 shadow`}>
                            <div className="absolute right-2 top-2">{card.icon}</div>
                            <div className="text-3xl font-bold">{card.value}</div>
                            <div className="text-xs font-medium mt-1 opacity-90">{card.emoji} {card.label}</div>
                            <TrendingUp className="w-3 h-3 absolute bottom-3 right-3 opacity-50" />
                        </div>
                    ))}
                </div>

                {/* ── Today's Agenda ── */}
                {todayEvents.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                        <h2 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4" /> 📅 Today's Events
                        </h2>
                        <div className="space-y-2">
                            {todayEvents.map((ev) => (
                                <div key={ev.id} className="flex items-center justify-between bg-white dark:bg-amber-900/30 rounded-lg px-3 py-2">
                                    <div>
                                        <p className="font-medium text-sm">{ev.title}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {formatTime(ev.start_datetime)}
                                            {ev.venue && <><MapPin className="w-3 h-3 ml-1" /> {ev.venue}</>}
                                        </p>
                                    </div>
                                    <Link href={`/events/${ev.slug}`}
                                        className="text-xs text-amber-700 dark:text-amber-300 underline whitespace-nowrap">
                                        View
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Main Grid ── */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* ── Left Column ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Upcoming Registrations */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CalendarDays className="w-4 h-4 text-[#182b5c]" /> My Upcoming Events
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {upcomingRegistrations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        No upcoming registrations. <Link href="/events" className="text-[#182b5c] underline">Browse events →</Link>
                                    </p>
                                ) : upcomingRegistrations.slice(0, 5).map((reg) => {
                                    const ev = reg.event;
                                    const isWaitlisted = reg.is_waitlisted;
                                    return (
                                        <div key={reg.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/30 transition-colors">
                                            {/* Cover thumbnail */}
                                            {ev.cover_url ? (
                                                <img src={ev.cover_url} alt={ev.title}
                                                    className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-[#182b5c] to-[#1e3a7a] flex-shrink-0" />
                                            )}
                                            {/* Date block */}
                                            <div className="text-center w-10 flex-shrink-0">
                                                <div className="text-xs font-semibold text-[#182b5c] uppercase leading-none">
                                                    {formatMonth(ev.start_datetime)}
                                                </div>
                                                <div className="text-2xl font-bold text-[#182b5c] leading-tight">
                                                    {formatDay(ev.start_datetime)}
                                                </div>
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm leading-tight truncate">{ev.title}</p>
                                                {ev.club && <p className="text-xs text-muted-foreground">{ev.club.name}</p>}
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" />{formatTime(ev.start_datetime)}
                                                    {ev.venue && <><MapPin className="w-3 h-3 ml-1" />{ev.venue}</>}
                                                </p>
                                            </div>
                                            {/* Actions */}
                                            <div className="flex flex-col gap-1 flex-shrink-0 items-end">
                                                <Badge className={isWaitlisted
                                                    ? 'bg-amber-100 text-amber-700 text-xs'
                                                    : 'bg-green-100 text-green-700 text-xs'}>
                                                    {isWaitlisted ? 'Waitlisted' : 'Registered'}
                                                </Badge>
                                                <Link href={`/events/${ev.slug}`}
                                                    className="text-xs text-[#182b5c] underline">View</Link>
                                                {!isWaitlisted && reg.check_in_token && (
                                                    <button
                                                        onClick={() => setQrState({ token: reg.check_in_token!, title: ev.title })}
                                                        className="text-xs flex items-center gap-1 text-[#d0b216] hover:underline">
                                                        <QrCode className="w-3 h-3" /> QR Code
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {upcomingRegistrations.length > 5 && (
                                    <div className="text-center pt-1">
                                        <Link href="/student/my-events" className="text-sm text-[#182b5c] underline">
                                            View all {upcomingRegistrations.length} registrations →
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recommended Events */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Sparkles className="w-4 h-4 text-[#d0b216]" /> Just For You 🎯
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recommended.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No recommendations yet. <Link href="/events" className="text-[#182b5c] underline">Browse events →</Link>
                                    </p>
                                ) : (
                                    <div className="flex gap-4 overflow-x-auto pb-2">
                                        {recommended.slice(0, 6).map((ev) => (
                                            <div key={ev.id}
                                                className="flex-shrink-0 w-48 rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                                                {ev.cover_url ? (
                                                    <img src={ev.cover_url} alt={ev.title}
                                                        className="w-full h-24 object-cover" />
                                                ) : (
                                                    <div className="w-full h-24 bg-gradient-to-br from-[#182b5c] to-[#1e3a7a]" />
                                                )}
                                                <div className="p-2">
                                                    <p className="font-semibold text-xs line-clamp-2">{ev.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {formatDate(ev.start_datetime)}
                                                    </p>
                                                    {ev.club && (
                                                        <p className="text-xs text-muted-foreground truncate">{ev.club.name}</p>
                                                    )}
                                                    <Link href={`/events/${ev.slug}`}>
                                                        <Button size="sm"
                                                            className="w-full mt-2 h-7 text-xs bg-[#182b5c] hover:bg-[#1e3a7a]">
                                                            Register
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Right Column ── */}
                    <div className="space-y-6">

                        {/* My Clubs */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="w-4 h-4 text-[#182b5c]" /> My Clubs
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {myClubs.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Not a member of any club yet.</p>
                                ) : myClubs.map((mem) => (
                                    <div key={mem.id} className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={(mem.club as Club & { logo_url?: string }).logo_url} />
                                            <AvatarFallback className="bg-[#182b5c] text-white text-xs">
                                                {initials(mem.club.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{mem.club.name}</p>
                                            <Badge className={`text-xs ${mem.role === 'leader' ? 'bg-[#d0b216]/20 text-amber-700' : mem.role === 'co-leader' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                {mem.role === 'co-leader' ? 'Co-Leader' : mem.role.charAt(0).toUpperCase() + mem.role.slice(1)}
                                            </Badge>
                                        </div>
                                        <Link href={`/clubs/${mem.club.slug}`}
                                            className="text-xs text-[#182b5c] hover:underline flex items-center gap-0.5">
                                            View <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ))}
                                <Separator />
                                <Link href="/clubs"
                                    className="text-sm text-[#182b5c] underline block">
                                    Browse More Clubs →
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Announcements */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Bell className="w-4 h-4 text-[#182b5c]" /> Recent Announcements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {announcements.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No announcements.</p>
                                ) : announcements.slice(0, 4).map((ann) => (
                                    <div key={ann.id}>
                                        <p className="text-sm font-medium leading-tight">{ann.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {relativeTime(ann.published_at ?? ann.created_at)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {ann.body || ann.content}
                                        </p>
                                        <Separator className="mt-2" />
                                    </div>
                                ))}
                                <Link href="/announcements"
                                    className="text-sm text-[#182b5c] underline block">
                                    View All Announcements →
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Points Activity */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Zap className="w-4 h-4 text-[#d0b216]" /> Points Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className="bg-[#d0b216]/20 text-amber-700 font-semibold">
                                        {level}
                                    </Badge>
                                    <span className="text-sm font-bold text-[#182b5c]">
                                        {stats.points} pts
                                    </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#d0b216] h-2 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {next - stats.points} pts to next milestone ({next} pts)
                                </p>
                                <Separator className="my-3" />
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium mb-1">How to earn points:</p>
                                    {[
                                        ['Register for event', '10 pts'],
                                        ['Attend event', '25 pts'],
                                        ['Join a club', '15 pts'],
                                        ['Submit feedback', '5 pts'],
                                    ].map(([action, pts]) => (
                                        <div key={action} className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">{action}</span>
                                            <span className="font-semibold text-[#d0b216]">{pts}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3">
                                    <Link href="/student/leaderboard"
                                        className="text-sm text-[#182b5c] underline flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> View Campus Leaderboard →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* QR Code Dialog */}
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
