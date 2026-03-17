import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { BreadcrumbItem, Event, EventType as EventTypeValue } from '@/types';
import { type FormEvent } from 'react';

interface Club { id: number; name: string; }
interface EventTypeOption { value: string; label: string; }
interface Props {
    event: Event;
    clubs: Club[];
    eventTypes: EventTypeOption[];
    canCreateSchoolEvents: boolean;
}

export default function EventEdit({ event, clubs, eventTypes, canCreateSchoolEvents }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Events', href: '/events' },
        { title: event.title, href: `/events/${event.slug}` },
        { title: 'Edit', href: `/events/${event.slug}/edit` },
    ];

    const formatDateForInput = (date: string) => {
        if (!date) return '';
        return new Date(date).toISOString().slice(0, 16);
    };

    const { data, setData, post, transform, processing, errors } = useForm({
        _method: 'PUT' as const,
        title: event.title,
        description: event.description,
        club_id: event.club_id ?? ('' as string | number),
        type: event.type,
        venue: event.venue,
        start_datetime: formatDateForInput(event.start_datetime),
        end_datetime: formatDateForInput(event.end_datetime),
        capacity: event.capacity ?? ('' as string | number),
        registration_deadline: event.registration_deadline ? formatDateForInput(event.registration_deadline) : '',
        is_paid: event.is_paid,
        fee_amount: event.fee_amount || ('' as string | number),
        cover: null as File | null,
        submit_for_approval: false,
    });

    const handleSubmit = (e: FormEvent, submitForApproval = false) => {
        e.preventDefault();
        setData('submit_for_approval', submitForApproval);
        post(`/events/${event.slug}`, { forceFormData: true });
    };

    const saveDraft = () => {
        transform((current) => ({ ...current, submit_for_approval: false }));
        post(`/events/${event.slug}`, { forceFormData: true });
    };

    const submitForApproval = () => {
        transform((current) => ({ ...current, submit_for_approval: true }));
        post(`/events/${event.slug}`, { forceFormData: true });
    };

    const handleTypeChange = (value: string) => {
        setData('type', value as EventTypeValue);
        if (value === 'school') {
            setData('club_id', '');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${event.title}`} />
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
                    <p className="text-muted-foreground">Update your event details</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} />
                                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea id="description" value={data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)} rows={6} />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Event Type *</Label>
                                    <Select value={data.type} onValueChange={handleTypeChange}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {eventTypes
                                                .filter((t) => canCreateSchoolEvents || t.value !== 'school')
                                                .map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {data.type === 'club' && (
                                    <div className="space-y-2">
                                        <Label>Club</Label>
                                        <Select value={String(data.club_id)} onValueChange={(v) => setData('club_id', Number(v))}>
                                            <SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger>
                                            <SelectContent>
                                                {clubs.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="venue">Venue *</Label>
                                <Input id="venue" value={data.venue} onChange={(e) => setData('venue', e.target.value)} />
                                {errors.venue && <p className="text-sm text-destructive">{errors.venue}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cover">Cover Image</Label>
                                {(event as any).cover_url && <img src={(event as any).cover_url} alt="Current cover" className="h-32 w-full rounded-lg object-cover" />}
                                <Input id="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setData('cover', e.target.files?.[0] || null)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Date & Time</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Start *</Label>
                                    <Input type="datetime-local" value={data.start_datetime} onChange={(e) => setData('start_datetime', e.target.value)} />
                                    {errors.start_datetime && <p className="text-sm text-destructive">{errors.start_datetime}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>End *</Label>
                                    <Input type="datetime-local" value={data.end_datetime} onChange={(e) => setData('end_datetime', e.target.value)} />
                                    {errors.end_datetime && <p className="text-sm text-destructive">{errors.end_datetime}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Registration Deadline</Label>
                                    <Input type="datetime-local" value={data.registration_deadline} onChange={(e) => setData('registration_deadline', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Capacity</Label>
                                    <Input type="number" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} placeholder="Unlimited" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Paid event</Label>
                                <Switch checked={data.is_paid} onCheckedChange={(checked: boolean) => setData('is_paid', checked)} />
                            </div>
                            {data.is_paid && (
                                <div className="space-y-2">
                                    <Label>Fee (cents)</Label>
                                    <Input type="number" value={data.fee_amount} onChange={(e) => setData('fee_amount', e.target.value)} />
                                    {errors.fee_amount && <p className="text-sm text-destructive">{errors.fee_amount}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="button" variant="secondary" disabled={processing} onClick={saveDraft}>
                            {processing ? 'Saving...' : 'Save as Draft'}
                        </Button>
                        <Button type="button" disabled={processing} onClick={submitForApproval}>
                            {processing ? 'Submitting...' : 'Submit for Approval'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
