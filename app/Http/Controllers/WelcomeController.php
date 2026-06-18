<?php

namespace App\Http\Controllers;

use App\Enums\ClubStatus;
use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Models\Club;
use App\Models\Event;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // First 5 upcoming approved events (featured)
        $featuredEvents = Event::approved()
            ->upcoming()
            ->with('club:id,name,slug')
            ->orderBy('start_datetime')
            ->limit(5)
            ->get()
            ->transform(function (Event $event) {
                $event->cover_url = $event->getFirstMediaUrl('cover');
                $event->formatted_fee = $event->is_paid ? $event->formattedFee() : 'Free';
                $event->registered_count = $event->registrations()->count();
                return $event;
            });

        // Next 6 upcoming approved events (excluding featured)
        $featuredIds = $featuredEvents->pluck('id');
        $upcomingEvents = Event::approved()
            ->upcoming()
            ->whereNotIn('id', $featuredIds)
            ->with('club:id,name,slug')
            ->orderBy('start_datetime')
            ->limit(6)
            ->get()
            ->transform(function (Event $event) {
                $event->cover_url = $event->getFirstMediaUrl('cover');
                $event->formatted_fee = $event->is_paid ? $event->formattedFee() : 'Free';
                $event->registered_count = $event->registrations()->count();
                return $event;
            });

        // Top 8 active clubs by active member count
        $topClubs = Club::active()
            ->withCount(['memberships as active_members_count' => fn ($q) => $q->where('status', MembershipStatus::Active)])
            ->orderByDesc('active_members_count')
            ->limit(8)
            ->get()
            ->transform(function (Club $club) {
                $club->logo_url = $club->getFirstMediaUrl('logo');
                return $club;
            });

        $stats = [
            'total_events'   => Event::approved()->count(),
            'active_clubs'   => Club::active()->count(),
            'total_students' => User::count(),
        ];

        // Top 5 leaderboard entries from student_points table
        $leaderboard = collect();
        if (DB::getSchemaBuilder()->hasTable('student_points')) {
            $rows = DB::table('student_points')
                ->select('user_id', DB::raw('SUM(points) as total_points'))
                ->groupBy('user_id')
                ->orderByDesc('total_points')
                ->take(5)
                ->get();

            $userIds = $rows->pluck('user_id');
            $users = User::whereIn('id', $userIds)
                ->get(['id', 'name', 'avatar', 'department'])
                ->keyBy('id');

            $leaderboard = $rows->map(fn($row) => [
                'user'         => isset($users[$row->user_id]) ? [
                    'name'       => $users[$row->user_id]->name,
                    'avatar'     => $users[$row->user_id]->avatar ?? null,
                    'department' => $users[$row->user_id]->department ?? null,
                ] : null,
                'total_points' => (int) $row->total_points,
            ])->filter(fn($r) => $r['user'] !== null)->values();
        }

        // Site settings keyed by key
        $settings = SiteSetting::all()->keyBy('key');

        return Inertia::render('welcome', [
            'featuredEvents' => $featuredEvents,
            'upcomingEvents' => $upcomingEvents,
            'topClubs'       => $topClubs,
            'stats'          => $stats,
            'leaderboard'    => $leaderboard,
            'settings'       => $settings,
            'canLogin'       => true,
        ]);
    }
}
