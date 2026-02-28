import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';
import { Shield, Mail, Phone, Calendar, Hash, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

interface UserDetail {
    id: number; name: string; email: string; student_id?: string;
    phone?: string; gender?: string; department?: string; year_of_study?: number;
    avatar?: string; is_active: boolean; google_id?: string;
    created_at: string; email_verified_at?: string;
    roles: { name: string }[];
    clubs_count: number;
    events_count: number;
    orders_count: number;
}
interface Props {
    user: UserDetail;
    roles: string[];
}

export default function AdminUserShow({ user, roles }: Props) {
    const [selectedRole, setSelectedRole] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/users' },
        { title: 'Manage Users', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    const toggleActive = () => router.post(`/admin/users/${user.id}/toggle-active`);
    const updateRole = () => {
        if (selectedRole) router.post(`/admin/users/${user.id}/role`, { role: selectedRole });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User - ${user.name}`} />
            <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-xl">{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className="text-2xl font-bold">{user.name}</h1>
                                    <p className="text-muted-foreground">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={user.is_active ? 'default' : 'secondary'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>
                                        {user.roles.map((r) => (
                                            <Badge key={r.name} variant="outline">{r.name}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Button variant={user.is_active ? 'destructive' : 'default'} onClick={toggleActive}>
                                {user.is_active ? <><UserX className="mr-2 h-4 w-4" />Deactivate</> : <><UserCheck className="mr-2 h-4 w-4" />Activate</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Personal Info */}
                    <Card>
                        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <InfoRow icon={Mail} label="Email" value={user.email} />
                            <InfoRow icon={Hash} label="Student ID" value={user.student_id || '—'} />
                            <InfoRow icon={Phone} label="Phone" value={user.phone || '—'} />
                            <InfoRow icon={Shield} label="Department" value={user.department || '—'} />
                            <InfoRow icon={Calendar} label="Year of Study" value={user.year_of_study ? `Year ${user.year_of_study}` : '—'} />
                            <InfoRow icon={Shield} label="Gender" value={user.gender || '—'} />
                            <Separator />
                            <InfoRow icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
                            <InfoRow icon={Shield} label="Email Verified" value={user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString() : 'No'} />
                            <InfoRow icon={Shield} label="OAuth" value={user.google_id ? 'Google' : 'Password'} />
                        </CardContent>
                    </Card>

                    {/* Activity + Role Management */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Activity Summary</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="rounded-lg bg-muted p-3">
                                        <p className="text-2xl font-bold">{user.clubs_count}</p>
                                        <p className="text-xs text-muted-foreground">Clubs</p>
                                    </div>
                                    <div className="rounded-lg bg-muted p-3">
                                        <p className="text-2xl font-bold">{user.events_count}</p>
                                        <p className="text-xs text-muted-foreground">Events</p>
                                    </div>
                                    <div className="rounded-lg bg-muted p-3">
                                        <p className="text-2xl font-bold">{user.orders_count}</p>
                                        <p className="text-xs text-muted-foreground">Orders</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Manage Role</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">Current: {user.roles.map(r => r.name).join(', ') || 'None'}</p>
                                <div className="flex items-end gap-2">
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select role..." /></SelectTrigger>
                                        <SelectContent>
                                            {roles.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={updateRole} disabled={!selectedRole}>Assign</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
