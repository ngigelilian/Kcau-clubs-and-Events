<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ClubStatus;
use App\Enums\EventStatus;
use App\Enums\MerchandiseStatus;
use App\Enums\MembershipStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stats = [
            'totalUsers'     => User::count(),
            'activeClubs'    => Club::where('status', ClubStatus::Active)->count(),
            'pendingClubs'   => Club::where('status', ClubStatus::Pending)->count(),
            'upcomingEvents' => Event::where('status', EventStatus::Approved)->where('start_datetime', '>', now())->count(),
            'pendingEvents'  => Event::where('status', EventStatus::Pending)->count(),
            'openTickets'    => Ticket::whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])->count(),
            'totalRevenue'   => Payment::where('status', PaymentStatus::Completed)->sum('amount'),
            'pendingOrders'  => Order::where('status', OrderStatus::Pending)->count(),
            'newUsersToday'  => User::whereDate('created_at', today())->count(),
            'newUsersWeek'   => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        $pendingClubs = Club::where('status', ClubStatus::Pending)
            ->with('creator:id,name')
            ->latest()->limit(6)->get(['id', 'name', 'slug', 'category', 'created_at', 'created_by']);

        $pendingEvents = Event::where('status', EventStatus::Pending)
            ->with(['club:id,name', 'creator:id,name'])
            ->latest()->limit(6)->get(['id', 'title', 'slug', 'venue', 'start_datetime', 'created_at', 'club_id', 'created_by']);

        $recentUsers = User::latest()->limit(8)
            ->get(['id', 'name', 'email', 'created_at', 'is_active']);

        $openTickets = Ticket::whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])
            ->with('user:id,name')
            ->orderByRaw("CASE status WHEN 'open' THEN 0 ELSE 1 END")
            ->latest()->limit(6)
            ->get(['id', 'subject', 'status', 'priority', 'user_id', 'created_at']);

        // Revenue last 7 days
        $revenueByDay = Payment::where('status', PaymentStatus::Completed)
            ->where('paid_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(paid_at) as date, SUM(amount) as total')
            ->groupBy('date')->orderBy('date')->get();

        return Inertia::render('admin/dashboard', [
            'stats'        => $stats,
            'pendingClubs' => $pendingClubs,
            'pendingEvents' => $pendingEvents,
            'recentUsers'  => $recentUsers,
            'openTickets'  => $openTickets,
            'revenueByDay' => $revenueByDay,
        ]);
    }
}
