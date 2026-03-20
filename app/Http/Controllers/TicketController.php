<?php

namespace App\Http\Controllers;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Notifications\TicketReplyNotification;
use App\Notifications\TicketStatusChangeNotification;
use App\Notifications\TicketAssignmentNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isAdmin = $user->hasRole(['admin', 'super-admin']);

        $query = Ticket::query()
            ->with(['user:id,name,email,avatar', 'assignee:id,name,avatar'])
            ->withCount('replies');

        if (! $isAdmin) {
            $query->where('user_id', $user->id);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        $tickets = $query->latest()->paginate(15)->withQueryString();

        $statusCounts = Ticket::query()
            ->when(! $isAdmin, fn ($q) => $q->where('user_id', $user->id))
            ->selectRaw("COUNT(*) as total")
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'open') as open")
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress")
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'resolved') as resolved")
            ->selectRaw("COUNT(*) FILTER (WHERE status = 'closed') as closed")
            ->first();

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'filters' => [
                'status' => $request->input('status', ''),
                'priority' => $request->input('priority', ''),
                'search' => $request->input('search', ''),
            ],
            'statusCounts' => $statusCounts,
            'priorities' => collect(TicketPriority::cases())->map(fn (TicketPriority $p) => [
                'value' => $p->value,
                'label' => $p->label(),
            ]),
            'isAdmin' => $isAdmin,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Ticket::class);

        return Inertia::render('tickets/create', [
            'priorities' => collect(TicketPriority::cases())->map(fn (TicketPriority $p) => [
                'value' => $p->value,
                'label' => $p->label(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Ticket::class);

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:20', 'max:10000'],
            'priority' => ['required', 'string', \Illuminate\Validation\Rule::enum(TicketPriority::class)],
        ]);

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => TicketStatus::Open,
        ]);

        return to_route('tickets.show', $ticket)
            ->with('success', 'Support ticket submitted successfully.');
    }

    public function show(Request $request, Ticket $ticket): Response
    {
        $this->authorize('view', $ticket);

        $ticket->load([
            'user:id,name,email,avatar',
            'assignee:id,name,avatar',
            'replies' => fn ($q) => $q->with('user:id,name,avatar')->orderBy('created_at'),
        ]);

        $isAdmin = $request->user()->hasRole(['admin', 'super-admin']);

        $adminUsers = [];
        if ($isAdmin) {
            $adminUsers = \App\Models\User::role(['admin', 'super-admin'])
                ->where('is_active', true)
                ->get(['id', 'name']);
        }

        return Inertia::render('tickets/show', [
            'ticket' => $ticket,
            'isAdmin' => $isAdmin,
            'adminUsers' => $adminUsers,
        ]);
    }

    public function reply(Request $request, Ticket $ticket)
    {
        $this->authorize('reply', $ticket);

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:2', 'max:10000'],
        ]);

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        // Auto-update status if admin replies to open ticket
        if ($ticket->status === TicketStatus::Open && $request->user()->hasRole(['admin', 'super-admin'])) {
            $ticket->update([
                'status' => TicketStatus::InProgress,
                'assigned_to' => $ticket->assigned_to ?? $request->user()->id,
            ]);
        }

        // Notify the other party
        $reply->load('user');
        if ($request->user()->hasRole(['admin', 'super-admin'])) {
            $ticket->user->notify(new TicketReplyNotification($ticket, $reply));
        } else {
            if ($ticket->assignee) {
                $ticket->assignee->notify(new TicketReplyNotification($ticket, $reply));
            }
        }

        return back()->with('success', 'Reply posted.');
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $this->authorize('assign', $ticket);

        $validated = $request->validate([
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $oldAssignee = $ticket->assigned_to;
        $ticket->update([
            'assigned_to' => $validated['assigned_to'] ?? null,
            'status' => $ticket->status === TicketStatus::Open ? TicketStatus::InProgress : $ticket->status,
        ]);

        // Notify the newly assigned admin
        if ($ticket->assigned_to && $oldAssignee !== $ticket->assigned_to) {
            $assignee = $ticket->assignee;
            if ($assignee) {
                $assignee->notify(new TicketAssignmentNotification($ticket, $request->user()->name));
            }
        }

        return back()->with('success', 'Ticket assigned successfully.');
    }

    public function resolve(Ticket $ticket)
    {
        $this->authorize('resolve', $ticket);

        $oldStatus = $ticket->status;
        $ticket->update([
            'status' => TicketStatus::Resolved,
            'resolved_at' => now(),
        ]);

        // Notify ticket submitter
        if ($oldStatus !== TicketStatus::Resolved) {
            $ticket->user->notify(new TicketStatusChangeNotification($ticket, $oldStatus->value, TicketStatus::Resolved->value));
        }

        return back()->with('success', 'Ticket marked as resolved.');
    }

    public function close(Ticket $ticket)
    {
        $this->authorize('close', $ticket);

        $oldStatus = $ticket->status;
        $ticket->update([
            'status' => TicketStatus::Closed,
            'closed_at' => now(),
        ]);

        // Notify ticket submitter
        if ($oldStatus !== TicketStatus::Closed) {
            $ticket->user->notify(new TicketStatusChangeNotification($ticket, $oldStatus->value, TicketStatus::Closed->value));
        }

        return back()->with('success', 'Ticket closed.');
    }
}
