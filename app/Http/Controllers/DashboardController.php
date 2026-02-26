<?php

namespace App\Http\Controllers;

use App\Enums\ClubStatus;
use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Enums\OrderStatus;
use App\Enums\RegistrationStatus;
use App\Enums\TicketStatus;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->hasRole(['admin', 'super-admin']);

        if ($isAdmin) {
            return $this->adminDashboard($user);
        }

        return $this->studentDashboard($user);
    }

    private function studentDashboard(User $user): Response
    {
        // My clubs
        $myClubs = Club::active()
            ->whereHas('memberships', fn ($q) => $q->where('user_id', $user->id)->where('status', MembershipStatus::Active))
            ->withCount(['memberships as active_members_count' => fn ($q) => $q->where('status', MembershipStatus::Active)])
            ->limit(6)
            ->get();

        $myClubs->transform(function (Club $club) {
            $club->logo_url = $club->getFirstMediaUrl('logo');
            return $club;
        });

        // Upcoming events I'm registered for
        $myUpcomingEvents = Event::query()
            ->whereHas('registrations', fn ($q) => $q->where('user_id', $user->id)->where('status', RegistrationStatus::Registered))
            ->where('status', EventStatus::Approved)
            ->where('start_datetime', '>', now())
            ->orderBy('start_datetime')
            ->limit(5)
            ->get(['id', 'title', 'slug', 'venue', 'start_datetime', 'end_datetime']);

        // All upcoming events
        $upcomingEvents = Event::approved()
            ->upcoming()
            ->with('club:id,name')
            ->orderBy('start_datetime')
            ->limit(6)
            ->get();

        $upcomingEvents->transform(function (Event $event) {
            $event->cover_url = $event->getFirstMediaUrl('cover');
            $event->formatted_fee = $event->is_paid ? $event->formattedFee() : 'Free';
            return $event;
        });

        // My orders
        $myOrders = Order::where('user_id', $user->id)
            ->with('orderable')
            ->latest()
            ->limit(5)
            ->get();

        // Recent announcements
        $clubIds = $user->clubMemberships()->where('status', 'active')->pluck('club_id');
        $announcements = Announcement::published()
            ->where(fn ($q) => $q->whereNull('club_id')->orWhereIn('club_id', $clubIds))
            ->latest('published_at')
            ->limit(5)
            ->get(['id', 'title', 'club_id', 'published_at']);

        // My open tickets
        $openTickets = Ticket::where('user_id', $user->id)
            ->whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])
            ->count();

        return Inertia::render('dashboard', [
            'isAdmin' => false,
            'stats' => [
                'clubsJoined' => $myClubs->count(),
                'eventsRegistered' => $user->eventRegistrations()->where('status', RegistrationStatus::Registered)->count(),
                'eventsAttended' => $user->eventRegistrations()->where('status', RegistrationStatus::Attended)->count(),
                'openTickets' => $openTickets,
            ],
            'myClubs' => $myClubs,
            'myUpcomingEvents' => $myUpcomingEvents,
            'upcomingEvents' => $upcomingEvents,
            'myOrders' => $myOrders,
            'announcements' => $announcements,
        ]);
    }

    private function adminDashboard(User $user): Response
    {
        $stats = [
            'totalUsers' => User::count(),
            'activeClubs' => Club::where('status', ClubStatus::Active)->count(),
            'pendingClubs' => Club::where('status', ClubStatus::Pending)->count(),
            'upcomingEvents' => Event::where('status', EventStatus::Approved)->where('start_datetime', '>', now())->count(),
            'pendingEvents' => Event::where('status', EventStatus::Pending)->count(),
            'totalOrders' => Order::count(),
            'totalRevenue' => Payment::completed()->sum('amount'),
            'openTickets' => Ticket::whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])->count(),
        ];

        $recentUsers = User::latest()->limit(5)->get(['id', 'name', 'email', 'created_at']);

        $pendingClubs = Club::where('status', ClubStatus::Pending)
            ->with('creator:id,name')
            ->latest()
            ->limit(5)
            ->get();

        $pendingEvents = Event::where('status', EventStatus::Pending)
            ->with(['club:id,name', 'creator:id,name'])
            ->latest()
            ->limit(5)
            ->get();

        $recentOrders = Order::with(['user:id,name', 'orderable'])
            ->latest()
            ->limit(5)
            ->get();

        $announcements = Announcement::published()
            ->latest('published_at')
            ->limit(5)
            ->get(['id', 'title', 'club_id', 'published_at']);

        return Inertia::render('dashboard', [
            'isAdmin' => true,
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'pendingClubs' => $pendingClubs,
            'pendingEvents' => $pendingEvents,
            'recentOrders' => $recentOrders,
            'announcements' => $announcements,
        ]);
    }
}
