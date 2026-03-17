import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, Order, Payment } from '@/types';

interface PaginatedOrders {
    data: (Order & { latest_payment?: Payment | null; orderable_name?: string })[];
}

interface Props {
    orders: PaginatedOrders;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Order History', href: '/orders' },
];

export default function OrdersIndex({ orders }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Order History" />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
                    <p className="text-muted-foreground">Track merchandise purchases and paid event registrations.</p>
                </div>

                <div className="space-y-4">
                    {orders.data.map((order) => (
                        <Card key={order.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">Order #{order.id}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{order.orderable_name ?? 'Order item'}</p>
                                </div>
                                <Badge variant="outline">{order.status}</Badge>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p>Quantity: {order.quantity}</p>
                                    <p>Created: {new Date(order.created_at).toLocaleString('en-KE')}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="font-semibold text-foreground">{order.formatted_total}</p>
                                    <p>Latest payment: {order.latest_payment?.status ?? 'No payment attempt'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {orders.data.length === 0 && (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No orders yet. <Link href="/merchandise" className="text-primary hover:underline">Browse merchandise</Link>.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}