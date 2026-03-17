import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { BreadcrumbItem, Club, Event, Order, Announcement, Payment } from '@/types';
import {
    Users, CalendarDays, ShoppingBag, Bell, LifeBuoy, ArrowRight,
    Clock, DollarSign, Shield
} from 'lucide-react';

interface StudentProps {
    isAdmin: false;
    myClubs: Club[];
    myUpcomingEvents: Event[];
    upcomingEvents: Event[];
    myOrders: Order[];
    recentPayments: Payment[];
    announcements: Announcement[];
    openTickets: number;
}
interface AdminStats { totalUsers: number; totalClubs: number; totalEvents: number; totalRevenue: number; pendingClubs: number; pendingEvents: number; }
interface AdminProps {
    isAdmin: true;
    stats: AdminStats;
    recentUsers: { id: number; name: string; email: string; avatar?: string; created_at: string; }[];
    pendingClubs: Club[];
    pendingEvents: Event[];
    recentOrders: Order[];
    announcements: Announcement[];
}
type Props = StudentProps | AdminProps;

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }); }
function formatTime(d: string) { return new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }); }

function AdminDashboard({ stats, recentUsers, pendingClubs, pendingEvents, recentOrders, announcements }: AdminProps) {
    const statCards = [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300' },
        { label: 'Active Clubs', value: stats.totalClubs, icon: Shield, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300' },
        { label: 'Total Events', value: stats.totalEvents, icon: CalendarDays, color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300' },
        { label: 'Revenue (KES)', value: stats.totalRevenue / 100, icon: DollarSign, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300' },
    ];
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1><p className="text-muted-foreground">System overview and management</p></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((s) => (
                    <Card key={s.label}><CardContent className="flex items-center gap-4 p-5"><div className={`rounded-lg p-3 ${s.color}`}><s.icon className="h-6 w-6" /></div><div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value.toLocaleString()}</p></div></CardContent></Card>
                ))}
            </div>
            {(stats.pendingClubs > 0 || stats.pendingEvents > 0) && (
                <div className="flex flex-wrap gap-3">
                    {stats.pendingClubs > 0 && <Link href="/admin/clubs"><Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-muted"><Clock className="mr-2 h-4 w-4" />{stats.pendingClubs} pending club(s)</Badge></Link>}
                    {stats.pendingEvents > 0 && <Link href="/admin/events"><Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-muted"><Clock className="mr-2 h-4 w-4" />{stats.pendingEvents} pending event(s)</Badge></Link>}
                </div>
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Pending Clubs</CardTitle><Link href="/admin/clubs"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{pendingClubs.length > 0 ? <div className="space-y-3">{pendingClubs.map((c) => (<Link key={c.id} href={`/admin/clubs/${c.slug}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><div><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.category}</p></div><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></Link>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No pending clubs</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Pending Events</CardTitle><Link href="/admin/events"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{pendingEvents.length > 0 ? <div className="space-y-3">{pendingEvents.map((e) => (<Link key={e.id} href={`/admin/events/${e.slug}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><div><p className="font-medium">{e.title}</p><p className="text-sm text-muted-foreground">{formatDate(e.start_datetime)}</p></div><Badge className="bg-yellow-100 text-yellow-800">Pending</Badge></Link>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No pending events</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recent Users</CardTitle><Link href="/admin/users"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent><div className="space-y-3">{recentUsers.map((u) => (<Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"><Avatar className="h-9 w-9"><AvatarImage src={u.avatar} /><AvatarFallback>{u.name.charAt(0)}</AvatarFallback></Avatar><div className="flex-1 min-w-0"><p className="font-medium truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div><span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span></Link>))}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
                    <CardContent>{recentOrders.length > 0 ? <div className="space-y-3">{recentOrders.map((o) => (<div key={o.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">Order #{o.id}</p><p className="text-sm text-muted-foreground">{o.user?.name}</p></div><div className="text-right"><p className="font-medium">{o.formatted_total}</p><Badge variant="outline" className="text-xs">{o.status}</Badge></div></div>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No recent orders</p>}</CardContent>
                </Card>
            </div>
        </div>
    );
}

function StudentDashboard({ myClubs, myUpcomingEvents, upcomingEvents, myOrders, recentPayments, announcements, openTickets }: StudentProps) {
    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="text-muted-foreground">Welcome back! Here's what's happening.</p></div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900"><Shield className="h-5 w-5 text-purple-600 dark:text-purple-300" /></div><div><p className="text-2xl font-bold">{myClubs.length}</p><p className="text-xs text-muted-foreground">My Clubs</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-green-100 p-2 dark:bg-green-900"><CalendarDays className="h-5 w-5 text-green-600 dark:text-green-300" /></div><div><p className="text-2xl font-bold">{myUpcomingEvents.length}</p><p className="text-xs text-muted-foreground">Upcoming</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900"><ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-300" /></div><div><p className="text-2xl font-bold">{myOrders.length}</p><p className="text-xs text-muted-foreground">Orders</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900"><LifeBuoy className="h-5 w-5 text-orange-600 dark:text-orange-300" /></div><div><p className="text-2xl font-bold">{openTickets}</p><p className="text-xs text-muted-foreground">Open Tickets</p></div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">My Clubs</CardTitle><Link href="/clubs"><Button variant="ghost" size="sm">Browse <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{myClubs.length > 0 ? <div className="space-y-3">{myClubs.slice(0, 5).map((c) => (<Link key={c.id} href={`/clubs/${c.slug}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">{c.logo_url ? <img src={c.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <Shield className="h-5 w-5 text-primary" />}</div><div className="flex-1 min-w-0"><p className="font-medium truncate">{c.name}</p><p className="text-xs text-muted-foreground">{c.category}</p></div></Link>))}</div> : <div className="text-center py-6"><p className="text-sm text-muted-foreground mb-2">You haven't joined any clubs yet</p><Link href="/clubs"><Button variant="outline" size="sm">Explore Clubs</Button></Link></div>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">My Upcoming Events</CardTitle><Link href="/events"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{myUpcomingEvents.length > 0 ? <div className="space-y-3">{myUpcomingEvents.slice(0, 5).map((e) => (<Link key={e.id} href={`/events/${e.slug}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"><div className="rounded-lg bg-green-100 p-2 dark:bg-green-900"><CalendarDays className="h-5 w-5 text-green-600 dark:text-green-300" /></div><div className="flex-1 min-w-0"><p className="font-medium truncate">{e.title}</p><p className="text-xs text-muted-foreground">{formatDate(e.start_datetime)} at {formatTime(e.start_datetime)}</p></div></Link>))}</div> : <div className="text-center py-6"><p className="text-sm text-muted-foreground mb-2">No upcoming events</p><Link href="/events"><Button variant="outline" size="sm">Browse Events</Button></Link></div>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recent Orders</CardTitle><Link href="/orders"><Button variant="ghost" size="sm">Full history <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{myOrders.length > 0 ? <div className="space-y-3">{myOrders.map((order) => (<div key={order.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">Order #{order.id}</p><p className="text-xs text-muted-foreground">{order.status}</p></div><div className="text-right"><p className="font-medium">{order.formatted_total}</p><p className="text-xs text-muted-foreground">{(order as Order & { latest_payment?: Payment }).latest_payment?.status ?? 'No payment'}</p></div></div>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recent Payments</CardTitle><Link href="/payments"><Button variant="ghost" size="sm">Full history <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{recentPayments.length > 0 ? <div className="space-y-3">{recentPayments.map((payment) => (<div key={payment.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium">Payment #{payment.id}</p><p className="text-xs text-muted-foreground">{payment.phone_number}</p></div><div className="text-right"><p className="font-medium">{payment.formatted_amount}</p><Badge variant="outline" className="text-xs">{payment.status}</Badge></div></div>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No payments yet</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Latest Announcements</CardTitle><Link href="/announcements"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{announcements.length > 0 ? <div className="space-y-3">{announcements.slice(0, 4).map((a) => (<Link key={a.id} href={`/announcements/${a.id}`} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"><Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" /><div className="flex-1 min-w-0"><p className="font-medium truncate text-sm">{a.title}</p><p className="text-xs text-muted-foreground line-clamp-1">{a.content}</p></div><span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.created_at)}</span></Link>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No announcements</p>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Discover Events</CardTitle><Link href="/events"><Button variant="ghost" size="sm">View all <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></CardHeader>
                    <CardContent>{upcomingEvents.length > 0 ? <div className="space-y-3">{upcomingEvents.slice(0, 5).map((e) => (<Link key={e.id} href={`/events/${e.slug}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><div className="flex-1 min-w-0"><p className="font-medium truncate">{e.title}</p><p className="text-xs text-muted-foreground">{formatDate(e.start_datetime)} · {e.venue}</p></div>{e.is_paid ? <Badge variant="secondary">{e.formatted_fee}</Badge> : <Badge variant="outline">Free</Badge>}</Link>))}</div> : <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>}</CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function Dashboard(props: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {props.isAdmin ? <AdminDashboard {...props} /> : <StudentDashboard {...props} />}
            </div>
        </AppLayout>
    );
}
