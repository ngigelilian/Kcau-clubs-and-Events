import { Link } from '@inertiajs/react';
import {
    LayoutDashboard, Users, CalendarDays, Shield, LifeBuoy, Megaphone,
    PackageOpen, CreditCard, ShoppingBag, BarChart2, UserCog,
    Bot, Settings2, ExternalLink,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup,
    SidebarGroupContent,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: { url: '/admin', method: 'get' }, icon: LayoutDashboard },
    { title: 'Events', href: { url: '/admin/events', method: 'get' }, icon: CalendarDays },
    { title: 'Event Approvals', href: { url: '/admin/events/approve', method: 'get' }, icon: Shield },
    { title: 'Clubs', href: { url: '/admin/clubs', method: 'get' }, icon: Users },
    { title: 'Users', href: { url: '/admin/users', method: 'get' }, icon: UserCog },
    { title: 'Announcements', href: { url: '/admin/announcements', method: 'get' }, icon: Megaphone },
    { title: 'Merchandise', href: { url: '/admin/merchandise', method: 'get' }, icon: PackageOpen },
    { title: 'Payments', href: { url: '/admin/payments', method: 'get' }, icon: CreditCard },
    { title: 'Orders', href: { url: '/admin/orders', method: 'get' }, icon: ShoppingBag },
    { title: 'Support Tickets', href: { url: '/admin/tickets', method: 'get' }, icon: LifeBuoy },
    { title: 'Reports', href: { url: '/admin/reports', method: 'get' }, icon: BarChart2 },
];

const adminToolItems: NavItem[] = [
    { title: 'AI Training', href: { url: '/admin/ai-training', method: 'get' }, icon: Bot },
    { title: 'Site Settings', href: { url: '/admin/site-settings', method: 'get' }, icon: Settings2 },
];

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="border-b border-[#d0b216]/20 pb-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#d0b216]">
                                    <Shield className="size-4 text-[#182b5c]" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold text-sm">Admin Panel</span>
                                    <span className="text-xs text-muted-foreground">KCAU Events</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={adminNavItems} label="Management" />
                <NavMain items={adminToolItems} label="Tools & Config" />

                {/* Back to Student Portal link */}
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/student/dashboard">
                                        <ExternalLink className="size-4" />
                                        <span>Student Portal</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
