import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Shield, CalendarDays, ShoppingBag, Bell, LifeBuoy, UserCog, type LucideIcon } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Clubs',
        href: { url: '/clubs', method: 'get' },
        icon: Users,
    },
    {
        title: 'Events',
        href: { url: '/events', method: 'get' },
        icon: CalendarDays,
    },
    {
        title: 'Merchandise',
        href: { url: '/merchandise', method: 'get' },
        icon: ShoppingBag,
    },
    {
        title: 'Announcements',
        href: { url: '/announcements', method: 'get' },
        icon: Bell,
    },
    {
        title: 'Support',
        href: { url: '/tickets', method: 'get' },
        icon: LifeBuoy,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Manage Clubs',
        href: { url: '/admin/clubs', method: 'get' },
        icon: Shield,
    },
    {
        title: 'Manage Events',
        href: { url: '/admin/events', method: 'get' },
        icon: CalendarDays,
    },
    {
        title: 'Manage Users',
        href: { url: '/admin/users', method: 'get' },
        icon: UserCog,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: { roles?: string[] } | null } };
    const userRoles = auth.user?.roles ?? [];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super-admin');

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {isAdmin && <NavMain items={adminNavItems} label="Administration" />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
