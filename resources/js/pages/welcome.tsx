import { Head, Link, usePage } from '@inertiajs/react';
import LandingHeader from '@/components/landing/landing-header';
import LandingFooter from '@/components/landing/landing-footer';
import { Button } from '@/components/ui/button';

// ─── Icon Components ────────────────────────────────────────────────────────────

function CalendarIcon({ className = 'size-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    );
}

function UsersIcon({ className = 'size-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    );
}

function ShoppingBagIcon({ className = 'size-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
    );
}

function ShieldIcon({ className = 'size-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function BellIcon({ className = 'size-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    );
}

function ChartIcon({ className = 'size-6' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
    );
}

function GoogleIcon({ className = 'size-5' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

function ArrowRightIcon({ className = 'size-4' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
    );
}

function CheckIcon({ className = 'size-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props as { auth: { user: unknown | null } };

    const features = [
        {
            icon: <UsersIcon />,
            title: 'Club Management',
            description: 'Create, join, and manage student clubs with streamlined member onboarding and role-based administration.',
        },
        {
            icon: <CalendarIcon />,
            title: 'Event Organization',
            description: 'Plan and promote campus events with built-in registration, ticketing, and attendance tracking.',
        },
        {
            icon: <ShoppingBagIcon />,
            title: 'Merchandise Store',
            description: 'Sell club merchandise online with inventory management and secure M-Pesa payments.',
        },
        {
            icon: <BellIcon />,
            title: 'Announcements',
            description: 'Stay informed with targeted announcements from clubs and administration, delivered instantly.',
        },
        {
            icon: <ShieldIcon />,
            title: 'Secure Access',
            description: 'Hassle-free sign-in with your KCAU Google account. Role-based permissions keep everything organized.',
        },
        {
            icon: <ChartIcon />,
            title: 'Analytics & Reports',
            description: 'Gain insights with comprehensive dashboards for participation, finances, and club performance.',
        },
    ];

    const steps = [
        {
            step: '01',
            title: 'Sign in with Google',
            description: 'Use your @students.kcau.ac.ke or @kcau.ac.ke email to instantly access the platform.',
        },
        {
            step: '02',
            title: 'Explore & Join Clubs',
            description: 'Browse the catalog of student clubs and request to join the ones that match your interests.',
        },
        {
            step: '03',
            title: 'Attend Events',
            description: 'Register for upcoming campus events, purchase tickets, and get your attendance tracked.',
        },
        {
            step: '04',
            title: 'Stay Connected',
            description: 'Receive announcements, buy merch, and engage with your university community all in one place.',
        },
    ];

    const stats = [
        { value: '50+', label: 'Active Clubs' },
        { value: '200+', label: 'Events Per Year' },
        { value: '5,000+', label: 'Students Connected' },
        { value: '100%', label: 'KCAU Community' },
    ];

    const faqs = [
        {
            question: 'Who can use KCAU Events?',
            answer: 'All KCA University students with a valid @students.kcau.ac.ke email and staff with @kcau.ac.ke accounts can sign in and use the platform.',
        },
        {
            question: 'How do I create a new club?',
            answer: 'After signing in, navigate to the Clubs section and click "Create Club." Fill in the details and submit for admin approval. Once approved, you become the club leader.',
        },
        {
            question: 'Are payments secure?',
            answer: 'Yes. All payments are processed through M-Pesa STK Push, a secure and widely trusted mobile payment system in Kenya.',
        },
        {
            question: 'Can I organize events without a club?',
            answer: 'School-wide events can be created by administrators. Club events are organized by club leaders and co-leaders within their respective clubs.',
        },
        {
            question: 'How do I get support?',
            answer: 'You can submit a support ticket from within the platform. Our admin team will respond promptly to assist you.',
        },
    ];

    return (
        <>
            <Head title="Welcome to KCAU Events">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-background font-sans text-foreground">
                <LandingHeader />

                {/* ── Hero Section ──────────────────────────────────────────── */}
                <section className="relative overflow-hidden pt-16">
                    {/* Background decoration */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/5 blur-3xl" />
                        <div className="absolute -bottom-40 -left-40 size-[600px] rounded-full bg-primary/5 blur-3xl" />
                        <div className="absolute top-1/2 left-1/2 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
                        <div className="mx-auto max-w-3xl text-center">
                            {/* Badge */}
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                                </span>
                                Now live for KCA University
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                                Your Campus Life,{' '}
                                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                                    All in One Place
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                                Discover clubs, register for events, grab merch, and stay connected with the
                                KCA University community — all through one seamless platform.
                            </p>

                            {/* CTA buttons */}
                            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {auth.user ? (
                                    <Button size="lg" asChild className="h-12 px-8 text-base">
                                        <Link href="/dashboard">
                                            Go to Dashboard
                                            <ArrowRightIcon />
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        <Button size="lg" asChild className="h-12 px-8 text-base">
                                            <Link href="/login" className="gap-2.5">
                                                <GoogleIcon className="size-5" />
                                                Sign in with Google
                                            </Link>
                                        </Button>
                                        <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                                            <a href="#features">
                                                Learn More
                                                <ArrowRightIcon />
                                            </a>
                                        </Button>
                                    </>
                                )}
                            </div>

                            <p className="mt-4 text-xs text-muted-foreground">
                                Use your @students.kcau.ac.ke or @kcau.ac.ke account
                            </p>
                        </div>

                        {/* Hero visual — Abstract dashboard preview */}
                        <div className="relative mx-auto mt-16 max-w-5xl lg:mt-20">
                            <div className="rounded-xl border border-border bg-card/50 p-2 shadow-2xl shadow-primary/5 backdrop-blur-sm">
                                <div className="rounded-lg border border-border bg-card">
                                    {/* Mock browser bar */}
                                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="size-3 rounded-full bg-red-400/80" />
                                            <div className="size-3 rounded-full bg-yellow-400/80" />
                                            <div className="size-3 rounded-full bg-green-400/80" />
                                        </div>
                                        <div className="mx-auto flex h-7 w-full max-w-md items-center justify-center rounded-md bg-muted px-4 text-xs text-muted-foreground">
                                            events.kcau.ac.ke
                                        </div>
                                    </div>
                                    {/* Mock dashboard content */}
                                    <div className="grid gap-4 p-6 lg:grid-cols-3">
                                        {/* Stat cards */}
                                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">My Clubs</span>
                                                <UsersIcon className="size-4 text-muted-foreground" />
                                            </div>
                                            <p className="mt-2 text-2xl font-bold">4</p>
                                            <p className="mt-1 text-xs text-green-600 dark:text-green-400">+2 new this semester</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">Upcoming Events</span>
                                                <CalendarIcon className="size-4 text-muted-foreground" />
                                            </div>
                                            <p className="mt-2 text-2xl font-bold">7</p>
                                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">3 this week</p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">Announcements</span>
                                                <BellIcon className="size-4 text-muted-foreground" />
                                            </div>
                                            <p className="mt-2 text-2xl font-bold">12</p>
                                            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">5 unread</p>
                                        </div>
                                        {/* Mock event list */}
                                        <div className="rounded-lg border border-border bg-muted/30 p-4 lg:col-span-2">
                                            <h3 className="text-sm font-semibold">Upcoming Events</h3>
                                            <div className="mt-3 space-y-3">
                                                {[
                                                    { name: 'Tech Innovation Summit', date: 'Mar 15', club: 'Tech Club' },
                                                    { name: 'Cultural Night 2026', date: 'Mar 22', club: 'Cultural Society' },
                                                    { name: 'Basketball Finals', date: 'Mar 28', club: 'Sports Club' },
                                                ].map((event) => (
                                                    <div key={event.name} className="flex items-center justify-between rounded-md bg-background/50 p-3">
                                                        <div>
                                                            <p className="text-sm font-medium">{event.name}</p>
                                                            <p className="text-xs text-muted-foreground">{event.club}</p>
                                                        </div>
                                                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                            {event.date}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Quick actions */}
                                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                                            <h3 className="text-sm font-semibold">Quick Actions</h3>
                                            <div className="mt-3 space-y-2">
                                                {['Browse Clubs', 'View Events', 'Shop Merch'].map((action) => (
                                                    <div key={action} className="flex items-center gap-2 rounded-md bg-background/50 p-2.5 text-sm">
                                                        <ArrowRightIcon className="size-3.5 text-primary" />
                                                        {action}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Glow effect */}
                            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-2xl" />
                        </div>
                    </div>
                </section>

                {/* ── Stats Section ──────────────────────────────────────── */}
                <section className="border-y border-border bg-muted/30">
                    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <p className="text-3xl font-bold tracking-tight sm:text-4xl">{stat.value}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Features Section ──────────────────────────────────── */}
                <section id="features" className="scroll-mt-16">
                    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-sm font-semibold tracking-widest text-primary uppercase">Features</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Everything you need for campus life
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                A complete platform designed specifically for KCA University students and staff.
                            </p>
                        </div>

                        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                                >
                                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                        {feature.icon}
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── How It Works Section ─────────────────────────────── */}
                <section id="how-it-works" className="scroll-mt-16 border-t border-border bg-muted/20">
                    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-sm font-semibold tracking-widest text-primary uppercase">How It Works</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Get started in minutes
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                From sign-in to full engagement, it only takes a few simple steps.
                            </p>
                        </div>

                        <div className="relative mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {/* Connecting line */}
                            <div className="absolute top-12 right-0 left-0 hidden h-0.5 bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

                            {steps.map((step) => (
                                <div key={step.step} className="relative text-center">
                                    <div className="relative z-10 mx-auto flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary">
                                        {step.step}
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Community / Clubs Preview Section ───────────────── */}
                <section id="community" className="scroll-mt-16">
                    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-12 lg:grid-cols-2">
                            <div>
                                <p className="text-sm font-semibold tracking-widest text-primary uppercase">Community</p>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                    Join a thriving campus community
                                </h2>
                                <p className="mt-4 text-lg text-muted-foreground">
                                    From tech and entrepreneurship to sports and culture — there&apos;s a club for every passion at KCAU.
                                </p>
                                <ul className="mt-8 space-y-4">
                                    {[
                                        'Browse and join from 50+ active student clubs',
                                        'Discover events tailored to your interests',
                                        'Connect with like-minded students across departments',
                                        'Build leadership skills as a club leader',
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-3">
                                            <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                                            <span className="text-sm text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8">
                                    <Button asChild>
                                        <Link href="/clubs">
                                            Explore Clubs
                                            <ArrowRightIcon />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            {/* Visual: Stacked club cards */}
                            <div className="relative">
                                <div className="space-y-4">
                                    {[
                                        { name: 'KCAU Tech Club', members: 142, category: 'Technology', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
                                        { name: 'Entrepreneurship Society', members: 98, category: 'Business', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                                        { name: 'Drama & Arts Club', members: 76, category: 'Culture', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
                                        { name: 'Sports & Fitness', members: 210, category: 'Sports', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
                                    ].map((club) => (
                                        <div
                                            key={club.name}
                                            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                                        >
                                            <div className={`flex size-12 items-center justify-center rounded-lg ${club.color}`}>
                                                <UsersIcon className="size-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{club.name}</h4>
                                                <p className="text-xs text-muted-foreground">{club.members} members</p>
                                            </div>
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${club.color}`}>
                                                {club.category}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {/* Decorative glow */}
                                <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent blur-xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── FAQ Section ──────────────────────────────────────── */}
                <section id="faq" className="scroll-mt-16 border-t border-border bg-muted/20">
                    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <p className="text-sm font-semibold tracking-widest text-primary uppercase">FAQ</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                Frequently asked questions
                            </h2>
                        </div>

                        <div className="mt-12 divide-y divide-border">
                            {faqs.map((faq) => (
                                <details key={faq.question} className="group py-5">
                                    <summary className="flex cursor-pointer items-center justify-between text-left">
                                        <span className="font-medium">{faq.question}</span>
                                        <svg
                                            className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    </summary>
                                    <p className="mt-3 pr-12 text-sm leading-relaxed text-muted-foreground">
                                        {faq.answer}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Section ──────────────────────────────────────── */}
                <section className="relative overflow-hidden border-t border-border">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-40 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
                    </div>
                    <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Ready to dive into campus life?
                            </h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Join thousands of KCAU students already using the platform. Sign in with your university Google account and get started today.
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                                {auth.user ? (
                                    <Button size="lg" asChild className="h-12 px-8 text-base">
                                        <Link href="/dashboard">
                                            Go to Dashboard
                                            <ArrowRightIcon />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button size="lg" asChild className="h-12 px-8 text-base">
                                        <Link href="/login" className="gap-2.5">
                                            <GoogleIcon className="size-5" />
                                            Get Started with Google
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <LandingFooter />
            </div>
        </>
    );
}
