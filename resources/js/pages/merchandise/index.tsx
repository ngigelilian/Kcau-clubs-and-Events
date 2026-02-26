import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, Merchandise, PaginatedResponse } from '@/types';
import { Search, ShoppingBag, Tag } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';

interface Club { id: number; name: string; }
interface Filters { search: string; club: string; sort: string; }
interface Props {
    merchandise: PaginatedResponse<Merchandise>;
    filters: Filters;
    clubs: Club[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Merchandise', href: '/merchandise' }];

export default function MerchandiseIndex({ merchandise, filters, clubs }: Props) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        router.get('/merchandise', { search, club: filters.club, sort: filters.sort }, { preserveState: true });
    }, [search, filters]);

    const handleFilterChange = useCallback((key: string, value: string) => {
        router.get('/merchandise', { ...filters, search, [key]: value === 'all' ? '' : value }, { preserveState: true });
    }, [filters, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Merchandise" />
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Merchandise</h1>
                        <p className="text-muted-foreground">Browse and order club merchandise</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search merchandise..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                    </form>
                    <Select value={filters.club || 'all'} onValueChange={(v) => handleFilterChange('club', v)}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All clubs" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All clubs</SelectItem>
                            {clubs.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.sort || 'latest'} onValueChange={(v) => handleFilterChange('sort', v)}>
                        <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="latest">Latest</SelectItem>
                            <SelectItem value="price_low">Price: Low</SelectItem>
                            <SelectItem value="price_high">Price: High</SelectItem>
                            <SelectItem value="popular">Popular</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {merchandise.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {merchandise.data.map((item) => (
                                <Link key={item.id} href={`/merchandise/${item.id}`} className="group">
                                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 overflow-hidden">
                                        <div className="relative aspect-square overflow-hidden bg-muted">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                                                </div>
                                            )}
                                            {item.status !== 'available' && (
                                                <Badge variant="destructive" className="absolute top-2 right-2">
                                                    {item.status === 'out_of_stock' ? 'Out of Stock' : 'Discontinued'}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardContent className="p-4 space-y-2">
                                            <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h3>
                                            {item.club && <p className="text-sm text-muted-foreground">{item.club.name}</p>}
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg font-bold text-primary">{item.formatted_price}</span>
                                                <span className="text-sm text-muted-foreground">{item.stock_quantity} left</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                        <DataPagination data={merchandise} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                        <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No merchandise found</p>
                        <p className="mt-1 text-sm text-muted-foreground">Check back later for new items!</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
