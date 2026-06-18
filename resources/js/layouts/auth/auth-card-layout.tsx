import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{ name?: string; title?: string; description?: string }>) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left panel — KCAU brand */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.22_0.09_264)] p-10 lg:flex">
                {/* Background pattern */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute -bottom-32 -right-32 size-[500px] rounded-full bg-[oklch(0.78_0.172_79)]/10 blur-3xl" />
                    <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Logo */}
                <Link href={home()} className="relative flex items-center gap-3 w-fit">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.78_0.172_79)] shadow-lg">
                        <span className="text-sm font-black text-[oklch(0.10_0_0)] tracking-tighter leading-none">KC</span>
                    </div>
                    <div>
                        <p className="text-base font-bold text-white leading-tight">KCAU Campus</p>
                        <p className="text-[11px] text-white/50 font-medium">Clubs & Events Portal</p>
                    </div>
                </Link>

                {/* Center tagline */}
                <div className="relative">
                    <blockquote className="space-y-4">
                        <div className="h-1 w-12 rounded-full bg-[oklch(0.78_0.172_79)]" />
                        <p className="text-2xl font-semibold leading-snug text-white">
                            Your campus life,<br />
                            <span className="text-[oklch(0.78_0.172_79)]">all in one place.</span>
                        </p>
                        <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                            Discover clubs, register for events, purchase merchandise, and stay
                            connected with the KCA University community.
                        </p>
                    </blockquote>
                </div>

                {/* Bottom footer */}
                <p className="relative text-xs text-white/30">
                    © {new Date().getFullYear()} KCA University · All rights reserved
                </p>
            </div>

            {/* Right panel — form */}
            <div className="flex items-center justify-center bg-background p-6 md:p-10">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link href={home()} className="mb-8 flex items-center gap-2.5 lg:hidden">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                            <span className="text-xs font-black text-white leading-none">KC</span>
                        </div>
                        <span className="font-bold text-foreground">KCAU Campus</span>
                    </Link>

                    <Card className="border-border/60 shadow-sm">
                        <CardHeader className="px-8 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                            {description && <CardDescription className="text-sm">{description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="px-8 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
