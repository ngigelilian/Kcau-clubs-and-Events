import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem, Event, EventRegistration } from '@/types';
import { CalendarDays, MapPin, Users, Clock, DollarSign, Edit, UserPlus, UserMinus, CheckCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    event: Event;
    userRegistration: EventRegistration | null;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
}

export default function EventShow({ event, userRegistration }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; permissions: string[]; roles: string[] } | null } };
    const user = auth.user;
    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super-admin');
    const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState((user as { phone?: string | null } | null)?.phone ?? '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.slug}` },
    ];

    const handleRegister = () => {
        if (event.is_paid) {
            setPhoneDialogOpen(true);
            return;
        }

        router.post(`/events/${event.slug}/register`);
    };

    const handlePaidRegistration = (e: FormEvent) => {
        e.preventDefault();

        router.post(
            `/events/${event.slug}/register`,
            { phone_number: phoneNumber || undefined },
            {
                onSuccess: () => setPhoneDialogOpen(false),
            },
        );
    };
    const handleCancelRegistration = () => {
        if (confirm('Cancel your registration for this event?')) {
            router.delete(`/events/${event.slug}/register`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={event.title} />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Cover Image */}
                {event.cover_url && (
                    <div className="relative aspect-[21/9] overflow-hidden rounded-xl bg-muted">
                        <img src={event.cover_url} alt={event.title} className="h-full w-full object-cover" />
                    </div>
                )}

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={statusBadge(event.status)}>{event.status}</Badge>
                                <Badge variant="outline">{event.type === 'club' ? 'Club Event' : 'School-Wide'}</Badge>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                            {event.club && (
                                <Link href={`/clubs/${event.club.slug}`} className="text-primary hover:underline mt-1 inline-block">
                                    by {event.club.name}
                                </Link>
                            )}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>About this Event</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{event.description}</div>
                            </CardContent>
                        </Card>

                        {/* Registered attendees preview */}
                        {event.registrations && event.registrations.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Registered Attendees ({event.registrations.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {event.registrations.slice(0, 20).map((reg) => (
                                            <div key={reg.id} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={reg.user?.avatar} />
                                                    <AvatarFallback className="text-xs">{reg.user?.name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{reg.user?.name}</span>
                                            </div>
                                        ))}
                                        {event.registrations.length > 20 && (
                                            <span className="flex items-center text-sm text-muted-foreground">+{event.registrations.length - 20} more</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full lg:w-80 space-y-4">
                        {/* Event Details Card */}
                        <Card>
                            <CardContent className="space-y-4 p-5">
                                <div className="flex items-start gap-3">
                                    <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">{formatDate(event.start_datetime)}</p>
                                        <p className="text-sm text-muted-foreground">{formatTime(event.start_datetime)} — {formatTime(event.end_datetime)}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">Venue</p>
                                        <p className="text-sm text-muted-foreground">{event.venue}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <DollarSign className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-medium">{event.is_paid ? event.formatted_fee : 'Free Event'}</p>
                                    </div>
                                </div>
                                {event.capacity && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium">{event.available_spots !== null ? `${event.available_spots} spots left` : 'Unlimited'}</p>
                                                <p className="text-sm text-muted-foreground">of {event.capacity} total capacity</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {event.registration_deadline && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium">Registration Deadline</p>
                                                <p className="text-sm text-muted-foreground">{formatDate(event.registration_deadline)}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        {user && (
                            <Card>
                                <CardContent className="space-y-3 p-5">
                                    {!userRegistration && event.is_registration_open && (
                                        <Button onClick={handleRegister} className="w-full" size="lg">
                                            <UserPlus className="mr-2 h-4 w-4" />{event.is_paid ? 'Pay & Register' : 'Register'}
                                        </Button>
                                    )}
                                    {userRegistration && userRegistration.status === 'registered' && (
                                        <>
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 rounded-lg p-3">
                                                <CheckCircle className="h-5 w-5" />
                                                <span className="font-medium">You're registered!</span>
                                            </div>
                                            <Button onClick={handleCancelRegistration} variant="outline" className="w-full text-destructive">
                                                <UserMinus className="mr-2 h-4 w-4" />Cancel Registration
                                            </Button>
                                        </>
                                    )}
                                    {userRegistration && userRegistration.status === 'attended' && (
                                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                                            <CheckCircle className="h-5 w-5" />
                                            <span className="font-medium">Attended</span>
                                        </div>
                                    )}
                                    {(isAdmin || event.created_by === user.id) && (
                                        <>
                                            <Separator />
                                            <Link href={`/events/${event.slug}/edit`} className="w-full">
                                                <Button variant="outline" className="w-full">
                                                    <Edit className="mr-2 h-4 w-4" />Edit Event
                                                </Button>
                                            </Link>
                                            <Link href={`/events/${event.slug}/attendees`} className="w-full">
                                                <Button variant="outline" className="w-full">
                                                    <Users className="mr-2 h-4 w-4" />Manage Attendees
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Creator */}
                        {event.creator && (
                            <Card>
                                <CardContent className="p-5">
                                    <p className="text-sm text-muted-foreground mb-2">Created by</p>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={event.creator.avatar} />
                                            <AvatarFallback>{event.creator.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{event.creator.name}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Enter M-Pesa Phone Number</DialogTitle>
                                    <DialogDescription>
                                        Use a Safaricom number to receive the STK push for this event payment.
                                    </DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handlePaidRegistration} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="event-phone-number">Phone Number</Label>
                                        <Input
                                            id="event-phone-number"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="2547XXXXXXXX or 07XXXXXXXX"
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setPhoneDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">Send STK Push</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
