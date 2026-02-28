import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { type FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Support Tickets', href: '/tickets' },
    { title: 'New Ticket', href: '/tickets/create' },
];

export default function TicketCreate() {
    const { data, setData, post, processing, errors } = useForm({
        subject: '',
        message: '',
        priority: 'medium',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/tickets');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Support Ticket" />
            <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Support Ticket</h1>
                    <p className="text-muted-foreground">Describe the issue you need help with</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Details</CardTitle>
                            <CardDescription>Provide as much detail as possible</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input id="subject" value={data.subject} onChange={(e) => setData('subject', e.target.value)} placeholder="Briefly describe the issue" />
                                {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message *</Label>
                                <Textarea id="message" value={data.message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('message', e.target.value)} rows={8} placeholder="Explain the issue in detail..." />
                                {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button type="submit" disabled={processing}>{processing ? 'Submitting...' : 'Submit Ticket'}</Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
