<?php

namespace App\Http\Controllers\Admin;

use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventApprovalController extends Controller
{
    public function __construct(
        private readonly EventService $eventService,
    ) {}

    public function index(Request $request): Response
    {
        $query = Event::query()
            ->with(['club:id,name,slug', 'creator:id,name,email'])
            ->withCount(['registrations as registered_count' => fn ($q) => $q->where('status', '!=', RegistrationStatus::Cancelled)]);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->search($search);
        }

        $events = $query->latest()->paginate(15)->withQueryString();

        $events->getCollection()->transform(function (Event $event) {
            $event->cover_url = $event->getFirstMediaUrl('cover');
            return $event;
        });

        $statusCounts = [
            'all' => Event::count(),
            'pending' => Event::where('status', EventStatus::Pending)->count(),
            'approved' => Event::where('status', EventStatus::Approved)->count(),
            'completed' => Event::where('status', EventStatus::Completed)->count(),
            'cancelled' => Event::where('status', EventStatus::Cancelled)->count(),
        ];

        return Inertia::render('admin/events/index', [
            'events' => $events,
            'filters' => [
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
            ],
            'statusCounts' => $statusCounts,
        ]);
    }

    public function show(Event $event): Response
    {
        $event->load([
            'club:id,name,slug',
            'creator:id,name,email,student_id',
            'approver:id,name',
            'registrations' => fn ($q) => $q->with('user:id,name,email,student_id'),
        ]);

        $event->cover_url = $event->getFirstMediaUrl('cover');
        $event->formatted_fee = $event->is_paid ? $event->formattedFee() : 'Free';
        $event->available_spots = $event->availableSpots();

        return Inertia::render('admin/events/show', [
            'event' => $event,
        ]);
    }

    public function approve(Event $event)
    {
        $this->authorize('approve', $event);

        if ($event->status !== EventStatus::Pending) {
            return back()->with('error', 'Only pending events can be approved.');
        }

        $this->eventService->approveEvent($event, auth()->user());

        return back()->with('success', "Event '{$event->title}' has been approved.");
    }

    public function reject(Request $request, Event $event)
    {
        $this->authorize('approve', $event);

        if ($event->status !== EventStatus::Pending) {
            return back()->with('error', 'Only pending events can be rejected.');
        }

        $request->validate(['reason' => ['nullable', 'string', 'max:1000']]);

        $this->eventService->rejectEvent($event, auth()->user(), $request->input('reason'));

        return back()->with('success', "Event '{$event->title}' has been rejected.");
    }

    public function cancel(Request $request, Event $event)
    {
        $this->authorize('cancel', $event);

        $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        $this->eventService->cancelEvent($event, auth()->user(), $request->input('reason'));

        return back()->with('success', "Event '{$event->title}' has been cancelled.");
    }

    public function complete(Event $event)
    {
        if ($event->status !== EventStatus::Approved) {
            return back()->with('error', 'Only approved events can be marked as completed.');
        }

        $this->eventService->completeEvent($event, auth()->user());

        return back()->with('success', "Event '{$event->title}' has been marked as completed.");
    }
}
