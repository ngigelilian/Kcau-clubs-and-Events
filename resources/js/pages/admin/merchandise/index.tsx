import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataPagination from '@/components/shared/data-pagination';
import { badgeTone } from '@/lib/color-badges';
import type { BreadcrumbItem, Merchandise, PaginatedResponse } from '@/types';
import { Search, ShoppingCart } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';

interface Props {
    merchandise: PaginatedResponse<Merchandise>;
    filters: { search: string; status: string };
    statusCounts: Record<string, number>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Merchandise', href: '/admin/merchandise' },
];

const statusBadge: Record<string, string> = {
    available: badgeTone.success,
    out_of_stock: badgeTone.warning,
    discontinued: badgeTone.destructive,
};

export default function AdminMerchandiseIndex({ merchandise, filters, statusCounts }: Props) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/merchandise', { search, status: filters.status }, { preserveState: true });
    }, [search, filters.status]);

    const handleTab = (status: string) => {
        router.get('/admin/merchandise', { status: status === 'all' ? '' : status, search }, { preserveState: true });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="All Merchandise" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Merchandise</h1>
                        <p className="text-muted-foreground">All merchandise items across clubs</p>
                    </div>
                    <Link href="/admin/merchandise/orders">
                        <Button variant="outline"><ShoppingCart className="mr-2 h-4 w-4" />View Orders</Button>
                    </Link>
                </div>

                <Tabs value={filters.status || 'all'} onValueChange={handleTab}>
                    <TabsList>
                        {Object.entries(statusCounts).map(([k, v]) => (
                            <TabsTrigger key={k} value={k} className="capitalize">{k.replace(/_/g, ' ')} ({v})</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search merchandise…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Club</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Orders</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Added</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {merchandise.data.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {m.image_url ? (
                                                    <img src={m.image_url} alt={m.name} className="h-10 w-10 rounded object-cover" />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-bold">{m.name.charAt(0)}</div>
                                                )}
                                                <span className="font-medium">{m.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{m.club?.name}</TableCell>
                                        <TableCell className="font-medium">{m.formatted_price}</TableCell>
                                        <TableCell>{m.stock_quantity}</TableCell>
                                        <TableCell>{(m as Merchandise & { orders_count?: number }).orders_count ?? 0}</TableCell>
                                        <TableCell>
                                            <Badge className={statusBadge[m.status] ?? badgeTone.neutral}>{m.status.replace(/_/g, ' ')}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(m.created_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {merchandise.data.length === 0 && (
                                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No merchandise found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DataPagination data={merchandise} />
            </div>
        </AdminLayout>
    );
}
