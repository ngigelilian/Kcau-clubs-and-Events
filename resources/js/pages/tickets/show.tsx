import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem, Ticket, TicketReply } from '@/types';
import { Send, CheckCircle, Lock, UserCheck } from 'lucide-react';
import { type FormEvent } from 'react';

interface AdminUser { id: number; name: string; }
interface Props {
    ticket: Ticket & { replies: TicketReply[] };
    adminUsers: AdminUser[];
}

function statusBadge(status: string) {
    const map: Record<string, string> = {
        open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
}

function priorityBadge(priority: string) {
    const map: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700',
        medium: 'bg-blue-100 text-blue-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800',
    };
    return map[priority] || '';
}

export default function TicketShow({ ticket, adminUsers }: Props) {
    const { auth } = usePage().props as { auth: { user: { id: number; roles: string[] } } };
    const isAdmin = auth.user.roles?.includes('admin') || auth.user.roles?.includes('super-admin');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Support Tickets', href: '/tickets' },
        { title: ticket.subject, href: `/tickets/${ticket.id}` },
    ];

    const { data, setData, post, processing, reset } = useForm({ message: '' });

    const handleReply = (e: FormEvent) => {
        e.preventDefault();
        post(`/tickets/${ticket.id}/reply`, { onSuccess: () => reset() });
    };

    const handleAssign = (userId: string) => {
        router.post(`/tickets/${ticket.id}/assign`, { assigned_to: Number(userId) });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={ticket.subject} />
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Ticket Header */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={statusBadge(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                                    <Badge className={priorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                                    <span className="text-sm text-muted-foreground">
                                        Opened {new Date(ticket.created_at).toLocaleDateString()} by {ticket.user?.name}
                                    </span>
                                </div>
                                {ticket.assigned_to_user && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <UserCheck className="h-4 w-4" />
                                        Assigned to {ticket.assigned_to_user.name}
                                    </div>
                                )}
                            </div>

                            {/* Admin Actions */}
                            {isAdmin && (
                                <div className="flex flex-wrap gap-2">
                                    {adminUsers.length > 0 && ticket.status !== 'closed' && (
                                        <Select onValueChange={handleAssign} value={ticket.assigned_to ? String(ticket.assigned_to) : undefined}>
                                            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                                            <SelectContent>
                                                {adminUsers.map((u) => (<SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                                        <Button size="sm" variant="outline" onClick={() => router.post(`/tickets/${ticket.id}/resolve`)}>
                                            <CheckCircle className="mr-1 h-4 w-4" />Resolve
                                        </Button>
                                    )}
                                    {ticket.status !== 'closed' && (
                                        <Button size="sm" variant="outline" onClick={() => router.post(`/tickets/${ticket.id}/close`)}>
                                            <Lock className="mr-1 h-4 w-4" />Close
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Original Message */}
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={ticket.user?.avatar} />
                                <AvatarFallback>{ticket.user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{ticket.user?.name}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</span>
                                </div>
                                <div className="mt-2 whitespace-pre-wrap text-sm">{ticket.message}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Replies */}
                {ticket.replies && ticket.replies.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold">Replies</h2>
                        {ticket.replies.map((reply) => (
                            <Card key={reply.id} className={reply.is_admin_reply ? 'border-primary/20 bg-primary/5' : ''}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={reply.user?.avatar} />
                                            <AvatarFallback>{reply.user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{reply.user?.name}</span>
                                                {reply.is_admin_reply && <Badge variant="outline" className="text-xs">Staff</Badge>}
                                                <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="mt-2 whitespace-pre-wrap text-sm">{reply.message}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Reply Form */}
                {ticket.status !== 'closed' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Reply</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleReply} className="space-y-3">
                                <Textarea value={data.message} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('message', e.target.value)} rows={4} placeholder="Type your reply..." />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing || !data.message.trim()}>
                                        <Send className="mr-2 h-4 w-4" />{processing ? 'Sending...' : 'Send Reply'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
