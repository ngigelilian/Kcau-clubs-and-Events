import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem, Ticket, PaginatedResponse } from '@/types';
import { Plus, LifeBuoy, MessageCircle } from 'lucide-react';
import { ticketPriorityBadge, ticketStatusBadge } from '@/lib/color-badges';

interface Filters { status: string; priority: string; }
interface Props {
    tickets: PaginatedResponse<Ticket>;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Support Tickets', href: '/tickets' }];

export default function TicketIndex({ tickets, filters }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support Tickets" />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
                        <p className="text-muted-foreground">Get help with any issues</p>
                    </div>
                    <Link href="/tickets/create">
                        <Button><Plus className="mr-2 h-4 w-4" />New Ticket</Button>
                    </Link>
                </div>

                {tickets.data.length > 0 ? (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Replies</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.data.map((ticket) => (
                                        <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.visit(`/tickets/${ticket.id}`)}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{ticket.subject}</p>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{ticket.message}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={ticketStatusBadge(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={ticketPriorityBadge(ticket.priority)}>{ticket.priority}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MessageCircle className="h-4 w-4" />
                                                    {ticket.replies_count ?? 0}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                        <LifeBuoy className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No tickets yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">Create a ticket if you need help.</p>
                    </div>
                )}
                <DataPagination data={tickets} />
            </div>
        </AppLayout>
    );
}
