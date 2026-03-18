import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem, Payment } from '@/types';
import { Download } from 'lucide-react';

interface PaginatedPayments {
    data: (Payment & { orderable_name?: string })[];
}

interface Props {
    payments: PaginatedPayments;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payment History', href: '/payments' },
];

export default function PaymentsIndex({ payments }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment History" />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
                    <p className="text-muted-foreground">Review M-Pesa attempts, receipts, and payment outcomes.</p>
                </div>

                <div className="space-y-4">
                    {payments.data.map((payment) => (
                        <Card key={payment.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">Payment #{payment.id}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{payment.orderable_name ?? 'Order item'}</p>
                                </div>
                                <Badge variant="outline">{payment.status}</Badge>
                            </CardHeader>
                            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                                <div>
                                    <p>Phone: {payment.phone_number}</p>
                                    <p>Created: {new Date(payment.created_at).toLocaleString('en-KE')}</p>
                                    <p>Checkout ID: {payment.mpesa_checkout_request_id ?? 'Pending assignment'}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="font-semibold text-foreground">{payment.formatted_amount}</p>
                                    <p>Receipt: {payment.mpesa_receipt_number ?? 'Not yet issued'}</p>
                                    <p>{payment.failure_reason ?? 'Awaiting callback or completed successfully.'}</p>

                                    {payment.status === 'completed' && payment.mpesa_receipt_number && (
                                        <div className="mt-3">
                                            <Button asChild size="sm" variant="outline">
                                                <a href={`/payments/${payment.id}/receipt`}>
                                                    <Download className="mr-2 h-4 w-4" />Download Receipt
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {payments.data.length === 0 && (
                        <Card>
                            <CardContent className="py-10 text-center text-sm text-muted-foreground">
                                No payment records yet. <Link href="/events" className="text-primary hover:underline">Browse events</Link>.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}