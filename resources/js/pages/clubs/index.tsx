import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ClubCard from '@/components/clubs/club-card';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, Club, PaginatedResponse } from '@/types';
import { Plus, Search } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';
import { index, create } from '@/routes/clubs';
import { Link } from '@inertiajs/react';

interface Category {
    value: string;
    label: string;
}

interface Filters {
    search: string;
    category: string;
    sort: string;
}

interface Props {
    clubs: PaginatedResponse<Club>;
    filters: Filters;
    categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Clubs', href: index.url() },
];

export default function ClubIndex({ clubs, filters, categories }: Props) {
    const { auth } = usePage().props as { auth: { user: { permissions: string[] } | null } };
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback(
        (e: FormEvent) => {
            e.preventDefault();
            router.get(index.url(), { search, category: filters.category, sort: filters.sort }, { preserveState: true });
        },
        [search, filters],
    );

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            router.get(
                index.url(),
                { ...filters, search, [key]: value === 'all' ? '' : value },
                { preserveState: true },
            );
        },
        [filters, search],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clubs" />

            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Discover Clubs</h1>
                        <p className="text-muted-foreground">
                            Browse and join student clubs at KCA University
                        </p>
                    </div>
                    {auth.user && (
                        <Link href={create.url()}>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Propose a Club
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search clubs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </form>

                    <Select value={filters.category || 'all'} onValueChange={(v) => handleFilterChange('category', v)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="popular">Most Popular</SelectItem>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="name">Name (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Club Grid */}
                {clubs.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {clubs.data.map((club) => (
                                <ClubCard key={club.id} club={club} />
                            ))}
                        </div>

                        <DataPagination data={clubs} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                        <p className="text-lg font-medium text-muted-foreground">No clubs found</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {filters.search || filters.category
                                ? 'Try adjusting your search or filters.'
                                : 'Be the first to propose a club!'}
                        </p>
                    </div>
                )}

                {/* Total count */}
                {clubs.total > 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                        Showing {clubs.from}–{clubs.to} of {clubs.total} clubs
                    </p>
                )}
            </div>
        </AppLayout>
    );
}
