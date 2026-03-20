import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Clock, Send, Loader2 } from 'lucide-react';
import type { BreadcrumbItem, Ticket, User } from '@/types';

interface Props {
    ticket: Ticket;
    adminUsers: User[];
    isOverdue: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Tickets', href: '/admin/tickets' },
    { title: `#${0}`, href: '' }, // Will be set dynamically
];

function statusBadge(status: string) {
    const map: Record<string, string> = {
        open: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
}

function priorityBadge(priority: string) {
    const map: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return map[priority] || 'bg-gray-100 text-gray-800';
}

export default function AdminTicketShow({ ticket, adminUsers, isOverdue }: Props) {
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(ticket.assigned_to?.toString() || '');

    breadcrumbs[2].title = `#${ticket.id}`;

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setIsSubmitting(true);
        router.post(
            `/tickets/${ticket.id}/reply`,
            { message: replyMessage },
            {
                onSuccess: () => {
                    setReplyMessage('');
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleAssign = (userId: string) => {
        setSelectedAssignee(userId);
        router.post(`/tickets/${ticket.id}/assign`, { assigned_to: userId || null });
    };

    const handleResolve = () => {
        router.post(`/tickets/${ticket.id}/resolve`);
    };

    const handleClose = () => {
        router.post(`/tickets/${ticket.id}/close`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ticket #${ticket.id}`} />
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header with Status and Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                            {isOverdue && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium dark:bg-orange-900 dark:text-orange-300">
                                    <AlertCircle className="h-3 w-3" />
                                    Overdue (48h+)
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Submitted by {ticket.user?.name} ({ticket.user?.email}) on{' '}
                            {new Date(ticket.created_at).toLocaleDateString()} at{' '}
                            {new Date(ticket.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Badge className={statusBadge(ticket.status)}>
                                {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={priorityBadge(ticket.priority)}>
                                {ticket.priority} Priority
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ticket Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Issue Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                                    {ticket.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Conversation */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Conversation ({ticket.replies?.length ?? 0})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ticket.replies && ticket.replies.length > 0 ? (
                                    <div className="space-y-4">
                                        {ticket.replies.map((reply) => (
                                            <div key={reply.id} className="border-l-4 border-blue-300 pl-4 py-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {reply.user?.avatar && (
                                                            <img
                                                                src={reply.user.avatar}
                                                                alt={reply.user.name}
                                                                className="h-8 w-8 rounded-full"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-sm">{reply.user?.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(reply.created_at).toLocaleDateString()} at{' '}
                                                                {new Date(reply.created_at).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                                    {reply.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No replies yet. Start the conversation below.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reply Form */}
                        {ticket.status !== 'closed' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Reply</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleReply} className="space-y-4">
                                        <Textarea
                                            placeholder="Type your response here..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            disabled={isSubmitting}
                                            className="min-h-32"
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !replyMessage.trim()}
                                            className="gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Send Reply
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Status & Assignment */}
                    <div className="space-y-6">
                        {/* Assignment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Assignment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Assign to</label>
                                    <Select value={selectedAssignee} onValueChange={handleAssign}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select admin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {adminUsers.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {ticket.assignee && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                        {ticket.assignee.avatar && (
                                            <img
                                                src={ticket.assignee.avatar}
                                                alt={ticket.assignee.name}
                                                className="h-6 w-6 rounded-full"
                                            />
                                        )}
                                        <span className="text-sm font-medium">{ticket.assignee.name}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded bg-muted/50">
                                    <span className="text-sm font-medium">Current: {ticket.status.replace('_', ' ')}</span>
                                    <Badge className={statusBadge(ticket.status)}>
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    {['open', 'in_progress'].includes(ticket.status) && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleResolve}
                                        >
                                            Mark as Resolved
                                        </Button>
                                    )}
                                    {ticket.status !== 'closed' && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            onClick={handleClose}
                                        >
                                            Close Ticket
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Meta Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Created</p>
                                    <p className="font-medium">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {ticket.resolved_at && (
                                    <div>
                                        <p className="text-muted-foreground">Resolved</p>
                                        <p className="font-medium">
                                            {new Date(ticket.resolved_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {ticket.closed_at && (
                                    <div>
                                        <p className="text-muted-foreground">Closed</p>
                                        <p className="font-medium">
                                            {new Date(ticket.closed_at).toLocaleDateString()}
                                        </p>
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
