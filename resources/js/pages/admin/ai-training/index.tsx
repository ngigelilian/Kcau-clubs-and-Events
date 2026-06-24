import { Head, router } from '@inertiajs/react';
import {
    Bot, CheckCircle, MessageCircle, ThumbsUp, ThumbsDown,
    TrendingUp, Pencil, Trash2, ChevronDown, ChevronUp, Lightbulb,
    Plus
} from 'lucide-react';
import { useState, useMemo } from 'react';
import DataPagination from '@/components/shared/data-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import type { BreadcrumbItem, PaginatedResponse } from '@/types';

interface KnowledgeEntry {
    id: number;
    question: string;
    answer: string;
    category: string;
    is_active: boolean;
    use_count: number;
    created_at: string;
    created_by?: { name: string };
}

interface ChatLog {
    id: number;
    question: string;
    answer: string;
    was_helpful: boolean | null;
    created_at: string;
    user?: { name: string };
}

interface Props {
    entries: PaginatedResponse<KnowledgeEntry>;
    stats: { total: number; active: number; total_chats: number; helpful_rate: number };
    recentChats: ChatLog[];
}

const CATEGORIES = ['General', 'Events', 'Clubs', 'Payments', 'Rules', 'Facilities'] as const;

const categoryColors: Record<string, string> = {
    General: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Events: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    Clubs: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    Payments: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Rules: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    Facilities: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'AI Training', href: '/admin/ai-training' },
];

function relativeDate(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

const emptyForm = { category: 'General', question: '', answer: '', is_active: true };

export default function AiTrainingIndex({ entries, stats, recentChats }: Props) {
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({ ...emptyForm });
    const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null);
    const [editForm, setEditForm] = useState({ ...emptyForm });
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [processing, setProcessing] = useState(false);

    const filtered = useMemo(() => {
        return entries.data.filter((e) => {
            const matchSearch = e.question.toLowerCase().includes(search.toLowerCase()) ||
                e.answer.toLowerCase().includes(search.toLowerCase());
            const matchCat = catFilter === 'All' || e.category === catFilter;
            return matchSearch && matchCat;
        });
    }, [entries.data, search, catFilter]);

    function handleAdd(ev: React.FormEvent) {
        ev.preventDefault();
        setProcessing(true);
        router.post('/admin/ai-training', form, {
            onSuccess: () => { setAddOpen(false); setForm({ ...emptyForm }); },
            onFinish: () => setProcessing(false),
        });
    }

    function handleEdit(ev: React.FormEvent) {
        ev.preventDefault();
        if (!editEntry) return;
        setProcessing(true);
        router.put(`/admin/ai-training/${editEntry.id}`, editForm, {
            onSuccess: () => setEditEntry(null),
            onFinish: () => setProcessing(false),
        });
    }

    function handleToggle(id: number) {
        router.post(`/admin/ai-training/${id}/toggle`, {}, { preserveScroll: true });
    }

    function handleDelete(id: number) {
        router.delete(`/admin/ai-training/${id}`, {
            onSuccess: () => setDeleteConfirm(null),
            preserveScroll: true,
        });
    }

    function openEdit(entry: KnowledgeEntry) {
        setEditEntry(entry);
        setEditForm({ category: entry.category, question: entry.question, answer: entry.answer, is_active: entry.is_active });
    }

    const statCards = [
        { label: 'Total Entries', value: stats.total, icon: Bot, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        { label: 'Active Entries', value: stats.active, icon: CheckCircle, color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
        { label: 'Total Conversations', value: stats.total_chats.toLocaleString(), icon: MessageCircle, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        { label: 'Helpful Rate', value: `${stats.helpful_rate}%`, icon: ThumbsUp, color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Training" />
            <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <span>🤖</span> AI Knowledge Base
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Train the campus AI assistant</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statCards.map((s) => (
                        <Card key={s.label}>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={`rounded-xl p-3 ${s.color}`}>
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                                    <p className="text-2xl font-bold leading-tight">{s.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Add Entry Collapsible */}
                <Card>
                    <CardHeader className="pb-3">
                        <button
                            type="button"
                            onClick={() => setAddOpen(!addOpen)}
                            className="flex w-full items-center justify-between"
                        >
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Plus className="h-4 w-4 text-[#d0b216]" />
                                Add Knowledge Entry
                            </CardTitle>
                            {addOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>
                    </CardHeader>
                    {addOpen && (
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label>Category</Label>
                                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <Switch
                                            id="add-active"
                                            checked={form.is_active}
                                            onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                                        />
                                        <Label htmlFor="add-active" className="cursor-pointer">Active (visible to AI)</Label>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Question</Label>
                                    <Input
                                        value={form.question}
                                        onChange={(e) => setForm({ ...form, question: e.target.value })}
                                        placeholder="e.g. How do I register for an event?"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label>Answer</Label>
                                        <span className="text-xs text-muted-foreground">{form.answer.length}/3000</span>
                                    </div>
                                    <Textarea
                                        value={form.answer}
                                        onChange={(e) => setForm({ ...form, answer: e.target.value.slice(0, 3000) })}
                                        placeholder="Type the full answer here..."
                                        rows={4}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-[#d0b216] text-[#182b5c] hover:bg-[#b99e12] font-semibold"
                                    >
                                        Save to Knowledge Base
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    )}
                </Card>

                {/* Knowledge Base Table */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-xs flex-1">
                            <Input
                                placeholder="Search entries..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-4"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['All', ...CATEGORIES].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCatFilter(cat)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        catFilter === cat
                                            ? 'bg-[#182b5c] text-white'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">Status</TableHead>
                                        <TableHead className="w-28">Category</TableHead>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Answer Preview</TableHead>
                                        <TableHead className="w-20">Uses</TableHead>
                                        <TableHead className="w-32">Created</TableHead>
                                        <TableHead className="w-28 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${entry.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`text-xs ${categoryColors[entry.category] ?? categoryColors.General}`}>
                                                    {entry.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium text-sm truncate max-w-[200px]">{entry.question}</p>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm text-muted-foreground line-clamp-2 max-w-[220px]">{entry.answer}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                                    {entry.use_count}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-muted-foreground">{relativeDate(entry.created_at)}</p>
                                                {entry.created_by && (
                                                    <p className="text-xs text-muted-foreground/70 truncate max-w-[100px]">{entry.created_by.name}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Switch
                                                        checked={entry.is_active}
                                                        onCheckedChange={() => handleToggle(entry.id)}
                                                        className="scale-75"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => openEdit(entry)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteConfirm(entry.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filtered.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                                No entries found{search ? ` for "${search}"` : ''}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <DataPagination data={entries} />
                </div>

                {/* Recent Chat Logs */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-purple-500" />
                            Recent Chat Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Question</TableHead>
                                    <TableHead>Answer Preview</TableHead>
                                    <TableHead className="w-24">Helpful</TableHead>
                                    <TableHead className="w-28">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentChats.map((log) => (
                                    <TableRow
                                        key={log.id}
                                        className={
                                            log.was_helpful === true
                                                ? 'bg-green-50/60 dark:bg-green-950/20'
                                                : log.was_helpful === false
                                                ? 'bg-red-50/60 dark:bg-red-950/20'
                                                : ''
                                        }
                                    >
                                        <TableCell className="text-sm font-medium">
                                            {log.user?.name ?? <span className="text-muted-foreground italic">Guest</span>}
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[180px] truncate">{log.question}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground line-clamp-2 max-w-[220px]">{log.answer}</TableCell>
                                        <TableCell>
                                            {log.was_helpful === true ? (
                                                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                    <ThumbsUp className="h-3.5 w-3.5" /> Yes
                                                </div>
                                            ) : log.was_helpful === false ? (
                                                <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                                    <ThumbsDown className="h-3.5 w-3.5" /> No
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{relativeDate(log.created_at)}</TableCell>
                                    </TableRow>
                                ))}
                                {recentChats.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No chat logs yet</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Tips Card */}
                <Card className="bg-muted/40 border-dashed">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-[#d0b216] mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm mb-2">How to Train the AI Effectively</p>
                                <ul className="space-y-1.5 text-sm text-muted-foreground list-none">
                                    <li className="flex items-start gap-2"><span className="text-[#d0b216] font-bold mt-0.5">·</span> Be specific in questions — use exact phrasing students would use</li>
                                    <li className="flex items-start gap-2"><span className="text-[#d0b216] font-bold mt-0.5">·</span> Include variations: "How to pay" and "Payment process" should have the same answer</li>
                                    <li className="flex items-start gap-2"><span className="text-[#d0b216] font-bold mt-0.5">·</span> Use <strong>bold</strong> for key terms in answers to improve readability</li>
                                    <li className="flex items-start gap-2"><span className="text-[#d0b216] font-bold mt-0.5">·</span> Categories help the AI prioritize matches — choose the most relevant one</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editEntry} onOpenChange={(o) => !o && setEditEntry(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Knowledge Entry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Category</Label>
                                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3 pt-6">
                                <Switch
                                    id="edit-active"
                                    checked={editForm.is_active}
                                    onCheckedChange={(v) => setEditForm({ ...editForm, is_active: v })}
                                />
                                <Label htmlFor="edit-active" className="cursor-pointer">Active</Label>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Question</Label>
                            <Input
                                value={editForm.question}
                                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label>Answer</Label>
                                <span className="text-xs text-muted-foreground">{editForm.answer.length}/3000</span>
                            </div>
                            <Textarea
                                value={editForm.answer}
                                onChange={(e) => setEditForm({ ...editForm, answer: e.target.value.slice(0, 3000) })}
                                rows={4}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[#d0b216] text-[#182b5c] hover:bg-[#b99e12] font-semibold"
                            >
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={deleteConfirm !== null} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Entry?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">This knowledge entry will be permanently removed from the AI knowledge base. This action cannot be undone.</p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
                        >
                            Delete Entry
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
