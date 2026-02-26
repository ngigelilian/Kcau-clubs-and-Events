import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import DataPagination from '@/components/shared/data-pagination';
import type { BreadcrumbItem, Club, PaginatedResponse } from '@/types';
import { Eye, Search } from 'lucide-react';
import * as adminClubs from '@/routes/admin';
import { useState, useCallback, type FormEvent } from 'react';

interface Filters {
    status: string;
    search: string;
}

interface StatusCounts {
    all: number;
    pending: number;
    active: number;
    suspended: number;
}

interface Props {
    clubs: PaginatedResponse<Club>;
    filters: Filters;
    statusCounts: StatusCounts;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Clubs', href: '#' },
];

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    pending: { label: 'Pending', variant: 'secondary' },
    suspended: { label: 'Suspended', variant: 'destructive' },
};

export default function AdminClubIndex({ clubs, filters, statusCounts }: Props) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            router.get('/admin/clubs', { search, status: filters.status }, { preserveState: true });
        },
        [search, filters.status],
    );

    const handleStatusFilter = useCallback(
        (status: string) => {
            router.get('/admin/clubs', { status: status === 'all' ? '' : status, search }, { preserveState: true });
        },
        [search],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Clubs" />

            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Club Management</h1>
                    <p className="text-muted-foreground">Review, approve, and manage student clubs.</p>
                </div>

                {/* Status Tabs */}
                <Tabs value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                    <TabsList>
                        <TabsTrigger value="all">
                            All ({statusCounts.all})
                        </TabsTrigger>
                        <TabsTrigger value="pending">
                            Pending ({statusCounts.pending})
                        </TabsTrigger>
                        <TabsTrigger value="active">
                            Active ({statusCounts.active})
                        </TabsTrigger>
                        <TabsTrigger value="suspended">
                            Suspended ({statusCounts.suspended})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search clubs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </form>

                {/* Clubs Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Club</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Members</TableHead>
                                    <TableHead>Proposed By</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clubs.data.map((club) => {
                                    const status = statusBadge[club.status] ?? statusBadge.pending;
                                    return (
                                        <TableRow key={club.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {club.logo_url ? (
                                                        <img
                                                            src={club.logo_url}
                                                            alt={club.name}
                                                            className="h-8 w-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                            {club.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="font-medium">{club.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{club.category}</TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell>{club.active_members_count ?? 0}</TableCell>
                                            <TableCell className="text-sm">{club.creator?.name ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(club.created_at).toLocaleDateString('en-KE', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/clubs/${club.slug}`}>
                                                    <Button size="sm" variant="ghost">
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        Review
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {clubs.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                            No clubs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <DataPagination data={clubs} />
            </div>
        </AppLayout>
    );
}
