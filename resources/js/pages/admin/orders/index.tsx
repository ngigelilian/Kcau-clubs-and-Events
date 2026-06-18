import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataPagination from '@/components/shared/data-pagination';
import { badgeTone } from '@/lib/color-badges';
import type { BreadcrumbItem, Order, PaginatedResponse } from '@/types';
import { Search } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';

interface Props {
    orders: PaginatedResponse<Order & { orderable_name: string }>;
    filters: { status: string; search: string };
    statusCounts: Record<string, number>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Orders', href: '/admin/orders' },
];

const orderStatusBadge: Record<string, string> = {
    pending: badgeTone.warning,
    paid: badgeTone.info,
    fulfilled: badgeTone.success,
    cancelled: badgeTone.destructive,
};

export default function AdminOrdersIndex({ orders, filters, statusCounts }: Props) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/orders', { search, status: filters.status }, { preserveState: true });
    }, [search, filters.status]);

    const handleTab = (status: string) => {
        router.get('/admin/orders', { status: status === 'all' ? '' : status, search }, { preserveState: true });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="All Orders" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">All orders across the platform</p>
                </div>

                <Tabs value={filters.status || 'all'} onValueChange={handleTab}>
                    <TabsList>
                        {Object.entries(statusCounts).map(([k, v]) => (
                            <TabsTrigger key={k} value={k} className="capitalize">{k} ({v})</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by user name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.map((o) => (
                                    <TableRow key={o.id}>
                                        <TableCell className="text-muted-foreground">{o.id}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{o.user?.name}</p>
                                                <p className="text-xs text-muted-foreground">{o.user?.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{o.orderable_name}</TableCell>
                                        <TableCell>{o.quantity}</TableCell>
                                        <TableCell className="font-medium">{o.formatted_total}</TableCell>
                                        <TableCell>
                                            <Badge className={orderStatusBadge[o.status] ?? badgeTone.neutral}>{o.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(o.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.data.length === 0 && (
                                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No orders found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DataPagination data={orders} />
            </div>
        </AdminLayout>
    );
}
