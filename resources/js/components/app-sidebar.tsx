import { Link } from '@inertiajs/react';
import {
    LayoutGrid, Users, CalendarDays, ShoppingBag, Bell, LifeBuoy,
    Bookmark, Trophy, type LucideIcon,
} from 'lucide-react';
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
    { title: 'My Hub', href: { url: '/student/dashboard', method: 'get' }, icon: LayoutGrid },
    { title: 'Events', href: { url: '/events', method: 'get' }, icon: CalendarDays },
    { title: 'Clubs', href: { url: '/clubs', method: 'get' }, icon: Users },
    { title: 'My Events', href: { url: '/student/my-events', method: 'get' }, icon: CalendarDays },
    { title: 'Bookmarks', href: { url: '/student/bookmarks', method: 'get' }, icon: Bookmark },
    { title: 'Leaderboard', href: { url: '/leaderboard', method: 'get' }, icon: Trophy },
    { title: 'Merchandise', href: { url: '/merchandise', method: 'get' }, icon: ShoppingBag },
    { title: 'Announcements', href: { url: '/announcements', method: 'get' }, icon: Bell },
    { title: 'Support', href: { url: '/tickets', method: 'get' }, icon: LifeBuoy },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
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
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
