import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem, Announcement } from '@/types';
import { Bell, Calendar } from 'lucide-react';

interface Props {
    announcement: Announcement;
}

export default function AnnouncementShow({ announcement }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Announcements', href: '/announcements' },
        { title: announcement.title, href: `/announcements/${announcement.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={announcement.title} />
            <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card>
                    <CardHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2.5">
                                <Bell className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-2xl">{announcement.title}</CardTitle>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <Badge variant="outline">{announcement.audience.replace('_', ' ')}</Badge>
                                    {announcement.club && <Badge variant="secondary">{announcement.club.name}</Badge>}
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(announcement.published_at || announcement.created_at).toLocaleDateString('en-KE', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-6">
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{announcement.content}</div>
                    </CardContent>
                </Card>

                {announcement.created_by_user && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={announcement.created_by_user.avatar} />
                            <AvatarFallback>{announcement.created_by_user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>Posted by {announcement.created_by_user.name}</span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
