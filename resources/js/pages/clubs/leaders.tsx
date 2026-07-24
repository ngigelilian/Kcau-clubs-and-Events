import { Head, router } from '@inertiajs/react';
import { Crown, Search, Send, ShieldOff, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index, show } from '@/routes/clubs';
import type { BreadcrumbItem, Club, ClubLeaderInvitation, ClubMembership } from '@/types';

interface StudentResult {
    id: number;
    name: string;
    email: string;
    student_id: string | null;
}

interface Props {
    club: Club;
    leaders: ClubMembership[];
    pendingInvitations: ClubLeaderInvitation[];
    positions: { value: string; label: string }[];
}

const roleBadgeClass: Record<string, string> = {
    chairperson: 'bg-[#d0b216]/20 text-amber-700 border-amber-300',
    secretary: 'bg-blue-100 text-blue-700 border-blue-200',
    treasurer: 'bg-purple-100 text-purple-700 border-purple-200',
    co_chair: 'bg-blue-100 text-blue-700 border-blue-200',
};

const roleLabel: Record<string, string> = {
    chairperson: 'Chairperson',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    co_chair: 'Co-Chair',
};

export default function ClubLeaders({ club, leaders, pendingInvitations, positions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clubs', href: index.url() },
        { title: club.name, href: show.url(club.slug) },
        { title: 'Leadership Team', href: '#' },
    ];

    const baseUrl = `/clubs/${club.slug}/leaders`;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StudentResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
    const [position, setPosition] = useState<string>(positions[0]?.value ?? '');
    const [sending, setSending] = useState(false);

    const handleSearch = async (value: string) => {
        setQuery(value);
        setSelectedStudent(null);

        if (value.trim().length < 2) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`${baseUrl}/search-students?q=${encodeURIComponent(value)}`, {
                headers: { Accept: 'application/json' },
            });
            const json = await res.json();
            setResults(json.data ?? []);
        } finally {
            setSearching(false);
        }
    };

    const handleInvite = () => {
        if (!selectedStudent || !position) return;
        setSending(true);
        router.post(
            `${baseUrl}/invite`,
            { invitee_id: selectedStudent.id, position },
            {
                onFinish: () => setSending(false),
                onSuccess: () => {
                    setSelectedStudent(null);
                    setQuery('');
                    setResults([]);
                },
            }
        );
    };

    const handleRevoke = (invitationId: number) => {
        if (confirm('Revoke this pending invitation?')) {
            router.delete(`${baseUrl}/invitations/${invitationId}`);
        }
    };

    const handleRemoveLeader = (membershipId: number) => {
        if (confirm('Remove this leader from their position? They will become a plain Member.')) {
            router.delete(`${baseUrl}/${membershipId}`);
        }
    };

    const handleTransferChair = (membershipId: number, name?: string) => {
        if (confirm(`Transfer chairpersonship to ${name ?? 'this leader'}? You will become Co-Chair.`)) {
            router.post(`${baseUrl}/${membershipId}/transfer-chair`);
        }
    };

    const handleDisband = () => {
        const typed = prompt(
            `This permanently disbands "${club.name}". This cannot be undone from here. Type the club name to confirm:`
        );
        if (typed === club.name) {
            router.delete(`/clubs/${club.slug}/disband`);
        } else if (typed !== null) {
            alert('Club name did not match — disband cancelled.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${club.name} — Leadership Team`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{club.name} — Leadership Team</h1>
                    <p className="text-muted-foreground">
                        Invite new leaders, manage positions, and transfer chairpersonship. Only you, as Chairperson,
                        can do this.
                    </p>
                </div>

                {/* Invite form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" /> Invite a Leader
                        </CardTitle>
                        <CardDescription>
                            Search for an existing student. They&apos;ll need to accept before the position takes effect.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or student ID…"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-9"
                            />
                            {selectedStudent && (
                                <button
                                    type="button"
                                    onClick={() => { setSelectedStudent(null); setQuery(''); setResults([]); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {!selectedStudent && results.length > 0 && (
                            <div className="rounded-lg border divide-y">
                                {results.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => { setSelectedStudent(s); setResults([]); setQuery(s.name); }}
                                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{s.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {s.email}{s.student_id ? ` · ${s.student_id}` : ''}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {!selectedStudent && !searching && query.trim().length >= 2 && results.length === 0 && (
                            <p className="text-sm text-muted-foreground">No matching students found.</p>
                        )}

                        {selectedStudent && (
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">{selectedStudent.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {selectedStudent.name}
                                </div>
                                <Select value={position} onValueChange={setPosition}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {positions.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleInvite} disabled={sending}>
                                    <Send className="mr-1.5 h-4 w-4" />
                                    {sending ? 'Sending…' : 'Send Invite'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending invitations */}
                {pendingInvitations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Pending Invitations
                                <Badge variant="secondary">{pendingInvitations.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pendingInvitations.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="text-sm font-medium">{inv.invitee?.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Invited as {roleLabel[inv.position] ?? inv.position}
                                            {inv.expires_at && ` · expires ${new Date(inv.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRevoke(inv.id)}>
                                        <X className="mr-1 h-3.5 w-3.5" /> Revoke
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Current leadership team */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Leadership Team</CardTitle>
                        <CardDescription>
                            Removing a leader demotes them to a plain Member. The Chairperson position can only be
                            handed over via Transfer — never removed directly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {leaders.map((m) => (
                            <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={m.user?.avatar ?? undefined} />
                                        <AvatarFallback>{m.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{m.user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                                    </div>
                                    <Badge className={`ml-2 border ${roleBadgeClass[m.role] ?? ''}`}>
                                        {m.role === 'chairperson' && <Crown className="mr-1 h-3 w-3" />}
                                        {roleLabel[m.role] ?? m.role}
                                    </Badge>
                                </div>
                                {m.role !== 'chairperson' && (
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleTransferChair(m.id, m.user?.name)}
                                        >
                                            <Crown className="mr-1.5 h-3.5 w-3.5" /> Make Chairperson
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive"
                                            title="Remove from position"
                                            onClick={() => handleRemoveLeader(m.id)}
                                        >
                                            <ShieldOff className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {leaders.length === 0 && (
                            <p className="py-4 text-center text-sm text-muted-foreground">No leaders yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Danger zone */}
                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                            Disbanding permanently closes this club — it will disappear from all listings immediately.
                            This cannot be undone from the app.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={handleDisband}>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Disband Club
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
