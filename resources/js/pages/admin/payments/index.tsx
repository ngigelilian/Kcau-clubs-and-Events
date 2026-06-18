import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataPagination from '@/components/shared/data-pagination';
import { badgeTone } from '@/lib/color-badges';
import type { BreadcrumbItem, Payment, PaginatedResponse } from '@/types';
import { Search } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';

interface Props {
    payments: PaginatedResponse<Payment & { orderable_name: string }>;
    filters: { status: string; search: string };
    statusCounts: Record<string, number>;
    totalRevenue: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Payments', href: '/admin/payments' },
];

const statusBadge: Record<string, string> = {
    completed: badgeTone.success,
    pending: badgeTone.warning,
    failed: badgeTone.destructive,
    initiated: badgeTone.neutral,
};

export default function AdminPaymentsIndex({ payments, filters, statusCounts, totalRevenue }: Props) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/payments', { search, status: filters.status }, { preserveState: true });
    }, [search, filters.status]);

    const handleTab = (status: string) => {
        router.get('/admin/payments', { status: status === 'all' ? '' : status, search }, { preserveState: true });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="All Payments" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
                        <p className="text-muted-foreground">All M-Pesa transactions across the platform</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">KES {(totalRevenue / 100).toLocaleString()}</p>
                    </div>
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
                    <Input placeholder="Search by name, phone, receipt…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>For</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Receipt</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="text-muted-foreground">{p.id}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{p.user?.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{p.orderable_name}</TableCell>
                                        <TableCell className="text-sm">{p.phone_number}</TableCell>
                                        <TableCell className="font-mono text-xs">{p.mpesa_receipt_number || '—'}</TableCell>
                                        <TableCell className="font-medium">{p.formatted_amount}</TableCell>
                                        <TableCell>
                                            <Badge className={statusBadge[p.status] ?? badgeTone.neutral}>{p.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {payments.data.length === 0 && (
                                    <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No payments found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DataPagination data={payments} />
            </div>
        </AdminLayout>
    );
}
