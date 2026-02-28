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
interface Props {
    clubs: Club[];
    audiences: { value: string; label: string; }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Announcements', href: '/announcements' },
    { title: 'New', href: '/announcements/create' },
];

export default function AnnouncementCreate({ clubs, audiences }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content: '',
        club_id: '' as string | number,
        audience: 'club_members',
        is_published: true,
        send_email: false,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/announcements');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Announcement" />
            <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Announcement</h1>
                    <p className="text-muted-foreground">Publish an announcement to your audience</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Announcement Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Announcement title" />
                                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Content *</Label>
                                <Textarea id="content" value={data.content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('content', e.target.value)} rows={6} placeholder="Write your announcement..." />
                                {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Club</Label>
                                    <Select value={String(data.club_id)} onValueChange={(v) => setData('club_id', Number(v))}>
                                        <SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger>
                                        <SelectContent>
                                            {clubs.map((c: Club) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    {errors.club_id && <p className="text-sm text-destructive">{errors.club_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Audience *</Label>
                                    <Select value={data.audience} onValueChange={(v) => setData('audience', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {audiences.map((a: { value: string; label: string }) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Publishing Options</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_published">Publish immediately</Label>
                                <Switch id="is_published" checked={data.is_published} onCheckedChange={(c: boolean) => setData('is_published', c)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="send_email">Send email notification</Label>
                                <Switch id="send_email" checked={data.send_email} onCheckedChange={(c: boolean) => setData('send_email', c)} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Publishing...' : 'Publish Announcement'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
