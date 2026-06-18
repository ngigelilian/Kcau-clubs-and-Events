import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { badgeTone, eventStatusBadge, ticketPriorityBadge } from '@/lib/color-badges';
import type { BreadcrumbItem } from '@/types';
import {
    Users, Shield, CalendarDays, LifeBuoy, DollarSign,
    ShoppingBag, Clock, ArrowRight, TrendingUp, CheckCircle2,
    Bot, MessageCircle, ThumbsUp, Zap, Settings, Download,
} from 'lucide-react';

interface Stats {
    totalUsers: number; activeClubs: number; pendingClubs: number;
    upcomingEvents: number; pendingEvents: number; openTickets: number;
    totalRevenue: number; pendingOrders: number; newUsersToday: number; newUsersWeek: number;
}

interface Props {
    stats: Stats;
    pendingClubs: { id: number; name: string; slug: string; category: string; created_at: string; creator?: { name: string } }[];
    pendingEvents: { id: number; title: string; slug: string; venue: string; start_datetime: string; club?: { name: string }; creator?: { name: string } }[];
    recentUsers: { id: number; name: string; email: string; created_at: string; is_active: boolean }[];
    openTickets: { id: number; subject: string; status: string; priority: string; user?: { name: string }; created_at: string }[];
    revenueByDay: { date: string; total: number }[];
    aiStats?: { total_chats_today: number; helpful_rate: number };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '/admin' }];

function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export default function AdminDashboard({ stats, pendingClubs, pendingEvents, recentUsers, openTickets, revenueByDay, aiStats }: Props) {
    const revenueKES = (stats.totalRevenue / 100).toLocaleString('en-KE');
    const weekRevenue = revenueByDay.reduce((s, d) => s + d.total, 0);

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, sub: `+${stats.newUsersWeek} this week`, icon: Users, color: badgeTone.info, href: '/admin/users' },
        { label: 'Active Clubs', value: stats.activeClubs, sub: stats.pendingClubs > 0 ? `${stats.pendingClubs} pending` : 'All approved', icon: Shield, color: badgeTone.accent, href: '/admin/clubs' },
        { label: 'Upcoming Events', value: stats.upcomingEvents, sub: stats.pendingEvents > 0 ? `${stats.pendingEvents} pending` : 'All approved', icon: CalendarDays, color: badgeTone.success, href: '/admin/events' },
        { label: 'Revenue (KES)', value: revenueKES, sub: `KES ${(weekRevenue / 100).toLocaleString()} this week`, icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', href: '/admin/payments' },
        { label: 'Open Tickets', value: stats.openTickets, sub: 'Needs attention', icon: LifeBuoy, color: badgeTone.warning, href: '/admin/tickets' },
        { label: 'Pending Orders', value: stats.pendingOrders, sub: 'Awaiting payment', icon: ShoppingBag, color: badgeTone.neutral, href: '/admin/orders' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Welcome back — here's your platform overview</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-success" />
                        </span>
                        System operational
                    </div>
                </div>

                {/* Pending alerts */}
                {(stats.pendingClubs > 0 || stats.pendingEvents > 0) && (
                    <div className="flex flex-wrap gap-2">
                        {stats.pendingClubs > 0 && (
                            <Link href="/admin/clubs?status=pending">
                                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
                                    <Clock className="h-4 w-4" />
                                    {stats.pendingClubs} club{stats.pendingClubs > 1 ? 's' : ''} awaiting approval
                                    <ArrowRight className="h-3 w-3" />
                                </div>
                            </Link>
                        )}
                        {stats.pendingEvents > 0 && (
                            <Link href="/admin/events?status=pending">
                                <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm font-medium text-warning">
                                    <Clock className="h-4 w-4" />
                                    {stats.pendingEvents} event{stats.pendingEvents > 1 ? 's' : ''} awaiting approval
                                    <ArrowRight className="h-3 w-3" />
                                </div>
                            </Link>
                        )}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: 'Approve Events', href: '/admin/events/approve', icon: CalendarDays, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', count: stats.pendingEvents > 0 ? stats.pendingEvents : null },
                        { label: 'Train AI', href: '/admin/ai-training', icon: Bot, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', count: null },
                        { label: 'Site Settings', href: '/admin/site-settings', icon: Settings, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', count: null },
                        { label: 'Export Report', href: '/admin/reports', icon: Download, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', count: null },
                    ].map((a) => (
                        <Link key={a.label} href={a.href}>
                            <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                                <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                                    <div className={`relative rounded-xl p-2.5 ${a.color} transition-transform group-hover:scale-110`}>
                                        <a.icon className="h-5 w-5" />
                                        {a.count !== null && (
                                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                                                {a.count}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium leading-tight">{a.label}</span>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* AI Mini Stats */}
                {aiStats && (
                    <Card className="border-purple-200/60 bg-gradient-to-r from-purple-50/60 to-transparent dark:from-purple-950/20 dark:border-purple-900/40">
                        <CardContent className="flex items-center justify-between gap-4 p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
                                    <MessageCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">AI Conversations Today</p>
                                    <p className="text-xl font-bold">{aiStats.total_chats_today}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-yellow-500/10 p-2.5 text-yellow-600 dark:text-yellow-400">
                                    <ThumbsUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Helpful Rate</p>
                                    <p className="text-xl font-bold">{aiStats.helpful_rate}%</p>
                                </div>
                            </div>
                            <Link href="/admin/ai-training">
                                <Button variant="outline" size="sm" className="shrink-0">
                                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                                    Train AI
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    {statCards.map((s) => (
                        <Link key={s.label} href={s.href}>
                            <Card className="group transition-shadow hover:shadow-md cursor-pointer">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <div className={`rounded-xl p-3 ${s.color} transition-transform group-hover:scale-110`}>
                                        <s.icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-muted-foreground truncate">{s.label}</p>
                                        <p className="text-2xl font-bold leading-tight">{s.value}</p>
                                        <p className="text-xs text-muted-foreground truncate">{s.sub}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Main content grid */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Pending Clubs */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold">Pending Clubs</CardTitle>
                            <Link href="/admin/clubs?status=pending">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {pendingClubs.length > 0 ? pendingClubs.map((c) => (
                                <Link key={c.id} href={`/admin/clubs/${c.slug}`}>
                                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{c.name.charAt(0)}</div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{c.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{c.category}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{fmt(c.created_at)}</span>
                                    </div>
                                </Link>
                            )) : (
                                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-success" /> No pending clubs
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Events */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold">Pending Events</CardTitle>
                            <Link href="/admin/events?status=pending">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {pendingEvents.length > 0 ? pendingEvents.map((e) => (
                                <Link key={e.id} href={`/admin/events/${e.slug}`}>
                                    <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{e.title}</p>
                                            <p className="text-xs text-muted-foreground truncate">{e.club?.name ?? 'School-wide'} · {fmt(e.start_datetime)}</p>
                                        </div>
                                        <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-success" /> No pending events
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Open Tickets */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold">Open Tickets</CardTitle>
                            <Link href="/admin/tickets">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {openTickets.length > 0 ? openTickets.map((t) => (
                                <Link key={t.id} href={`/admin/tickets/${t.id}`}>
                                    <div className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors">
                                        <Badge className={`${ticketPriorityBadge(t.priority)} shrink-0 text-[10px] mt-0.5`}>{t.priority}</Badge>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{t.subject}</p>
                                            <p className="text-xs text-muted-foreground">{t.user?.name} · {fmt(t.created_at)}</p>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-success" /> No open tickets
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom row */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Recent Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold">Recent Registrations</CardTitle>
                            <Link href="/admin/users">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">View all <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {recentUsers.map((u) => (
                                <Link key={u.id} href={`/admin/users/${u.id}`}>
                                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/60 transition-colors">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                                {u.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`size-1.5 rounded-full ${u.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                                            <span className="text-xs text-muted-foreground">{fmt(u.created_at)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Revenue (last 7 days) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-sm font-semibold">Revenue — Last 7 Days</CardTitle>
                            <Link href="/admin/payments">
                                <Button variant="ghost" size="sm" className="h-7 text-xs">All payments <ArrowRight className="ml-1 h-3 w-3" /></Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <p className="text-3xl font-bold">KES {(weekRevenue / 100).toLocaleString('en-KE')}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-success" />
                                    Total revenue: KES {revenueKES}
                                </p>
                            </div>
                            {revenueByDay.length > 0 ? (
                                <div className="space-y-2">
                                    {revenueByDay.map((d) => {
                                        const max = Math.max(...revenueByDay.map((x) => x.total));
                                        const pct = max > 0 ? (d.total / max) * 100 : 0;
                                        return (
                                            <div key={d.date} className="flex items-center gap-3">
                                                <span className="w-16 shrink-0 text-xs text-muted-foreground">{fmt(d.date)}</span>
                                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-20 text-right text-xs font-medium">{(d.total / 100).toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">No transactions in the last 7 days</p>
                            )}

                            {/* Quick links */}
                            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
                                {[
                                    { label: 'Reports', href: '/admin/reports' },
                                    { label: 'Orders', href: '/admin/orders' },
                                    { label: 'Merch', href: '/admin/merchandise' },
                                ].map((l) => (
                                    <Link key={l.label} href={l.href}>
                                        <div className="rounded-lg border border-border px-3 py-2 text-center text-xs font-medium hover:bg-muted transition-colors">
                                            {l.label}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
