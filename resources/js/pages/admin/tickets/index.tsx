import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataPagination from '@/components/shared/data-pagination';
import type { BreadcrumbItem, Ticket, PaginatedResponse, User } from '@/types';
import { AlertCircle, Clock, MessageCircle } from 'lucide-react';

interface Props {
    tickets: PaginatedResponse<Ticket>;
    filters: {
        status: string;
        priority: string;
        assigned_to: string;
        search: string;
        date_from: string;
        date_to: string;
    };
    statusCounts: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
        overdue: number;
    };
    adminUsers: User[];
    priorities: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Support Tickets', href: '/admin/tickets' },
];

function statusBadge(status: string) {
    // ✅ Replaced raw Tailwind color classes with semantic token-based classes
    // open      → destructive-toned (red-ish) using destructive token
    // in_progress → primary-toned (blue) using primary token
    // resolved  → success-toned using a muted success pattern
    // closed    → neutral muted
    const map: Record<string, string> = {
        open:        'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
        in_progress: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary',
        resolved:    'bg-accent/10 text-accent-foreground dark:bg-accent/20 dark:text-accent-foreground',
        closed:      'bg-muted text-muted-foreground',
    };
    return map[status] || 'bg-muted text-muted-foreground';
}

function priorityBadge(priority: string) {
    // ✅ Replaced raw Tailwind color classes with semantic token-based classes
    // low    → neutral muted
    // medium → accent-toned (gold) using accent token
    // high   → destructive-toned using destructive token
    const map: Record<string, string> = {
        low:    'bg-muted text-muted-foreground',
        medium: 'bg-accent/15 text-accent-foreground dark:bg-accent/20 dark:text-accent-foreground',
        high:   'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
    };
    return map[priority] || 'bg-muted text-muted-foreground';
}

export default function AdminTicketsIndex({
    tickets,
    filters,
    statusCounts,
    adminUsers,
    priorities,
    statuses,
}: Props) {
    const [searchValue, setSearchValue] = useState(filters.search);

    const handleFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([k, v]) => {
            if (v) params.append(k, v);
        });
        router.visit(`/admin/tickets?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter('search', searchValue);
    };

    const handleReset = () => {
        setSearchValue('');
        router.visit('/admin/tickets');
    };

    const isOverdue = (createdAt: string) => {
        const hoursAgo = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
        return hoursAgo > 48;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support Ticket Queue" />
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Support Ticket Queue</h1>
                    <p className="text-muted-foreground">Manage and respond to customer support tickets</p>
                </div>

                {/* Status Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{statusCounts.total}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{statusCounts.open}</p>
                                <p className="text-sm text-muted-foreground">Open</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-accent">{statusCounts.in_progress}</p>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary/70">{statusCounts.resolved}</p>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-muted-foreground">{statusCounts.closed}</p>
                                <p className="text-sm text-muted-foreground">Closed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={statusCounts.overdue > 0 ? 'border-destructive/40 bg-destructive/5 dark:bg-destructive/10' : ''}>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{statusCounts.overdue}</p>
                                <p className="text-sm text-muted-foreground">Overdue (48h+)</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
                                <Input
                                    placeholder="Search tickets..."
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="h-10"
                                />
                                <Select value={filters.status} onValueChange={(value) => handleFilter('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Statuses</SelectItem>
                                        {statuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.priority} onValueChange={(value) => handleFilter('priority', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Priorities</SelectItem>
                                        {priorities.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.assigned_to} onValueChange={(value) => handleFilter('assigned_to', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Assigned To" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Admins</SelectItem>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {adminUsers.map((u) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>
                                                {u.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                                    <Button type="submit" variant="default" size="sm">
                                        Search
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Tickets Table */}
                {tickets.data.length > 0 ? (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Replies</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tickets.data.map((ticket) => (
                                            <TableRow
                                                key={ticket.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.visit(`/admin/tickets/${ticket.id}`)}
                                            >
                                                <TableCell className="font-mono text-sm">#{ticket.id}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium max-w-xs truncate">{ticket.subject}</p>
                                                        <p className="text-xs text-muted-foreground">{ticket.user?.name}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusBadge(ticket.status)}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={priorityBadge(ticket.priority)}>
                                                        {ticket.priority}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {ticket.assignee ? (
                                                        <div className="flex items-center gap-2">
                                                            {ticket.assignee.avatar && (
                                                                <img
                                                                    src={ticket.assignee.avatar}
                                                                    alt={ticket.assignee.name}
                                                                    className="h-6 w-6 rounded-full"
                                                                />
                                                            )}
                                                            <span className="text-sm">{ticket.assignee.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        {isOverdue(ticket.created_at) && (
                                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                                        )}
                                                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <MessageCircle className="h-4 w-4" />
                                                        {ticket.replies_count ?? 0}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No tickets found</p>
                        <p className="mt-1 text-sm text-muted-foreground">Adjust your filters or check back later.</p>
                    </div>
                )}
                <DataPagination data={tickets} />
            </div>
        </AppLayout>
    );
}