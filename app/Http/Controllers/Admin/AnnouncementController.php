<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnnouncementAudience;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\User;
use App\Notifications\AnnouncementPublishedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Announcement::query()
            ->with(['club:id,name', 'author:id,name'])
            ->latest();

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($clubId = $request->input('club_id')) {
            $clubId === 'system' ? $query->whereNull('club_id') : $query->where('club_id', $clubId);
        }

        $announcements = $query->paginate(20)->withQueryString();

        return Inertia::render('admin/announcements/index', [
            'announcements' => $announcements,
            'filters' => ['search' => $request->input('search', ''), 'club_id' => $request->input('club_id', '')],
            'clubs' => Club::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/announcements/create', [
            'clubs' => Club::active()->orderBy('name')->get(['id', 'name']),
            'audiences' => collect(AnnouncementAudience::cases())->map(fn ($a) => [
                'value' => $a->value,
                'label' => $a->label(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:10'],
            'club_id' => ['nullable', 'exists:clubs,id'],
            'audience' => ['required', \Illuminate\Validation\Rule::enum(AnnouncementAudience::class)],
            'is_email' => ['boolean'],
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'published_at' => now(),
        ]);

        // Notify members
        if ($announcement->club_id) {
            $members = Club::find($announcement->club_id)
                ->memberships()->where('status', 'active')->with('user')->get()->pluck('user');
        } else {
            $members = User::role('student')->where('is_active', true)->get();
        }
        Notification::send($members, new AnnouncementPublishedNotification($announcement));

        return to_route('admin.announcements.index')->with('success', 'Announcement published.');
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return back()->with('success', 'Announcement deleted.');
    }
}
