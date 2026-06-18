import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';
import {
    Save, AlertCircle, Home, Settings, Bot, Trophy, Palette,
    Rocket, ExternalLink, Info
} from 'lucide-react';
import { useState } from 'react';

interface SettingItem {
    key: string;
    value: string | null;
    type: string;
    group: string;
    label: string;
    description?: string;
}

interface Props {
    settings: Record<string, SettingItem>;
    upcomingEvents: { id: number; title: string; slug: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Site Settings', href: '/admin/site-settings' },
];

export default function SiteSettingsIndex({ settings }: Props) {
    const get = (key: string, fallback = '') => settings[key]?.value ?? fallback;

    const [formData, setFormData] = useState<Record<string, string>>({
        // Homepage
        hero_headline: get('hero_headline', 'Connect. Engage. Belong.'),
        hero_subtitle: get('hero_subtitle', 'Join clubs, attend events, and be part of the KCA University community.'),
        hero_cta_primary: get('hero_cta_primary', 'Explore Events'),
        hero_cta_secondary: get('hero_cta_secondary', 'Browse Clubs'),
        show_featured_events: get('show_featured_events', '1'),
        show_clubs_section: get('show_clubs_section', '1'),
        show_leaderboard: get('show_leaderboard', '1'),
        // General
        announcement_text: get('announcement_text', ''),
        announcement_color: get('announcement_color', '#182b5c'),
        contact_email: get('contact_email', ''),
        contact_phone: get('contact_phone', ''),
        footer_text: get('footer_text', ''),
        // AI
        ai_enabled: get('ai_enabled', '1'),
        ai_greeting: get('ai_greeting', 'Hi! I\'m the KCAU AI Assistant. How can I help you today?'),
        // Gamification
        points_register_event: get('points_register_event', '10'),
        points_attend_event: get('points_attend_event', '25'),
        points_join_club: get('points_join_club', '15'),
        points_submit_feedback: get('points_submit_feedback', '5'),
    });

    const [dirty, setDirty] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [seedDialog, setSeedDialog] = useState(false);

    function set(key: string, value: string) {
        setFormData((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    }

    function toggle(key: string) {
        setFormData((prev) => ({ ...prev, [key]: prev[key] === '1' ? '0' : '1' }));
        setDirty(true);
    }

    function handleSave() {
        setProcessing(true);
        const payload = Object.entries(formData).map(([key, value]) => ({ key, value }));
        router.post('/admin/site-settings', { settings: payload }, {
            onSuccess: () => setDirty(false),
            onFinish: () => setProcessing(false),
        });
    }

    function handleSeed() {
        router.post('/admin/site-settings/seed', {}, {
            onSuccess: () => setSeedDialog(false),
        });
    }

    const pointsAttend = parseInt(formData.points_attend_event) || 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Site Settings" />
            <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 pb-24 sm:px-6 lg:px-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <span>⚙️</span> Site Settings &amp; Content
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Control what students see on the platform</p>
                </div>

                <Tabs defaultValue="homepage">
                    <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="homepage" className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />Homepage</TabsTrigger>
                        <TabsTrigger value="general" className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" />General</TabsTrigger>
                        <TabsTrigger value="ai" className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" />AI Assistant</TabsTrigger>
                        <TabsTrigger value="gamification" className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" />Gamification</TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
                    </TabsList>

                    {/* ── HOMEPAGE ── */}
                    <TabsContent value="homepage" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Hero Banner</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Headline Text</Label>
                                        <Input value={formData.hero_headline} onChange={(e) => set('hero_headline', e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Hero Subtitle</Label>
                                        <Textarea rows={2} value={formData.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Primary CTA Button Text</Label>
                                        <Input value={formData.hero_cta_primary} onChange={(e) => set('hero_cta_primary', e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Secondary CTA Button Text</Label>
                                        <Input value={formData.hero_cta_secondary} onChange={(e) => set('hero_cta_secondary', e.target.value)} />
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Live Preview</p>
                                    <div className="rounded-xl bg-[#182b5c] p-6 text-white relative overflow-hidden">
                                        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-white/20 to-transparent" />
                                        <span className="relative text-[#d0b216] text-xs border border-[#d0b216]/30 px-2 py-0.5 rounded-full">
                                            🎓 KCA University
                                        </span>
                                        <h1 className="relative text-2xl font-bold mt-2 leading-tight">{formData.hero_headline || 'Your headline here'}</h1>
                                        <p className="relative text-white/70 text-sm mt-1">{formData.hero_subtitle || 'Your subtitle here'}</p>
                                        <div className="relative flex gap-2 mt-3 flex-wrap">
                                            <span className="bg-[#d0b216] text-[#182b5c] px-3 py-1 rounded-lg text-xs font-bold">
                                                {formData.hero_cta_primary || 'CTA'}
                                            </span>
                                            <span className="border border-white/30 text-white px-3 py-1 rounded-lg text-xs">
                                                {formData.hero_cta_secondary || 'Secondary'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Homepage Sections</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { key: 'show_featured_events', label: 'Show Featured Events Section', desc: 'Display upcoming events on the homepage' },
                                    { key: 'show_clubs_section', label: 'Show Clubs Section', desc: 'Display active clubs on the homepage' },
                                    { key: 'show_leaderboard', label: 'Show Leaderboard on Homepage', desc: 'Display the campus points leaderboard' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                                        <div>
                                            <p className="text-sm font-medium">{item.label}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={formData[item.key] === '1'}
                                            onCheckedChange={() => toggle(item.key)}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── GENERAL ── */}
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Site-wide Announcement Banner</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label>Announcement Text</Label>
                                    <Textarea
                                        rows={3}
                                        value={formData.announcement_text}
                                        onChange={(e) => set('announcement_text', e.target.value)}
                                        placeholder="Leave empty to hide the banner"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Banner Color</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={formData.announcement_color}
                                                onChange={(e) => set('announcement_color', e.target.value)}
                                                className="h-9 w-14 rounded border border-input cursor-pointer"
                                            />
                                            <span className="text-sm text-muted-foreground font-mono">{formData.announcement_color}</span>
                                        </div>
                                    </div>
                                    {formData.announcement_text && (
                                        <Button variant="outline" size="sm" onClick={() => set('announcement_text', '')}>
                                            Clear Announcement
                                        </Button>
                                    )}
                                </div>
                                {formData.announcement_text && (
                                    <div
                                        className="rounded-lg px-4 py-3 text-white text-sm flex items-center gap-2"
                                        style={{ backgroundColor: formData.announcement_color }}
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {formData.announcement_text}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Contact Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => set('contact_email', e.target.value)}
                                        placeholder="admin@kcau.ac.ke"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Contact Phone</Label>
                                    <Input
                                        value={formData.contact_phone}
                                        onChange={(e) => set('contact_phone', e.target.value)}
                                        placeholder="+254 700 000 000"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Footer Text</Label>
                                    <Input
                                        value={formData.footer_text}
                                        onChange={(e) => set('footer_text', e.target.value)}
                                        placeholder="© 2025 KCA University. All rights reserved."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-4 rounded-lg border border-border/60 p-4">
                                    <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Seed Default Settings</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Populate all settings with sensible defaults. Useful for new installations.</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSeedDialog(true)}
                                        className="shrink-0"
                                    >
                                        Seed Defaults
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── AI ASSISTANT ── */}
                    <TabsContent value="ai" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">AI Bot Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
                                    <div>
                                        <p className="text-sm font-medium">AI Assistant Enabled</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Show or hide the chat widget for all students</p>
                                    </div>
                                    <Switch
                                        checked={formData.ai_enabled === '1'}
                                        onCheckedChange={() => toggle('ai_enabled')}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>AI Greeting Message</Label>
                                    <p className="text-xs text-muted-foreground">First message students see when opening the chat</p>
                                    <Textarea
                                        rows={3}
                                        value={formData.ai_greeting}
                                        onChange={(e) => set('ai_greeting', e.target.value)}
                                    />
                                </div>

                                {/* Chat Widget Preview */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Widget Preview</p>
                                    <div className="bg-[#182b5c] rounded-xl p-4 max-w-xs shadow-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#d0b216] flex items-center justify-center text-lg">🤖</div>
                                            <div>
                                                <p className="text-white text-sm font-semibold">KCAU AI Assistant</p>
                                                <p className="text-white/60 text-xs">Online · Always here to help</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 bg-white/10 rounded-lg p-3 text-white/90 text-xs leading-relaxed">
                                            {formData.ai_greeting || 'Enter a greeting message above...'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm pt-2">
                                    <Link
                                        href="/admin/ai-training"
                                        className="inline-flex items-center gap-1.5 text-[#182b5c] dark:text-[#d0b216] font-medium hover:underline"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Go to AI Knowledge Base
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── GAMIFICATION ── */}
                    <TabsContent value="gamification" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Points Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    { key: 'points_register_event', label: 'Points for Registering for an Event' },
                                    { key: 'points_attend_event', label: 'Points for Attending an Event' },
                                    { key: 'points_join_club', label: 'Points for Joining a Club' },
                                    { key: 'points_submit_feedback', label: 'Points for Submitting Feedback' },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
                                        <Label className="cursor-pointer flex-1">{item.label}</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={1000}
                                            value={formData[item.key]}
                                            onChange={(e) => set(item.key, e.target.value)}
                                            className="w-24 text-center"
                                        />
                                    </div>
                                ))}

                                {/* Impact Preview */}
                                <div className="rounded-lg bg-[#182b5c]/5 dark:bg-[#182b5c]/20 border border-[#182b5c]/20 p-4">
                                    <p className="text-sm font-medium text-[#182b5c] dark:text-[#d0b216]">Point Value Impact</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        With these settings, attending 4 events ={' '}
                                        <span className="font-bold text-foreground">{pointsAttend * 4}</span> points
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/30 border-dashed">
                            <CardContent className="p-5 flex items-start gap-3">
                                <Trophy className="h-5 w-5 text-[#d0b216] mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">About Gamification</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Points encourage student engagement. Students with more points appear higher on the Campus Leaderboard, promoting healthy competition.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── APPEARANCE ── */}
                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
                                <Rocket className="h-12 w-12 text-muted-foreground/40" />
                                <div className="text-center">
                                    <p className="font-semibold text-lg">Theme Customization</p>
                                    <p className="text-muted-foreground text-sm mt-1">Coming in the next release 🚀</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Current Brand Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-lg border border-border/60 p-4">
                                    <div className="h-10 w-10 rounded-lg flex-shrink-0" style={{ backgroundColor: '#182b5c' }} />
                                    <div>
                                        <p className="text-sm font-medium">Primary Color</p>
                                        <p className="text-xs font-mono text-muted-foreground">#182b5c</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg border border-border/60 p-4">
                                    <div className="h-10 w-10 rounded-lg flex-shrink-0" style={{ backgroundColor: '#d0b216' }} />
                                    <div>
                                        <p className="text-sm font-medium">Accent / Gold Color</p>
                                        <p className="text-xs font-mono text-muted-foreground">#d0b216</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Fixed Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#182b5c] text-white shadow-2xl">
                <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        {dirty ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-[#d0b216] animate-pulse" />
                                <span className="text-white/80">Unsaved changes</span>
                            </>
                        ) : (
                            <>
                                <span className="h-2 w-2 rounded-full bg-green-400" />
                                <span className="text-white/80">All changes saved</span>
                            </>
                        )}
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={processing || !dirty}
                        className="bg-[#d0b216] text-[#182b5c] hover:bg-[#b99e12] font-bold flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save All Settings
                    </Button>
                </div>
            </div>

            {/* Seed Confirm Dialog */}
            <Dialog open={seedDialog} onOpenChange={setSeedDialog}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Seed Default Settings?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will populate all settings with sensible defaults. Existing settings will not be overwritten.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setSeedDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-[#182b5c] text-white hover:bg-[#1a3268]"
                            onClick={handleSeed}
                        >
                            Seed Defaults
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
