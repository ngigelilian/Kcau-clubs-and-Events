import { Head, router } from '@inertiajs/react';
import { DollarSign, Users, CalendarDays, LifeBuoy, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { badgeTone, eventStatusBadge } from '@/lib/color-badges';
import type { BreadcrumbItem, Club, Event } from '@/types';

interface RevenueEntry { date: string; total: number }
interface Props {
    range: string;
    revenueByDay: RevenueEntry[];
    usersByDay: { date: string; total: number }[];
    userCount: number;
    clubStats: { total: number; active: number; pending: number; new_this_period: number };
    eventStats: { total: number; approved: number; completed: number; registrations: number; attended: number };
    paymentStats: { total_revenue: number; this_period: number; total_orders: number; fulfilled_orders: number };
    ticketStats: { open: number; resolved: number; this_period: number };
    topClubs: (Pick<Club, 'id' | 'name' | 'category'> & { members_count: number })[];
    topEvents: (Pick<Event, 'id' | 'title' | 'status' | 'start_datetime'> & { reg_count: number })[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Reports', href: '/admin/reports' },
];

export default function AdminReports({
    range, revenueByDay, paymentStats, clubStats, eventStats, ticketStats, userCount, topClubs, topEvents,
}: Props) {
    const handleRange = (v: string) => router.get('/admin/reports', { range: v }, { preserveState: true });

    const periodRevenue = (paymentStats.this_period / 100).toLocaleString('en-KE');
    const totalRevenue = (paymentStats.total_revenue / 100).toLocaleString('en-KE');

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                        <p className="text-muted-foreground">Platform overview and key metrics</p>
                    </div>
                    <Select value={range} onValueChange={handleRange}>
                        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card><CardContent className="flex items-center gap-4 p-5">
                        <div className={`rounded-lg p-3 ${badgeTone.info}`}><Users className="h-6 w-6" /></div>
                        <div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{userCount.toLocaleString()}</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="flex items-center gap-4 p-5">
                        <div className={`rounded-lg p-3 ${badgeTone.success}`}><DollarSign className="h-6 w-6" /></div>
                        <div><p className="text-sm text-muted-foreground">Revenue (KES)</p><p className="text-2xl font-bold">{totalRevenue}</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="flex items-center gap-4 p-5">
                        <div className={`rounded-lg p-3 ${badgeTone.accent}`}><CalendarDays className="h-6 w-6" /></div>
                        <div><p className="text-sm text-muted-foreground">Event Registrations</p><p className="text-2xl font-bold">{eventStats.registrations.toLocaleString()}</p></div>
                    </CardContent></Card>
                    <Card><CardContent className="flex items-center gap-4 p-5">
                        <div className={`rounded-lg p-3 ${badgeTone.warning}`}><LifeBuoy className="h-6 w-6" /></div>
                        <div><p className="text-sm text-muted-foreground">Open Tickets</p><p className="text-2xl font-bold">{ticketStats.open}</p></div>
                    </CardContent></Card>
                </div>

                {/* Period revenue */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Revenue This Period</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">KES {periodRevenue}</p>
                            <p className="text-sm text-muted-foreground mt-1">{revenueByDay.length} days with transactions</p>
                            <div className="mt-4 space-y-1 max-h-40 overflow-y-auto">
                                {revenueByDay.slice(-7).map((d) => (
                                    <div key={d.date} className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{new Date(d.date).toLocaleDateString()}</span>
                                        <span className="font-medium">KES {(d.total / 100).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Clubs</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { label: 'Total', value: clubStats.total },
                                { label: 'Active', value: clubStats.active },
                                { label: 'Pending', value: clubStats.pending },
                                { label: `New (${range}d)`, value: clubStats.new_this_period },
                            ].map((s) => (
                                <div key={s.label} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{s.label}</span>
                                    <span className="font-medium">{s.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Orders</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { label: 'Total', value: paymentStats.total_orders },
                                { label: 'Fulfilled', value: paymentStats.fulfilled_orders },
                                { label: 'Tickets Resolved', value: ticketStats.resolved },
                                { label: `Tickets (${range}d)`, value: ticketStats.this_period },
                            ].map((s) => (
                                <div key={s.label} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{s.label}</span>
                                    <span className="font-medium">{s.value}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Top clubs + top events */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Top Clubs by Members</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Club</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Members</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topClubs.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell className="text-sm capitalize">{c.category}</TableCell>
                                            <TableCell className="text-right font-medium">{c.members_count}</TableCell>
                                        </TableRow>
                                    ))}
                                    {topClubs.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No data</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base">Top Events by Registrations</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Registered</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {topEvents.map((e) => (
                                        <TableRow key={e.id}>
                                            <TableCell className="font-medium max-w-[160px] truncate">{e.title}</TableCell>
                                            <TableCell><Badge className={eventStatusBadge(e.status)}>{e.status}</Badge></TableCell>
                                            <TableCell className="text-right font-medium">{e.reg_count}</TableCell>
                                        </TableRow>
                                    ))}
                                    {topEvents.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-4">No data</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
