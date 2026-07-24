import { Head, router } from '@inertiajs/react';
import { Check, Mail, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, ClubLeaderInvitation } from '@/types';

interface Props {
    invitations: ClubLeaderInvitation[];
}

const roleLabel: Record<string, string> = {
    chairperson: 'Chairperson',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    co_chair: 'Co-Chair',
};

export default function InvitationsIndex({ invitations }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'My Invitations', href: '/invitations' },
    ];

    const handleAccept = (id: number) => {
        router.post(`/invitations/${id}/accept`);
    };

    const handleDecline = (id: number) => {
        if (confirm('Decline this invitation?')) {
            router.post(`/invitations/${id}/decline`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Invitations" />

            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Invitations</h1>
                    <p className="text-muted-foreground">Leadership invitations waiting for your response.</p>
                </div>

                {invitations.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                            <Mail className="h-8 w-8" />
                            <p>No pending invitations right now.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((inv) => (
                            <Card key={inv.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {inv.club?.name}
                                        <Badge>{roleLabel[inv.position] ?? inv.position}</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Invited by {inv.inviter?.name}
                                        {inv.expires_at && ` · expires ${new Date(inv.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex gap-2">
                                    <Button size="sm" onClick={() => handleAccept(inv.id)}>
                                        <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => handleDecline(inv.id)}>
                                        <X className="mr-1.5 h-3.5 w-3.5" /> Decline
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
