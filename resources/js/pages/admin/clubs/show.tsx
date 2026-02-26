import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { BreadcrumbItem, Club, ClubMembership } from '@/types';
import { Ban, Check, RefreshCw, Users, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    club: Club & { memberships?: ClubMembership[] };
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    pending: { label: 'Pending Approval', variant: 'secondary' },
    suspended: { label: 'Suspended', variant: 'destructive' },
};

export default function AdminClubShow({ club }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '#' },
        { title: 'Clubs', href: '/admin/clubs' },
        { title: club.name, href: '#' },
    ];

    const status = statusBadge[club.status] ?? statusBadge.pending;
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const suspendForm = useForm({ reason: '' });
    const rejectForm = useForm({ reason: '' });

    const handleApprove = () => {
        if (confirm(`Approve "${club.name}"? The proposer will become the club leader.`)) {
            router.post(`/admin/clubs/${club.slug}/approve`);
        }
    };

    const handleReject = () => {
        rejectForm.post(`/admin/clubs/${club.slug}/reject`, {
            onSuccess: () => setRejectOpen(false),
        });
    };

    const handleSuspend = () => {
        suspendForm.post(`/admin/clubs/${club.slug}/suspend`, {
            onSuccess: () => setSuspendOpen(false),
        });
    };

    const handleReactivate = () => {
        if (confirm(`Reactivate "${club.name}"?`)) {
            router.post(`/admin/clubs/${club.slug}/reactivate`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review: ${club.name}`} />

            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        {club.logo_url ? (
                            <img src={club.logo_url} alt={club.name} className="h-16 w-16 rounded-xl object-cover" />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-xl font-bold">
                                {club.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{club.name}</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant={status.variant}>{status.label}</Badge>
                                <Badge variant="outline" className="capitalize">{club.category}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {club.status === 'pending' && (
                            <>
                                <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <X className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Reject Club Proposal</DialogTitle>
                                            <DialogDescription>
                                                Provide a reason for rejecting "{club.name}".
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-2">
                                            <Label htmlFor="reject-reason">Reason (optional)</Label>
                                            <Textarea
                                                id="reject-reason"
                                                value={rejectForm.data.reason}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => rejectForm.setData('reason', e.target.value)}
                                                placeholder="Explain why this club was rejected..."
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                                            <Button variant="destructive" onClick={handleReject} disabled={rejectForm.processing}>
                                                Reject
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Button size="sm" onClick={handleApprove}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            </>
                        )}

                        {club.status === 'active' && (
                            <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Ban className="mr-2 h-4 w-4" />
                                        Suspend
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Suspend Club</DialogTitle>
                                        <DialogDescription>
                                            Provide a reason for suspending "{club.name}". The club will be hidden from discovery.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <Label htmlFor="suspend-reason">Reason *</Label>
                                        <Textarea
                                            id="suspend-reason"
                                            value={suspendForm.data.reason}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => suspendForm.setData('reason', e.target.value)}
                                            placeholder="Explain why this club is being suspended..."
                                        />
                                        {suspendForm.errors.reason && (
                                            <p className="text-sm text-destructive">{suspendForm.errors.reason}</p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={handleSuspend} disabled={suspendForm.processing}>
                                            Suspend
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}

                        {club.status === 'suspended' && (
                            <Button size="sm" onClick={handleReactivate}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reactivate
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Banner */}
                {club.banner_url && (
                    <div className="overflow-hidden rounded-lg">
                        <img src={club.banner_url} alt="Banner" className="h-48 w-full object-cover" />
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Club Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Description</Label>
                                <p className="mt-1 whitespace-pre-wrap">{club.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Category</span>
                                    <p className="font-medium capitalize">{club.category}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Max Members</span>
                                    <p className="font-medium">{club.max_members ?? 'Unlimited'}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Proposed</span>
                                    <p className="font-medium">
                                        {new Date(club.created_at).toLocaleDateString('en-KE', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                {club.approved_at && (
                                    <div>
                                        <span className="text-muted-foreground">Approved</span>
                                        <p className="font-medium">
                                            {new Date(club.approved_at).toLocaleDateString('en-KE', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proposer / Creator */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Proposed By</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Name</span>
                                <span className="font-medium">{club.creator?.name ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span className="font-medium">{club.creator?.email ?? '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Student ID</span>
                                <span className="font-medium">{club.creator?.student_id ?? '—'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Members */}
                {club.memberships && club.memberships.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Members ({club.active_members_count ?? 0} active)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {club.memberships.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between rounded border p-2 text-sm">
                                        <div>
                                            <span className="font-medium">{m.user?.name}</span>
                                            <span className="ml-2 text-muted-foreground">{m.user?.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="capitalize">{m.role}</Badge>
                                            <Badge
                                                variant={m.status === 'active' ? 'default' : m.status === 'rejected' ? 'destructive' : 'secondary'}
                                            >
                                                {m.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
