import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import DataPagination from '@/components/shared/data-pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem, Announcement, PaginatedResponse } from '@/types';
import { Bell, Plus, Megaphone } from 'lucide-react';

interface Props {
    announcements: PaginatedResponse<Announcement>;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Announcements', href: '/announcements' }];

function audienceBadge(audience: string) {
    const map: Record<string, string> = {
        all_students: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        club_members: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        leaders_only: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return map[audience] || 'bg-gray-100 text-gray-800';
}

export default function AnnouncementIndex({ announcements }: Props) {
    const { auth } = usePage().props as { auth: { user: { permissions: string[] } | null } };
    const canCreate = auth.user?.permissions?.includes('announcement.create');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcements" />
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
                        <p className="text-muted-foreground">Stay updated with the latest news</p>
                    </div>
                    {canCreate && (
                        <Link href="/announcements/create">
                            <Button><Plus className="mr-2 h-4 w-4" />New Announcement</Button>
                        </Link>
                    )}
                </div>

                {announcements.data.length > 0 ? (
                    <div className="space-y-4">
                        {announcements.data.map((item) => (
                            <Link key={item.id} href={`/announcements/${item.id}`}>
                                <Card className="transition-all hover:shadow-md hover:border-primary/50 mb-4">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="rounded-lg bg-primary/10 p-2.5 mt-0.5">
                                                    <Bell className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <h3 className="font-semibold text-lg">{item.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                                                    <div className="flex items-center gap-3 pt-1">
                                                        <Badge className={audienceBadge(item.audience)}>{item.audience.replace('_', ' ')}</Badge>
                                                        {item.club && <span className="text-sm text-muted-foreground">{item.club.name}</span>}
                                                        <span className="text-xs text-muted-foreground">{new Date(item.published_at || item.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        <DataPagination data={announcements} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                        <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">No announcements yet</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
