import { Head, Link } from '@inertiajs/react';
import { Users, TrendingUp, Star, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { eventStatusBadge } from '@/lib/color-badges';
import type { BreadcrumbItem, Event, EventFeedbackStats } from '@/types';

interface Props {
    event: Event & { cover_url?: string };
    analytics: {
        registrations_by_day: { date: string; count: number }[];
        revenue_by_day: { date: string; amount: number }[];
        revenue_total: number;
        attendance_rate: number;
        total_registered: number;
        total_attended: number;
        feedback_stats: EventFeedbackStats | null;
        rating_breakdown: { rating: number; count: number }[];
    };
}

const breadcrumbs: (event: Event) => BreadcrumbItem[] = (event) => [
    { title: 'Admin', href: '/admin' },
    { title: 'Events', href: '/admin/events' },
    { title: event.title, href: `/events/${event.slug}` },
    { title: 'Analytics', href: `/admin/events/${event.slug}/analytics` },
];

// ─── CircleProgress ────────────────────────────────────────────────────────

function CircleProgress({ pct, color = '#22c55e' }: { pct: number; color?: string }) {
    const r = 20;
    const c = 2 * Math.PI * r;
    const offset = c * (1 - pct / 100);
    return (
        <svg width="56" height="56" viewBox="0 0 50 50" className="shrink-0">
            <circle cx="25" cy="25" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <circle
                cx="25" cy="25" r={r}
                fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={c} strokeDashoffset={offset}
                strokeLinecap="round" transform="rotate(-90 25 25)"
            />
            <text x="25" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill={color}>{pct}%</text>
        </svg>
    );
}

// ─── LineChart ─────────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; count: number }[] }) {
    if (!data || !data.length) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No registration data available
            </div>
        );
    }
    const W = 560, H = 160, PAD = 30;
    const maxY = Math.max(...data.map(d => d.count), 1);
    const pts = data.map((d, i) => ({
        x: PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2),
        y: H - PAD - (d.count / maxY) * (H - PAD * 2),
        ...d,
    }));
    const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
    const gridLines = [0, 0.25, 0.5, 0.75, 1];
    const last = pts[pts.length - 1];
    return (
        <svg viewBox={`0 0 ${W + PAD} ${H + PAD}`} className="w-full overflow-visible">
            {gridLines.map((t, i) => (
                <line
                    key={i}
                    x1={PAD} y1={PAD + (1 - t) * (H - PAD * 2)}
                    x2={W} y2={PAD + (1 - t) * (H - PAD * 2)}
                    stroke="#182b5c" strokeOpacity="0.08" strokeDasharray="4"
                />
            ))}
            <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d0b216" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#d0b216" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline
                points={`${polyline} ${last.x},${H - PAD} ${PAD},${H - PAD}`}
                fill="url(#lineGrad)" stroke="none"
            />
            <polyline points={polyline} fill="none" stroke="#d0b216" strokeWidth="2.5" strokeLinejoin="round" />
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#d0b216" stroke="white" strokeWidth="1.5" />
            ))}
            {pts.filter((_, i) => i % 2 === 0).map((p, i) => (
                <text key={i} x={p.x} y={H} textAnchor="middle" fontSize="9" fill="#6b7280">
                    {new Date(p.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                </text>
            ))}
        </svg>
    );
}

// ─── BarChart ──────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; amount: number }[] }) {
    if (!data || !data.length) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No revenue data
            </div>
        );
    }
    const W = 560, H = 160, PAD = 30;
    const maxAmt = Math.max(...data.map(d => d.amount), 1);
    const barW = Math.max(8, Math.min(40, (W - PAD * 2) / data.length - 6));
    return (
        <svg viewBox={`0 0 ${W + PAD} ${H + PAD}`} className="w-full">
            {data.map((d, i) => {
                const barH = (d.amount / maxAmt) * (H - PAD * 2);
                const x = PAD + (i + 0.5) * ((W - PAD * 2) / data.length) - barW / 2;
                return (
                    <g key={i}>
                        <rect x={x} y={H - PAD - barH} width={barW} height={barH} rx="3" fill="#d0b216" opacity="0.85" />
                        <text x={x + barW / 2} y={H} textAnchor="middle" fontSize="9" fill="#6b7280">
                            {new Date(d.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminEventAnalytics({ event, analytics }: Props) {
    const fmtKES = (cents: number) =>
        'KES ' + new Intl.NumberFormat('en-KE').format(cents / 100);

    const hasFeedback = (analytics.feedback_stats?.total_feedback ?? 0) > 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs(event)}>
            <Head title={`Analytics — ${event.title}`} />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

                {/* Event Header Bar */}
                <div className="rounded-xl border p-4 flex flex-wrap gap-4 items-center">
                    {event.cover_url ? (
                        <img src={event.cover_url} alt={event.title} className="w-20 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                        <div className="w-20 h-12 rounded-lg shrink-0 bg-gradient-to-br from-[#182b5c] to-[#d0b216]" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-xl font-bold leading-tight truncate">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={eventStatusBadge(event.status)}>{event.status}</Badge>
                            <Badge variant="outline" className="capitalize">{event.type}</Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Link href={`/events/${event.slug}`}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Back to Event
                            </Button>
                        </Link>
                        <Link href="/admin/events">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                Admin Events
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Total Registered */}
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground font-medium">Total Registered</p>
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.total_registered}</h3>
                    </div>

                    {/* Attendance Rate */}
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-5 flex items-center gap-3">
                        <CircleProgress pct={analytics.attendance_rate} color="#22c55e" />
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Attendance Rate</p>
                            <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">{analytics.attendance_rate}%</h3>
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-[#d0b216]/10 border border-[#d0b216]/30 rounded-xl p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground font-medium">Revenue</p>
                            <TrendingUp className="h-4 w-4 text-[#d0b216]" />
                        </div>
                        {event.is_paid ? (
                            <h3 className="text-2xl font-bold text-[#182b5c] dark:text-[#d0b216] leading-tight">
                                {fmtKES(analytics.revenue_total)}
                            </h3>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-[#182b5c] dark:text-[#d0b216]">N/A</h3>
                                <p className="text-xs text-muted-foreground">Free Event</p>
                            </>
                        )}
                    </div>

                    {/* Avg Rating */}
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground font-medium">Avg Rating</p>
                            <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                            {analytics.feedback_stats?.avg_rating ?? '—'}
                            <span className="text-base font-normal text-muted-foreground"> / 5 ★</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">{analytics.feedback_stats?.total_feedback ?? 0} reviews</p>
                    </div>
                </div>

                {/* Registrations Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Registrations Over Time (Last 14 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LineChart data={analytics.registrations_by_day} />
                    </CardContent>
                </Card>

                {/* Revenue Chart (paid events only) */}
                {event.is_paid && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Revenue by Day (KES)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <BarChart data={analytics.revenue_by_day} />
                        </CardContent>
                    </Card>
                )}

                {/* Feedback Breakdown */}
                {hasFeedback && analytics.feedback_stats && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Feedback Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left: summary */}
                                <div className="space-y-3 flex flex-col items-start">
                                    <div className="flex items-end gap-2">
                                        <span className="text-6xl font-bold text-[#d0b216] leading-none">
                                            {analytics.feedback_stats.avg_rating}
                                        </span>
                                        <span className="text-muted-foreground mb-1">out of 5.0</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span
                                                key={star}
                                                style={{ color: star <= Math.round(analytics.feedback_stats!.avg_rating) ? '#d0b216' : '#d1d5db' }}
                                                className="text-2xl"
                                            >★</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {analytics.feedback_stats.total_feedback} total reviews
                                    </p>
                                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                        {analytics.feedback_stats.would_recommend_percent}% would recommend
                                    </p>
                                </div>

                                {/* Right: breakdown bars */}
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map(r => {
                                        const entry = analytics.rating_breakdown.find(x => x.rating === r);
                                        const count = entry?.count ?? 0;
                                        const total = analytics.feedback_stats?.total_feedback ?? 1;
                                        const pct = Math.round((count / total) * 100);
                                        return (
                                            <div key={r} className="flex items-center gap-3 text-sm mb-2">
                                                <span className="w-12 text-right text-muted-foreground shrink-0">{r} ★</span>
                                                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="h-2.5 rounded-full bg-[#d0b216] transition-all"
                                                        style={{ width: pct + '%' }}
                                                    />
                                                </div>
                                                <span className="w-8 text-muted-foreground text-xs">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Stats Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Registration Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Metric</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Total Capacity</TableCell>
                                    <TableCell className="text-right">{event.capacity ?? 'Unlimited'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Total Registered</TableCell>
                                    <TableCell className="text-right">{analytics.total_registered}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Total Attended</TableCell>
                                    <TableCell className="text-right">{analytics.total_attended}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Attendance Rate</TableCell>
                                    <TableCell className="text-right">{analytics.attendance_rate}%</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Revenue Collected</TableCell>
                                    <TableCell className="text-right">
                                        {event.is_paid ? fmtKES(analytics.revenue_total) : 'Free Event'}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </AdminLayout>
    );
}
