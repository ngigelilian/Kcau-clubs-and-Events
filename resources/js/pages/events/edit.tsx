import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SingleImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Event, EventType as EventTypeValue } from '@/types';

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

    const { data, setData, post, processing, errors } = useForm<{
        _method: 'PUT';
        title: string;
        description: string;
        club_id: string | number;
        type: string;
        venue: string;
        start_datetime: string;
        end_datetime: string;
        capacity: string | number;
        registration_deadline: string;
        is_paid: boolean;
        fee_amount: string | number;
        cover: File | null;
        submit_for_approval: boolean;
    }>({
        _method: 'PUT',
        title: event.title,
        description: event.description,
        club_id: event.club_id ?? '',
        type: event.type,
        venue: event.venue,
        start_datetime: formatDateForInput(event.start_datetime),
        end_datetime: formatDateForInput(event.end_datetime),
        capacity: event.capacity ?? '',
        registration_deadline: event.registration_deadline ? formatDateForInput(event.registration_deadline) : '',
        is_paid: event.is_paid,
        fee_amount: event.fee_amount ?? '',
        cover: null,
        submit_for_approval: false,
    });

    // ── Fix race condition: set flag then post on next tick ───────────────────
    const handleSaveDraft = () => {
        setData('submit_for_approval', false);
        setTimeout(() => post(`/events/${event.slug}`, { forceFormData: true }), 0);
    };

    const handleSubmitForApproval = () => {
        setData('submit_for_approval', true);
        setTimeout(() => post(`/events/${event.slug}`, { forceFormData: true }), 0);
    };

    const handleTypeChange = (value: string) => {
        setData('type', value as EventTypeValue);
        if (value === 'school') setData('club_id', '');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit — ${event.title}`} />
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
                    <p className="text-muted-foreground">Update your event details</p>
                </div>

                <div className="space-y-6">
                    {/* ── Event Details ─────────────────────────────────── */}
                    <Card>
                        <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                />
                                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                    rows={6}
                                />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Event Type *</Label>
                                    <Select value={data.type} onValueChange={handleTypeChange}>
                                        <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {eventTypes
                                                .filter((t) => canCreateSchoolEvents || t.value !== 'school')
                                                .map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                {data.type === 'club' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="club_id">Club</Label>
                                        <Select value={String(data.club_id)} onValueChange={(v) => setData('club_id', Number(v))}>
                                            <SelectTrigger id="club_id"><SelectValue placeholder="Select club" /></SelectTrigger>
                                            <SelectContent>
                                                {clubs.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.club_id && <p className="text-sm text-destructive">{errors.club_id}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="venue">Venue *</Label>
                                <Input
                                    id="venue"
                                    value={data.venue}
                                    onChange={(e) => setData('venue', e.target.value)}
                                />
                                {errors.venue && <p className="text-sm text-destructive">{errors.venue}</p>}
                            </div>

                            {/* Cover Image with existing preview */}
                            <SingleImageUpload
                                id="cover"
                                label="Cover Image"
                                hint="Upload a new image to replace the current one · JPEG, PNG, WebP · max 5 MB"
                                currentUrl={event.cover_url ?? undefined}
                                onChange={(file) => setData('cover', file)}
                                error={errors.cover}
                            />
                        </CardContent>
                    </Card>

                    {/* ── Date & Time ───────────────────────────────────── */}
                    <Card>
                        <CardHeader><CardTitle>Date & Time</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_datetime">Start *</Label>
                                    <Input
                                        id="start_datetime"
                                        type="datetime-local"
                                        value={data.start_datetime}
                                        onChange={(e) => setData('start_datetime', e.target.value)}
                                    />
                                    {errors.start_datetime && <p className="text-sm text-destructive">{errors.start_datetime}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_datetime">End *</Label>
                                    <Input
                                        id="end_datetime"
                                        type="datetime-local"
                                        value={data.end_datetime}
                                        onChange={(e) => setData('end_datetime', e.target.value)}
                                    />
                                    {errors.end_datetime && <p className="text-sm text-destructive">{errors.end_datetime}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="registration_deadline">Registration Deadline</Label>
                                    <Input
                                        id="registration_deadline"
                                        type="datetime-local"
                                        value={data.registration_deadline}
                                        onChange={(e) => setData('registration_deadline', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', e.target.value)}
                                        placeholder="Unlimited"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Pricing ───────────────────────────────────────── */}
                    <Card>
                        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_paid">Paid event</Label>
                                <Switch
                                    id="is_paid"
                                    checked={data.is_paid}
                                    onCheckedChange={(checked: boolean) => setData('is_paid', checked)}
                                />
                            </div>
                            {data.is_paid && (
                                <div className="space-y-2">
                                    <Label htmlFor="fee_amount">Fee Amount (KES) *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>
                                        <Input
                                            id="fee_amount"
                                            type="number"
                                            className="pl-12"
                                            value={data.fee_amount === '' ? '' : Number(data.fee_amount) / 100}
                                            onChange={(e) => setData('fee_amount', Math.round(parseFloat(e.target.value || '0') * 100))}
                                            placeholder="e.g. 500"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Enter the fee in Kenya Shillings.</p>
                                    {errors.fee_amount && <p className="text-sm text-destructive">{errors.fee_amount}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Actions ───────────────────────────────────────── */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="button" variant="secondary" disabled={processing} onClick={handleSaveDraft}>
                            {processing ? 'Saving…' : 'Save as Draft'}
                        </Button>
                        <Button type="button" disabled={processing} onClick={handleSubmitForApproval}>
                            {processing ? 'Submitting…' : 'Submit for Approval'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
