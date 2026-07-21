<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\AiKnowledgeBase;
use App\Models\AiChatLog;
use Illuminate\Http\Request;

class AiTrainingController extends Controller
{
    public function index(Request $request)
    {
        $entries = AiKnowledgeBase::with('createdBy:id,name')
            ->when($request->search, fn($q) => $q->where('question', 'LIKE', "%{$request->search}%"))
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->orderByDesc('use_count')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total' => AiKnowledgeBase::count(),
            'active' => AiKnowledgeBase::where('is_active', true)->count(),
            'total_chats' => AiChatLog::count(),
            'helpful_rate' => AiChatLog::whereNotNull('was_helpful')->count() > 0
                ? round(AiChatLog::where('was_helpful', true)->count() / AiChatLog::whereNotNull('was_helpful')->count() * 100)
                : 0,
        ];

        $recentChats = AiChatLog::with('user:id,name')->latest()->take(10)->get();

        return inertia('admin/ai-training/index', compact('entries', 'stats', 'recentChats'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string|max:3000',
            'category' => 'required|in:general,events,clubs,payments,rules,facilities',
            'is_active' => 'boolean',
        ]);
        AiKnowledgeBase::create([...$data, 'created_by' => $request->user()->id]);
        return back()->with('success', 'Knowledge entry added!');
    }

    public function update(Request $request, AiKnowledgeBase $entry)
    {
        $data = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string|max:3000',
            'category' => 'required|in:general,events,clubs,payments,rules,facilities',
            'is_active' => 'boolean',
        ]);
        $entry->update($data);
        return back()->with('success', 'Entry updated!');
    }

    public function destroy(AiKnowledgeBase $entry)
    {
        $entry->delete();
        return back()->with('success', 'Entry deleted.');
    }

    public function toggleActive(AiKnowledgeBase $entry)
    {
        $entry->update(['is_active' => !$entry->is_active]);
        return back()->with('success', $entry->is_active ? 'Entry activated.' : 'Entry deactivated.');
    }
}
