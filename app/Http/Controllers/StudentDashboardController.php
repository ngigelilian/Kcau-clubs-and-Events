<?php
namespace App\Http\Controllers;
use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\ClubMembership;
use App\Models\StudentPoint;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StudentDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        // Today's events the user is registered for
        $todayEvents = EventRegistration::where('user_id', $user->id)
            ->whereHas('event', fn($q) => $q->whereDate('start_datetime', Carbon::today()))
            ->with(['event' => fn($q) => $q->with('club:id,name,slug')])
            ->get()
            ->map(fn($r) => $r->event);

        // Upcoming registrations (next 5)
        $upcomingRegistrations = EventRegistration::where('user_id', $user->id)
            ->where('status', '!=', RegistrationStatus::Cancelled)
            ->where('is_waitlisted', false)
            ->whereHas('event', fn($q) => $q->where('start_datetime', '>', now()))
            ->with(['event' => fn($q) => $q->with('club:id,name,slug')])
            ->orderBy('registered_at')
            ->take(5)
            ->get();

        // My clubs
        $myClubs = ClubMembership::where('user_id', $user->id)
            ->where('status', 'active')
            ->with('club')
            ->take(6)
            ->get();

        // Total points
        $totalPoints = StudentPoint::where('user_id', $user->id)->sum('points');

        // User rank by points
        $rank = \DB::table('student_points')
            ->select('user_id', \DB::raw('SUM(points) as total'))
            ->groupBy('user_id')
            ->havingRaw('SUM(points) > ?', [$totalPoints])
            ->count() + 1;

        // Recent announcements
        $announcements = Announcement::whereNotNull('published_at')
            ->latest('published_at')
            ->take(4)
            ->get();

        // Recommended events (events from clubs user is in + school events, not already registered)
        $clubIds = $myClubs->pluck('club_id');
        $registeredEventIds = EventRegistration::where('user_id', $user->id)->pluck('event_id');
        $recommended = Event::upcoming()
            ->whereNotIn('id', $registeredEventIds)
            ->where(fn($q) => $q->whereIn('club_id', $clubIds)->orWhereNull('club_id'))
            ->with('club:id,name,slug')
            ->take(4)
            ->get()
            ->map(fn($e) => tap($e, fn($e) => $e->cover_url = $e->getFirstMediaUrl('cover')));

        // Stats
        $stats = [
            'events_attended' => EventRegistration::where('user_id', $user->id)->where('status', RegistrationStatus::Attended)->count(),
            'clubs_joined' => $myClubs->count(),
            'points' => $totalPoints,
            'rank' => $rank,
        ];

        return inertia('student/dashboard', compact('todayEvents', 'upcomingRegistrations', 'myClubs', 'stats', 'announcements', 'recommended'));
    }
}
