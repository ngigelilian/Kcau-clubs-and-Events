import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import type { BreadcrumbItem } from '@/types';
import type { User } from '@/types/auth';
import { Trophy, Star, Zap } from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}
function nextMilestone(pts: number) {
    return (Math.floor(pts / 100) + 1) * 100;
}

// ─── types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
    user: {
        id: number;
        name: string;
        avatar?: string;
        department?: string;
        year_of_study?: number;
    };
    total_points: number;
    total_actions: number;
}

interface Props {
    leaderboard: LeaderboardEntry[];
    myRank: number | null;
    myPoints: number | null;
}

// ─── rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
    let cls = 'bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full';
    if (rank <= 3) cls = 'bg-[#d0b216]/20 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full';
    else if (rank <= 10) cls = 'bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full';
    else if (rank <= 25) cls = 'bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full';
    return <span className={cls}>#{rank}</span>;
}

// ─── main ─────────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leaderboard', href: '/student/leaderboard' },
];

export default function Leaderboard({ leaderboard, myRank, myPoints }: Props) {
    const { auth } = usePage().props as { auth: { user: User } };
    const currentUserId = auth.user?.id;

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    const progress = myPoints != null
        ? Math.round(((myPoints % 100) / 100) * 100)
        : 0;
    const next = myPoints != null ? nextMilestone(myPoints) : 100;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Campus Leaderboard" />

            <div className="p-6 space-y-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#d0b216] to-amber-500 bg-clip-text text-transparent inline-flex items-center gap-2">
                        <Trophy className="w-7 h-7 text-[#d0b216]" /> Campus Leaderboard
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">Top students by engagement points</p>
                </div>

                {/* My Rank Card */}
                {myRank !== null && myPoints !== null && (
                    <div className="rounded-xl bg-gradient-to-r from-[#182b5c] to-[#1e3a7a] text-white p-5 shadow-lg">
                        <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-1">Your Ranking</p>
                        <div className="flex items-center gap-4">
                            <div className="text-5xl font-bold text-[#d0b216]">#{myRank}</div>
                            <div className="flex-1">
                                <p className="font-semibold">{auth.user.name}</p>
                                <p className="text-sm text-white/80">{myPoints} points</p>
                                <div className="mt-2 w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#d0b216] h-2 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/60 mt-0.5">
                                    {next - myPoints} pts to next milestone
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Podium — top 3 */}
                {top3.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 py-4">
                        {/* 2nd */}
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-36">
                            <span className="text-2xl">🥈</span>
                            <Avatar className="h-16 w-16 border-4 border-gray-300">
                                <AvatarImage src={top3[1].user.avatar} />
                                <AvatarFallback className="bg-gray-200 text-gray-600 font-bold">
                                    {initials(top3[1].user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <p className="font-semibold text-sm leading-tight">{top3[1].user.name}</p>
                                <Badge className="bg-[#d0b216]/20 text-amber-700 mt-1">
                                    <Star className="w-3 h-3 mr-1" />{top3[1].total_points} pts
                                </Badge>
                            </div>
                            <div className="w-full bg-gray-100 rounded-t-lg h-16 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-400">#2</span>
                            </div>
                        </div>

                        {/* 1st */}
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-40">
                            <span className="text-3xl">👑</span>
                            <Avatar className="h-20 w-20 border-4 border-[#d0b216]">
                                <AvatarImage src={top3[0].user.avatar} />
                                <AvatarFallback className="bg-[#d0b216]/20 text-amber-700 font-bold text-xl">
                                    {initials(top3[0].user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <p className="font-bold text-sm leading-tight">{top3[0].user.name}</p>
                                <Badge className="bg-[#d0b216] text-white mt-1 shadow">
                                    <Star className="w-3 h-3 mr-1" />{top3[0].total_points} pts
                                </Badge>
                            </div>
                            <div className="w-full bg-[#d0b216]/10 border border-[#d0b216] rounded-t-lg h-24 flex items-center justify-center">
                                <span className="text-3xl font-bold text-[#d0b216]">#1</span>
                            </div>
                        </div>

                        {/* 3rd */}
                        <div className="flex flex-col items-center gap-2 flex-1 max-w-36">
                            <span className="text-2xl">🥉</span>
                            <Avatar className="h-14 w-14 border-4 border-amber-600">
                                <AvatarImage src={top3[2].user.avatar} />
                                <AvatarFallback className="bg-amber-50 text-amber-700 font-bold">
                                    {initials(top3[2].user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <p className="font-semibold text-sm leading-tight">{top3[2].user.name}</p>
                                <Badge className="bg-[#d0b216]/20 text-amber-700 mt-1">
                                    <Star className="w-3 h-3 mr-1" />{top3[2].total_points} pts
                                </Badge>
                            </div>
                            <div className="w-full bg-amber-50 rounded-t-lg h-10 flex items-center justify-center">
                                <span className="text-xl font-bold text-amber-500">#3</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table — ranks 4+ */}
                {rest.length > 0 && (
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Rank</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead className="hidden md:table-cell">Department</TableHead>
                                        <TableHead className="hidden sm:table-cell">Year</TableHead>
                                        <TableHead>Points</TableHead>
                                        <TableHead className="hidden lg:table-cell">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rest.map((entry, idx) => {
                                        const rank = idx + 4;
                                        const isMe = entry.user.id === currentUserId;
                                        return (
                                            <TableRow key={entry.user.id}
                                                className={isMe ? 'bg-[#d0b216]/10 border-l-4 border-l-[#d0b216]' : ''}>
                                                <TableCell>
                                                    <RankBadge rank={rank} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarImage src={entry.user.avatar} />
                                                            <AvatarFallback className="bg-[#182b5c] text-white text-xs font-bold">
                                                                {initials(entry.user.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className={`text-sm ${isMe ? 'font-bold text-[#182b5c]' : 'font-medium'}`}>
                                                            {entry.user.name} {isMe && <span className="text-xs text-[#d0b216]">(You)</span>}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <span className="text-xs text-muted-foreground">
                                                        {entry.user.department ?? '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {entry.user.year_of_study && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Year {entry.user.year_of_study}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-[#d0b216]/20 text-amber-700 gap-1">
                                                        <Star className="w-3 h-3" />{entry.total_points}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <span className="text-xs text-muted-foreground cursor-not-allowed">
                                                        View Profile
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {leaderboard.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No leaderboard data yet.</p>
                    </div>
                )}

                {/* Points Legend */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4 text-[#d0b216]" /> How to Earn Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { action: 'Register for event', pts: 10, emoji: '📋' },
                                { action: 'Attend event', pts: 25, emoji: '✅' },
                                { action: 'Join a club', pts: 15, emoji: '🏛️' },
                                { action: 'Submit feedback', pts: 5, emoji: '⭐' },
                            ].map((item) => (
                                <div key={item.action}
                                    className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50 border">
                                    <span className="text-2xl mb-1">{item.emoji}</span>
                                    <span className="text-xs text-muted-foreground leading-tight">{item.action}</span>
                                    <span className="font-bold text-[#d0b216] mt-1">+{item.pts} pts</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
