import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem, Club, ClubMembership, Event } from '@/types';
import {
    Calendar,
    Crown,
    LogOut,
    Pencil,
    ShieldCheck,
    UserPlus,
    Users,
    Clock,
    MapPin,
    Package,
} from 'lucide-react';
import { index, edit, join, leave, members } from '@/routes/clubs';
import type { User as AuthUser } from '@/types/auth';

interface Props {
    club: Club & { events?: Event[] };
    leaders: ClubMembership[];
    userMembership: ClubMembership | null;
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    pending: { label: 'Pending Approval', variant: 'secondary' },
    suspended: { label: 'Suspended', variant: 'destructive' },
};

const categoryLabel = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1);
const membershipTypeLabel: Record<'free' | 'subscription' | 'hybrid', string> = {
    free: 'Free to Join',
    subscription: 'Subscription',
    hybrid: 'Hybrid',
};

export default function ClubShow({ club, leaders, userMembership }: Props) {
    const { auth } = usePage().props as { auth: { user: AuthUser | null } };
    const user = auth.user;
    const status = statusBadge[club.status] ?? statusBadge.pending;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Clubs', href: index.url() },
        { title: club.name, href: '#' },
    ];

    const canEdit = user && (
        user.permissions.includes('manage-clubs') ||
        leaders.some((l) => l.user_id === user.id)
    );

    const canManageMembers = user && (
        user.permissions.includes('manage-clubs') ||
        leaders.some((l) => l.user_id === user.id)
    );

    const handleJoin = () => router.post(join.url(club.slug));
    const handleLeave = () => {
        if (confirm('Are you sure you want to leave this club?')) {
            router.delete(leave.url(club.slug));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={club.name} />

            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Banner */}
                <div className="relative overflow-hidden rounded-xl">
                    {club.banner_url ? (
                        <img
                            src={club.banner_url}
                            alt={`${club.name} banner`}
                            className="h-48 w-full object-cover sm:h-64"
                        />
                    ) : (
                        // ✅ Was: bg-gradient-to-br from-[#182b5c] to-[#2a4a8c]
                        // Now uses primary token (maps to #0B3D91 deep blue)
                        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary to-primary/70 sm:h-64">
                            <span className="text-6xl font-bold text-primary-foreground/30">{club.name.charAt(0)}</span>
                        </div>
                    )}
                </div>

                {/* Club Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        {club.logo_url ? (
                            <img
                                src={club.logo_url}
                                alt={club.name}
                                className="-mt-10 h-20 w-20 rounded-xl border-4 border-background object-cover shadow-md sm:-mt-14 sm:h-24 sm:w-24"
                            />
                        ) : (
                            <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-xl border-4 border-background bg-muted text-2xl font-bold sm:-mt-14 sm:h-24 sm:w-24">
                                {club.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{club.name}</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge variant={status.variant}>{status.label}</Badge>
                                <Badge variant="outline">{categoryLabel(club.category)}</Badge>
                                <Badge variant="outline">{membershipTypeLabel[club.membership_type]}</Badge>
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    {club.active_members_count ?? 0} members
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {canEdit && (
                            <Link href={edit.url(club.slug)}>
                                <Button variant="outline" size="sm">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {canManageMembers && (
                            <Link href={members.url(club.slug)}>
                                <Button variant="outline" size="sm">
                                    <Users className="mr-2 h-4 w-4" />
                                    Members
                                </Button>
                            </Link>
                        )}
                        {user && !userMembership && club.status === 'active' && (
                            <div className="space-y-2">
                                <Button onClick={handleJoin}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Join Club
                                </Button>
                                {club.membership_type !== 'free' && (
                                    <p className="text-xs text-muted-foreground">
                                        {club.membership_type === 'subscription'
                                            ? `Subscription fee applies: KES ${((club.membership_fee ?? 0) / 100).toFixed(2)}`
                                            : `Hybrid club: ${club.hybrid_free_faculty ?? 'specified faculty'} joins free; others pay KES ${((club.membership_fee ?? 0) / 100).toFixed(2)}`}
                                    </p>
                                )}
                            </div>
                        )}
                        {userMembership?.status === 'pending' && (
                            <Button variant="outline" disabled>
                                <Clock className="mr-2 h-4 w-4" />
                                Pending Approval
                            </Button>
                        )}
                        {userMembership?.status === 'active' && userMembership?.role !== 'leader' && (
                            <Button variant="outline" size="sm" onClick={handleLeave}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* About */}
                        <Card>
                            <CardHeader>
                                <CardTitle>About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-muted-foreground">{club.description}</p>
                            </CardContent>
                        </Card>

                        {/* Upcoming Events */}
                        {club.events && club.events.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Upcoming Events
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {club.events.map((event) => (
                                        <div key={event.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="font-medium">{event.title}</p>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(event.start_datetime).toLocaleDateString('en-KE', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3.5 w-3.5" />
                                                        {event.venue}
                                                    </span>
                                                </div>
                                            </div>
                                            {event.is_paid && (
                                                <Badge variant="secondary">
                                                    KES {(event.fee_amount / 100).toFixed(2)}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {club.merchandise && club.merchandise.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Club Merchandise
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {club.merchandise.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/merchandise/${item.id}`}
                                                className="overflow-hidden rounded-lg border transition hover:border-primary/40 hover:bg-muted/30"
                                            >
                                                {item.image_urls?.[0] ? (
                                                    <img src={item.image_urls[0]} alt={item.name} className="h-28 w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-28 items-center justify-center bg-muted text-muted-foreground">
                                                        No image
                                                    </div>
                                                )}
                                                <div className="space-y-1 p-3">
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="font-semibold">{item.formatted_price ?? `KES ${(item.price / 100).toFixed(2)}`}</span>
                                                        <Badge variant={item.is_in_stock ? 'outline' : 'destructive'}>
                                                            {item.is_in_stock ? 'In stock' : 'Out of stock'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Leaders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {/* ✅ Was: text-[#d0b216] — now uses accent token (maps to #F2A900 gold) */}
                                    <Crown className="h-5 w-5 text-accent" />
                                    Leadership
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {leaders.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={m.user?.avatar ?? undefined} />
                                            <AvatarFallback>{m.user?.name?.charAt(0) ?? '?'}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{m.user?.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {m.role === 'leader' ? 'Leader' : 'Co-Leader'}
                                            </p>
                                        </div>
                                        {/* ✅ Was: text-[#d0b216] — now uses accent token */}
                                        {m.role === 'leader' ? (
                                            <ShieldCheck className="h-4 w-4 text-accent" />
                                        ) : null}
                                    </div>
                                ))}
                                {leaders.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No leaders assigned yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Club Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Category</span>
                                    <span className="font-medium">{categoryLabel(club.category)}</span>
                                </div>
                                {club.max_members && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Max Members</span>
                                        <span className="font-medium">{club.max_members}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Membership</span>
                                    <span className="font-medium">{membershipTypeLabel[club.membership_type]}</span>
                                </div>
                                {club.membership_type !== 'free' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subscription Fee</span>
                                        <span className="font-medium">KES {((club.membership_fee ?? 0) / 100).toFixed(2)}</span>
                                    </div>
                                )}
                                {club.membership_discount_percent !== null && club.membership_discount_percent > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="font-medium">{club.membership_discount_percent}%</span>
                                    </div>
                                )}
                                {club.membership_type === 'hybrid' && club.hybrid_free_faculty && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Hybrid Free Faculty</span>
                                        <span className="font-medium">{club.hybrid_free_faculty}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Founded</span>
                                    <span className="font-medium">
                                        {new Date(club.created_at).toLocaleDateString('en-KE', {
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                {club.creator && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Founded by</span>
                                        <span className="font-medium">{club.creator.name}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}