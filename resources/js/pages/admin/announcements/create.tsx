import { Head, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem, Club } from '@/types';

interface Props {
    clubs: Pick<Club, 'id' | 'name'>[];
    audiences: { value: string; label: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '#' },
    { title: 'Announcements', href: '/admin/announcements' },
    { title: 'Create', href: '#' },
];

export default function AdminAnnouncementCreate({ clubs, audiences }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        body: '',
        club_id: '' as string | number,
        audience: 'all_students',
        is_email: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/announcements');
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="New Announcement" />
            <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader><CardTitle>Create Announcement</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="space-y-1">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Announcement title" />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="body">Body</Label>
                                <Textarea id="body" rows={6} value={data.body} onChange={(e) => setData('body', e.target.value)} placeholder="Write your announcement…" />
                                <InputError message={errors.body} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>Club (optional)</Label>
                                    <Select value={data.club_id as string} onValueChange={(v) => setData('club_id', v === 'system' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="System-wide" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="system">System-wide</SelectItem>
                                            {clubs.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.club_id} />
                                </div>

                                <div className="space-y-1">
                                    <Label>Audience</Label>
                                    <Select value={data.audience} onValueChange={(v) => setData('audience', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {audiences.map((a) => (<SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.audience} />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_email" checked={data.is_email} onChange={(e) => setData('is_email', e.target.checked)} className="rounded" />
                                <Label htmlFor="is_email">Also send as email</Label>
                            </div>

                            <div className="flex justify-end gap-3">
                                <a href="/admin/announcements"><Button type="button" variant="outline">Cancel</Button></a>
                                <Button type="submit" disabled={processing}>
                                    <Send className="mr-2 h-4 w-4" />Publish
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
