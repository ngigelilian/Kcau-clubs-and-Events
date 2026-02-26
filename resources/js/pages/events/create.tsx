import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { BreadcrumbItem } from '@/types';
import { type FormEvent } from 'react';

interface Club { id: number; name: string; }
interface EventType { value: string; label: string; }
interface Props {
    clubs: Club[];
    eventTypes: EventType[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Events', href: '/events' },
    { title: 'Create Event', href: '/events/create' },
];

export default function EventCreate({ clubs, eventTypes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        club_id: '' as string | number,
        type: 'club' as string,
        venue: '',
        start_datetime: '',
        end_datetime: '',
        capacity: '' as string | number,
        registration_deadline: '',
        is_paid: false,
        fee_amount: '' as string | number,
        cover: null as File | null,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/events', { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Event" />
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
                    <p className="text-muted-foreground">Fill in the details to create a new campus event</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Details</CardTitle>
                            <CardDescription>Basic information about your event</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Annual Hackathon 2025" />
                                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea id="description" value={data.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)} rows={6} placeholder="Describe the event in detail..." />
                                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Event Type *</Label>
                                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {eventTypes.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                {data.type === 'club' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="club">Club *</Label>
                                        <Select value={String(data.club_id)} onValueChange={(v) => setData('club_id', Number(v))}>
                                            <SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger>
                                            <SelectContent>
                                                {clubs.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        {errors.club_id && <p className="text-sm text-destructive">{errors.club_id}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="venue">Venue *</Label>
                                <Input id="venue" value={data.venue} onChange={(e) => setData('venue', e.target.value)} placeholder="e.g. Main Hall" />
                                {errors.venue && <p className="text-sm text-destructive">{errors.venue}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cover">Cover Image</Label>
                                <Input id="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setData('cover', e.target.files?.[0] || null)} />
                                {errors.cover && <p className="text-sm text-destructive">{errors.cover}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Date & Time</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="start_datetime">Start Date & Time *</Label>
                                    <Input id="start_datetime" type="datetime-local" value={data.start_datetime} onChange={(e) => setData('start_datetime', e.target.value)} />
                                    {errors.start_datetime && <p className="text-sm text-destructive">{errors.start_datetime}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_datetime">End Date & Time *</Label>
                                    <Input id="end_datetime" type="datetime-local" value={data.end_datetime} onChange={(e) => setData('end_datetime', e.target.value)} />
                                    {errors.end_datetime && <p className="text-sm text-destructive">{errors.end_datetime}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="registration_deadline">Registration Deadline</Label>
                                    <Input id="registration_deadline" type="datetime-local" value={data.registration_deadline} onChange={(e) => setData('registration_deadline', e.target.value)} />
                                    {errors.registration_deadline && <p className="text-sm text-destructive">{errors.registration_deadline}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input id="capacity" type="number" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} placeholder="Leave empty for unlimited" />
                                    {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_paid">This is a paid event</Label>
                                <Switch id="is_paid" checked={data.is_paid} onCheckedChange={(checked) => setData('is_paid', checked)} />
                            </div>
                            {data.is_paid && (
                                <div className="space-y-2">
                                    <Label htmlFor="fee_amount">Fee Amount (in cents, e.g. 50000 = KES 500)</Label>
                                    <Input id="fee_amount" type="number" value={data.fee_amount} onChange={(e) => setData('fee_amount', e.target.value)} placeholder="e.g. 50000" />
                                    {errors.fee_amount && <p className="text-sm text-destructive">{errors.fee_amount}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Event'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
