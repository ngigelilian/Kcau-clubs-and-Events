import { Head, Link, router } from '@inertiajs/react';
import { Check, ShieldCheck, Trash2, X } from 'lucide-react';
import DataPagination from '@/components/shared/data-pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { index, show, members as membersRoute } from '@/routes/clubs';
import type { BreadcrumbItem, Club, ClubMembership, PaginatedResponse } from '@/types';

interface Props {
    club: Club;
    members: PaginatedResponse<ClubMembership>;
    pendingRequests: ClubMembership[];
    isChairperson: boolean;
}

const roleBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    chairperson: { label: 'Chairperson', variant: 'default' },
    secretary: { label: 'Secretary', variant: 'secondary' },
    treasurer: { label: 'Treasurer', variant: 'secondary' },
    co_chair: { label: 'Co-Chair', variant: 'secondary' },
    member: { label: 'Member', variant: 'outline' },
};

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    pending: { label: 'Pending', variant: 'secondary' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function ClubMembers({ club, members: membersData, pendingRequests, isChairperson }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clubs', href: index.url() },
        { title: club.name, href: show.url(club.slug) },
        { title: 'Members', href: '#' },
    ];

    const baseUrl = membersRoute.url(club.slug);

    const handleApprove = (membershipId: number) => {
        router.post(`${baseUrl}/${membershipId}/approve`);
    };

    const handleReject = (membershipId: number) => {
        router.post(`${baseUrl}/${membershipId}/reject`);
    };

    const handleRemove = (membershipId: number) => {
        if (confirm('Are you sure you want to remove this member?')) {
            router.delete(`${baseUrl}/${membershipId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${club.name} — Members`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{club.name} — Members</h1>
                        <p className="text-muted-foreground">Manage club membership and join requests.</p>
                    </div>
                    {isChairperson && (
                        <Link href={`/clubs/${club.slug}/leaders`}>
                            <Button variant="outline" size="sm">
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                                Manage Leadership Team
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Pending Requests
                                <Badge variant="secondary">{pendingRequests.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Students waiting for approval to join your club.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pendingRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={req.user?.avatar ?? undefined} />
                                                <AvatarFallback>{req.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{req.user?.name}</p>
                                                <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleReject(req.id)}>
                                                <X className="mr-1 h-3.5 w-3.5" />
                                                Reject
                                            </Button>
                                            <Button size="sm" onClick={() => handleApprove(req.id)}>
                                                <Check className="mr-1 h-3.5 w-3.5" />
                                                Approve
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Active Members */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Members
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({membersData.total} total)
                            </span>
                        </CardTitle>
                        <CardDescription>
                            Leadership positions (Chairperson, Secretary, Treasurer, Co-Chair) are managed from the
                            {isChairperson ? ' Leadership Team page above' : ' Leadership Team page'} — only plain
                            members can be removed here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {membersData.data.map((m) => {
                                    const role = roleBadge[m.role] ?? roleBadge.member;
                                    const status = statusBadge[m.status] ?? statusBadge.pending;
                                    const isPlainMember = m.role === 'member';

                                    return (
                                        <TableRow key={m.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={m.user?.avatar ?? undefined} />
                                                        <AvatarFallback>{m.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{m.user?.name}</p>
                                                        <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{m.user?.student_id ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant={role.variant}>{role.label}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={status.variant}>{status.label}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {m.joined_at
                                                    ? new Date(m.joined_at).toLocaleDateString('en-KE', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isPlainMember && m.status === 'active' && (
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-destructive"
                                                            title="Remove member"
                                                            onClick={() => handleRemove(m.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {membersData.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                            No members yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4">
                            <DataPagination data={membersData} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
