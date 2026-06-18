import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataPagination from '@/components/shared/data-pagination';
import { badgeTone } from '@/lib/color-badges';
import type { BreadcrumbItem, Order, PaginatedResponse } from '@/types';
import { ArrowLeft, Package } from 'lucide-react';

interface Props {
    orders: PaginatedResponse<Order & { orderable_name: string }>;
    filters: { status: string };
    statusCounts: Record<string, number>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Merchandise', href: '/admin/merchandise' },
    { title: 'Orders', href: '/admin/merchandise/orders' },
];

const statusBadge: Record<string, string> = {
    pending: badgeTone.warning,
    paid: badgeTone.info,
    fulfilled: badgeTone.success,
    cancelled: badgeTone.destructive,
};

export default function AdminMerchandiseOrders({ orders, filters, statusCounts }: Props) {
    const handleTab = (status: string) => {
        router.get('/admin/merchandise/orders', { status: status === 'all' ? '' : status }, { preserveState: true });
    };

    const fulfill = (id: number) => {
        router.post(`/admin/merchandise/orders/${id}/fulfill`);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Merchandise Orders" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/merchandise"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" />Back</Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Merchandise Orders</h1>
                        <p className="text-muted-foreground">Manage and fulfil merchandise orders</p>
                    </div>
                </div>

                <Tabs value={filters.status || 'all'} onValueChange={handleTab}>
                    <TabsList>
                        {Object.entries(statusCounts).map(([k, v]) => (
                            <TabsTrigger key={k} value={k} className="capitalize">{k} ({v})</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

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
                                    <TableHead className="text-right">Action</TableHead>
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
                                            <Badge className={statusBadge[o.status] ?? badgeTone.neutral}>{o.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(o.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {o.status === 'paid' && (
                                                <Button size="sm" variant="outline" onClick={() => fulfill(o.id)}>
                                                    <Package className="mr-1 h-4 w-4" />Fulfil
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders.data.length === 0 && (
                                    <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No orders found</TableCell></TableRow>
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
