<?php

namespace App\Http\Controllers;

use App\Enums\AnnouncementAudience;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\User;
use App\Notifications\AnnouncementPublishedNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Announcement::query()
            ->with(['club:id,name,slug', 'author:id,name,avatar'])
            ->published()
            ->latest('published_at');

        // Students see system-wide + their club announcements
        if (! $user->hasRole(['admin', 'super-admin'])) {
            $clubIds = $user->clubMemberships()
                ->where('status', 'active')
                ->pluck('club_id');

            $query->where(function ($q) use ($clubIds) {
                $q->whereNull('club_id') // system-wide
                  ->orWhereIn('club_id', $clubIds);
            });
        }

        $announcements = $query->paginate(15)->withQueryString();

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $clubs = [];

        if ($user->hasRole(['admin', 'super-admin'])) {
            $clubs = Club::active()->orderBy('name')->get(['id', 'name']);
        } else {
            $clubs = Club::active()
                ->whereHas('memberships', fn ($q) => $q->where('user_id', $user->id)
                    ->whereIn('role', ['leader', 'co-leader'])
                    ->where('status', 'active'))
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Inertia::render('announcements/create', [
            'clubs' => $clubs,
            'audiences' => collect(AnnouncementAudience::cases())->map(fn (AnnouncementAudience $a) => [
                'value' => $a->value,
                'label' => $a->label(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:10', 'max:10000'],
            'club_id' => ['nullable', 'exists:clubs,id'],
            'audience' => ['required', \Illuminate\Validation\Rule::enum(AnnouncementAudience::class)],
            'is_email' => ['boolean'],
            'publish_now' => ['boolean'],
        ]);

        // Authorization: if club-specific, user must be leader of that club
        if ($validated['club_id']) {
            $club = Club::findOrFail($validated['club_id']);
            $this->authorize('sendAnnouncements', $club);
        } else {
            // System-wide = admin only
            if (! $request->user()->hasRole(['admin', 'super-admin'])) {
                abort(403, 'Only admins can send system-wide announcements.');
            }
        }

        $announcement = Announcement::create([
            'club_id' => $validated['club_id'] ?? null,
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'body' => $validated['body'],
            'audience' => $validated['audience'],
            'is_email' => $validated['is_email'] ?? false,
            'published_at' => ($validated['publish_now'] ?? true) ? now() : null,
        ]);

        // If published, notify members immediately
        if ($announcement->published_at) {
            $this->notifyMembers($announcement);
        }

        return to_route('announcements.index')
            ->with('success', 'Announcement published successfully.');
    }

    public function show(Announcement $announcement): Response
    {
        $announcement->load(['club:id,name,slug', 'author:id,name,avatar']);

        return Inertia::render('announcements/show', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Notify club members or all users of the announcement.
     */
    private function notifyMembers(Announcement $announcement): void
    {
        // System-wide announcement: notify all active students
        if (!$announcement->club_id) {
            $users = User::role('student')->where('is_active', true)->get();
            Notification::send($users, new AnnouncementPublishedNotification($announcement));
            return;
        }

        // Club-specific announcement: notify all active members
        $club = $announcement->club;
        $members = $club->memberships()
            ->where('status', 'active')
            ->with('user')
            ->get()
            ->pluck('user');

        Notification::send($members, new AnnouncementPublishedNotification($announcement));
    }
}
