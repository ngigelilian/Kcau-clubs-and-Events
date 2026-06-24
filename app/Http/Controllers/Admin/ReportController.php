<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ClubStatus;
use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\RegistrationStatus;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $range = $request->input('range', '30'); // days

        $since = now()->subDays((int) $range);

        // Revenue over time (daily for selected range)
        $revenueByDay = Payment::where('status', PaymentStatus::Completed)
            ->where('paid_at', '>=', $since)
            ->selectRaw('DATE(paid_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // New users by day
        $usersByDay = User::where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Club stats
        $clubStats = [
            'total' => Club::count(),
            'active' => Club::where('status', ClubStatus::Active)->count(),
            'pending' => Club::where('status', ClubStatus::Pending)->count(),
            'new_this_period' => Club::where('created_at', '>=', $since)->count(),
        ];

        // Event stats
        $eventStats = [
            'total' => Event::count(),
            'approved' => Event::where('status', EventStatus::Approved)->count(),
            'completed' => Event::where('status', EventStatus::Completed)->count(),
            'registrations' => \App\Models\EventRegistration::where('status', RegistrationStatus::Registered)->count(),
            'attended' => \App\Models\EventRegistration::where('status', RegistrationStatus::Attended)->count(),
        ];

        // Payment stats
        $paymentStats = [
            'total_revenue' => Payment::where('status', PaymentStatus::Completed)->sum('amount'),
            'this_period' => Payment::where('status', PaymentStatus::Completed)->where('paid_at', '>=', $since)->sum('amount'),
            'total_orders' => Order::count(),
            'fulfilled_orders' => Order::where('status', OrderStatus::Fulfilled)->count(),
        ];

        // Support stats
        $ticketStats = [
            'open' => Ticket::whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])->count(),
            'resolved' => Ticket::where('status', TicketStatus::Resolved)->count(),
            'this_period' => Ticket::where('created_at', '>=', $since)->count(),
        ];

        // Top clubs by membership
        $topClubs = Club::where('status', ClubStatus::Active)
            ->withCount(['memberships as members_count' => fn ($q) => $q->where('status', MembershipStatus::Active)])
            ->orderByDesc('members_count')
            ->limit(5)
            ->get(['id', 'name', 'category']);

        // Top events by registrations
        $topEvents = Event::withCount(['registrations as reg_count' => fn ($q) => $q->where('status', '!=', RegistrationStatus::Cancelled)])
            ->orderByDesc('reg_count')
            ->limit(5)
            ->get(['id', 'title', 'status', 'start_datetime']);

        return Inertia::render('admin/reports/index', [
            'range' => $range,
            'revenueByDay' => $revenueByDay,
            'usersByDay' => $usersByDay,
            'clubStats' => $clubStats,
            'eventStats' => $eventStats,
            'paymentStats' => $paymentStats,
            'ticketStats' => $ticketStats,
            'topClubs' => $topClubs,
            'topEvents' => $topEvents,
            'userCount' => User::count(),
        ]);
    }
}
