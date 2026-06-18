import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { clubCategoryBadge } from '@/lib/color-badges';
import type { BreadcrumbItem, ClubMembership, Club } from '@/types';
import { Users, CalendarDays, LogOut, Clock, ChevronRight, XCircle } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}
function capitalise(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── types ────────────────────────────────────────────────────────────────────

type ExtendedClub = Club & { logo_url?: string; active_members_count?: number };
type ActiveMembership = ClubMembership & { club: ExtendedClub };
type PendingMembership = ClubMembership & { club: Club };

interface Props {
    memberships: ActiveMembership[];
    pendingMemberships: PendingMembership[];
}

// ─── role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
    const map: Record<string, string> = {
        leader: 'bg-[#d0b216]/20 text-amber-700 border-amber-300',
        'co-leader': 'bg-blue-100 text-blue-700 border-blue-200',
        member: 'bg-green-100 text-green-700 border-green-200',
    };
    const label: Record<string, string> = {
        leader: '👑 Leader',
        'co-leader': '🔵 Co-Leader',
        member: '✅ Member',
    };
    return (
        <Badge className={`text-xs border ${map[role] ?? 'bg-muted text-muted-foreground'}`}>
            {label[role] ?? capitalise(role)}
        </Badge>
    );
}

// ─── category label ───────────────────────────────────────────────────────────

function CategoryLabel({ category }: { category: string }) {
    return (
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${clubCategoryBadge(category)}`}>
            {capitalise(category)}
        </span>
    );
}

// ─── main ─────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'My Clubs', href: '/student/my-clubs' },
];

export default function MyClubs({ memberships, pendingMemberships }: Props) {

    function handleLeaveClub(clubSlug: string, clubName: string) {
        router.delete(`/clubs/${clubSlug}/leave`);
    }

    function handleCancelRequest(membershipId: number) {
        router.delete(`/club-memberships/${membershipId}`);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Clubs" />

            <div className="p-6 space-y-8 max-w-7xl mx-auto">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">My Clubs</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your club memberships</p>
                </div>

                {/* Active Memberships */}
                {memberships.length > 0 ? (
                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#182b5c]" />
                            Active Memberships
                            <Badge className="bg-[#182b5c] text-white ml-1">{memberships.length}</Badge>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {memberships.map((mem) => {
                                const club = mem.club;
                                return (
                                    <Card key={mem.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        {/* Banner */}
                                        <div className="relative h-20 bg-gradient-to-br from-[#182b5c] to-[#1e3a7a] flex items-end px-4 pb-2">
                                            {club.banner_url && (
                                                <img src={club.banner_url} alt=""
                                                    className="absolute inset-0 w-full h-full object-cover opacity-30" />
                                            )}
                                            <CategoryLabel category={club.category} />
                                        </div>

                                        {/* Logo avatar - overlapping banner */}
                                        <div className="flex justify-center -mt-8 relative z-10">
                                            <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                                                <AvatarImage src={club.logo_url} alt={club.name} />
                                                <AvatarFallback className="bg-[#182b5c] text-white font-bold text-lg">
                                                    {initials(club.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>

                                        <CardContent className="pt-2 pb-4 px-4">
                                            {/* Name + role */}
                                            <div className="text-center mb-3">
                                                <h3 className="font-bold text-base leading-tight">{club.name}</h3>
                                                <div className="flex items-center justify-center gap-2 mt-1.5">
                                                    <RoleBadge role={mem.role} />
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex justify-center gap-4 text-xs text-muted-foreground mb-3">
                                                {club.active_members_count !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {club.active_members_count} members
                                                    </span>
                                                )}
                                                {mem.joined_at && (
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="w-3 h-3" /> Joined {formatDate(mem.joined_at)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-muted-foreground line-clamp-3 mb-4 text-center">
                                                {club.description}
                                            </p>

                                            <Separator className="mb-3" />

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <Link href={`/clubs/${club.slug}`} className="flex-1">
                                                    <Button size="sm"
                                                        className="w-full h-8 text-xs bg-[#182b5c] hover:bg-[#1e3a7a] gap-1">
                                                        View Club <ChevronRight className="w-3 h-3" />
                                                    </Button>
                                                </Link>

                                                {/* Leave Club — requires confirm */}
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="outline"
                                                            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1">
                                                            <LogOut className="w-3 h-3" /> Leave
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Leave {club.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                You will lose your membership and any associated benefits.
                                                                This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleLeaveClub(club.slug, club.name)}
                                                                className="bg-destructive hover:bg-destructive/90">
                                                                Leave Club
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Users className="w-14 h-14 text-muted-foreground/40" />
                        <p className="text-lg font-semibold">You haven't joined any clubs yet</p>
                        <p className="text-sm text-muted-foreground">
                            Explore clubs and find one that matches your interests.
                        </p>
                        <Link href="/clubs">
                            <Button className="bg-[#182b5c] hover:bg-[#1e3a7a] mt-1">Browse Clubs →</Button>
                        </Link>
                    </div>
                )}

                {/* Pending Memberships */}
                {pendingMemberships.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <h2 className="font-semibold text-amber-800 dark:text-amber-300">
                                Pending Approvals
                            </h2>
                            <Badge className="bg-amber-100 text-amber-700 ml-1">
                                {pendingMemberships.length}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingMemberships.map((mem) => (
                                <Card key={mem.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-amber-200">
                                            <AvatarFallback className="bg-amber-100 text-amber-700 font-bold">
                                                {initials(mem.club.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{mem.club.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                                                    ⏳ Pending Approval
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Applied {formatDate(mem.created_at)}
                                            </p>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
                                                    title="Cancel request">
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Cancel membership request?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Your request to join <strong>{mem.club.name}</strong> will be withdrawn.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Keep Request</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleCancelRequest(mem.id)}
                                                        className="bg-destructive hover:bg-destructive/90">
                                                        Cancel Request
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer CTA if has active memberships */}
                {memberships.length > 0 && (
                    <div className="text-center py-4">
                        <Link href="/clubs"
                            className="text-sm text-[#182b5c] underline hover:opacity-80">
                            Browse More Clubs →
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
