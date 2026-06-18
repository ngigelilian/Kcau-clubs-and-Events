import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DataPagination from '@/components/shared/data-pagination';
import { announcementAudienceBadge } from '@/lib/color-badges';
import type { Announcement, BreadcrumbItem, Club, PaginatedResponse } from '@/types';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';

interface Props {
    announcements: PaginatedResponse<Announcement>;
    filters: { search: string; club_id: string };
    clubs: Pick<Club, 'id' | 'name'>[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Announcements', href: '/admin/announcements' },
];

export default function AdminAnnouncementsIndex({ announcements, filters, clubs }: Props) {
    const [search, setSearch] = useState(filters.search);

    const handleSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        router.get('/admin/announcements', { search, club_id: filters.club_id }, { preserveState: true });
    }, [search, filters.club_id]);

    const handleDelete = (id: number) => {
        if (!confirm('Delete this announcement?')) return;
        router.delete(`/admin/announcements/${id}`);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                        <p className="text-muted-foreground">Manage platform announcements</p>
                    </div>
                    <Link href="/admin/announcements/create">
                        <Button><Plus className="mr-2 h-4 w-4" />New Announcement</Button>
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Club</TableHead>
                                    <TableHead>Audience</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Published</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {announcements.data.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                                        <TableCell className="text-sm">{a.club?.name ?? <span className="text-muted-foreground">System-wide</span>}</TableCell>
                                        <TableCell>
                                            <Badge className={announcementAudienceBadge(a.audience as string)}>{(a.audience as string).replace(/_/g, ' ')}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{a.author?.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {a.published_at ? new Date(a.published_at).toLocaleDateString() : <span className="text-warning">Draft</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {announcements.data.length === 0 && (
                                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No announcements found</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DataPagination data={announcements} />
            </div>
        </AdminLayout>
    );
}
