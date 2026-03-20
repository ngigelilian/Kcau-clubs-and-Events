<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends \App\Http\Controllers\Controller
{
    /**
     * Display the ticket queue for admin management.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Ticket::class);

        $query = Ticket::query()
            ->with(['user:id,name,email,avatar', 'assignee:id,name,avatar'])
            ->withCount('replies');

        // Apply filters
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        if ($assignedTo = $request->input('assigned_to')) {
            if ($assignedTo === 'unassigned') {
                $query->whereNull('assigned_to');
            } else {
                $query->where('assigned_to', $assignedTo);
            }
        }

        if ($search = $request->input('search')) {
                        $likeOperator = DB::connection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

                        $query->where(function ($q) use ($search, $likeOperator) {
                                $q->where('subject', $likeOperator, "%{$search}%")
                                    ->orWhere('description', $likeOperator, "%{$search}%")
                                    ->orWhereHas('user', fn ($u) => $u->where('name', $likeOperator, "%{$search}%"));
            });
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        // Mark overdue tickets using a cross-database boolean expression.
        $query->addSelect([
            'is_overdue' => DB::raw("CASE WHEN created_at < '".now()->subHours(48)->toDateTimeString()."' AND status IN ('open','in_progress') THEN 1 ELSE 0 END"),
        ]);

        // Sort by priority, then by oldest first
        $tickets = $query
            ->orderBy('priority', 'desc')
            ->orderBy('created_at')
            ->paginate(20)
            ->withQueryString();

        $statusCounts = [
            'total' => Ticket::query()->count(),
            'open' => Ticket::query()->where('status', TicketStatus::Open)->count(),
            'in_progress' => Ticket::query()->where('status', TicketStatus::InProgress)->count(),
            'resolved' => Ticket::query()->where('status', TicketStatus::Resolved)->count(),
            'closed' => Ticket::query()->where('status', TicketStatus::Closed)->count(),
            'overdue' => Ticket::query()
                ->whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])
                ->where('created_at', '<', now()->subHours(48))
                ->count(),
        ];

        $adminUsers = User::role(['admin', 'super-admin'])
            ->where('is_active', true)
            ->get(['id', 'name']);

        return Inertia::render('admin/tickets/index', [
            'tickets' => $tickets,
            'filters' => [
                'status' => $request->input('status', ''),
                'priority' => $request->input('priority', ''),
                'assigned_to' => $request->input('assigned_to', ''),
                'search' => $request->input('search', ''),
                'date_from' => $request->input('date_from', ''),
                'date_to' => $request->input('date_to', ''),
            ],
            'statusCounts' => $statusCounts,
            'adminUsers' => $adminUsers,
            'priorities' => collect(TicketPriority::cases())->map(fn (TicketPriority $p) => [
                'value' => $p->value,
                'label' => $p->label(),
            ]),
            'statuses' => collect(TicketStatus::cases())->map(fn (TicketStatus $s) => [
                'value' => $s->value,
                'label' => match ($s) {
                    TicketStatus::Open => 'Open',
                    TicketStatus::InProgress => 'In Progress',
                    TicketStatus::Resolved => 'Resolved',
                    TicketStatus::Closed => 'Closed',
                },
            ]),
        ]);
    }

    /**
     * Display a specific ticket in admin view.
     */
    public function show(Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);

        $ticket->load([
            'user:id,name,email,avatar',
            'assignee:id,name,avatar',
            'replies' => fn ($q) => $q->with('user:id,name,avatar')->orderBy('created_at'),
        ]);

        $adminUsers = User::role(['admin', 'super-admin'])
            ->where('is_active', true)
            ->get(['id', 'name']);

        // Check if overdue
        $isOverdue = $ticket->created_at->diffInHours(now()) > 48 && 
                     in_array($ticket->status, [TicketStatus::Open, TicketStatus::InProgress]);

        return Inertia::render('admin/tickets/show', [
            'ticket' => $ticket,
            'adminUsers' => $adminUsers,
            'isOverdue' => $isOverdue,
        ]);
    }
}
