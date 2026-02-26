<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Enums\RegistrationStatus;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Models\Club;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function __construct(
        private readonly EventService $eventService,
    ) {}

    public function index(Request $request): Response
    {
        $query = Event::query()
            ->with(['club:id,name,slug', 'creator:id,name'])
            ->where('status', EventStatus::Approved)
            ->withCount(['registrations as registered_count' => fn ($q) => $q->where('status', '!=', RegistrationStatus::Cancelled)]);

        if ($search = $request->input('search')) {
            $query->search($search);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($request->input('filter') === 'past') {
            $query->past()->orderByDesc('start_datetime');
        } else {
            $query->upcoming()->orderBy('start_datetime');
        }

        $events = $query->paginate(12)->withQueryString();

        $events->getCollection()->transform(function (Event $event) {
            $event->cover_url = $event->getFirstMediaUrl('cover');
            $event->formatted_fee = $event->is_paid ? $event->formattedFee() : 'Free';
            return $event;
        });

        return Inertia::render('events/index', [
            'events' => $events,
            'filters' => [
                'search' => $request->input('search', ''),
                'type' => $request->input('type', ''),
                'filter' => $request->input('filter', 'upcoming'),
            ],
            'eventTypes' => collect(EventType::cases())->map(fn (EventType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function show(Event $event): Response
    {
        $this->authorize('view', $event);

        $event->load([
            'club:id,name,slug',
            'creator:id,name,avatar',
            'registrations' => fn ($q) => $q->with('user:id,name,avatar,student_id')
                ->where('status', '!=', RegistrationStatus::Cancelled)
                ->latest(),
        ]);

        $event->cover_url = $event->getFirstMediaUrl('cover');
        $event->formatted_fee = $event->is_paid ? $event->formattedFee() : 'Free';
        $event->available_spots = $event->availableSpots();
        $event->is_registration_open = $event->isRegistrationOpen();

        $userRegistration = null;
        if ($user = auth()->user()) {
            $userRegistration = $event->registrations()
                ->where('user_id', $user->id)
                ->where('status', '!=', RegistrationStatus::Cancelled)
                ->first();
        }

        return Inertia::render('events/show', [
            'event' => $event,
            'userRegistration' => $userRegistration,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', Event::class);

        $user = $request->user();
        $clubs = [];

        if ($user->hasRole(['admin', 'super-admin'])) {
            $clubs = Club::active()->orderBy('name')->get(['id', 'name']);
        } else {
            $clubs = Club::active()
                ->whereHas('memberships', fn ($q) => $q->where('user_id', $user->id)
                    ->whereIn('role', [MembershipRole::Leader, MembershipRole::CoLeader])
                    ->where('status', MembershipStatus::Active))
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Inertia::render('events/create', [
            'clubs' => $clubs,
            'eventTypes' => collect(EventType::cases())->map(fn (EventType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function store(StoreEventRequest $request)
    {
        $event = $this->eventService->createEvent(
            $request->validated(),
            $request->user(),
        );

        return to_route('events.show', $event)
            ->with('success', 'Event created! It will be reviewed by an admin before publishing.');
    }

    public function edit(Event $event): Response
    {
        $this->authorize('update', $event);

        $user = auth()->user();
        $clubs = [];

        if ($user->hasRole(['admin', 'super-admin'])) {
            $clubs = Club::active()->orderBy('name')->get(['id', 'name']);
        } else {
            $clubs = Club::active()
                ->whereHas('memberships', fn ($q) => $q->where('user_id', $user->id)
                    ->whereIn('role', [MembershipRole::Leader, MembershipRole::CoLeader])
                    ->where('status', MembershipStatus::Active))
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        $event->cover_url = $event->getFirstMediaUrl('cover');

        return Inertia::render('events/edit', [
            'event' => $event,
            'clubs' => $clubs,
            'eventTypes' => collect(EventType::cases())->map(fn (EventType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event)
    {
        $this->eventService->updateEvent($event, $request->validated());

        return to_route('events.show', $event)
            ->with('success', 'Event updated successfully.');
    }

    public function register(Event $event)
    {
        $this->authorize('register', $event);

        try {
            $this->eventService->registerUser($event, auth()->user());
            return back()->with('success', 'You have been registered for this event!');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function cancelRegistration(Event $event)
    {
        try {
            $this->eventService->cancelRegistration($event, auth()->user());
            return back()->with('success', 'Your registration has been cancelled.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function attendees(Event $event): Response
    {
        $this->authorize('markAttendance', $event);

        $event->load('club:id,name,slug');

        $registrations = $event->registrations()
            ->with('user:id,name,email,avatar,student_id')
            ->where('status', '!=', RegistrationStatus::Cancelled)
            ->orderByRaw("CASE WHEN status = 'attended' THEN 0 ELSE 1 END")
            ->orderBy('registered_at')
            ->paginate(30);

        return Inertia::render('events/attendees', [
            'event' => $event,
            'registrations' => $registrations,
        ]);
    }

    public function markAttendance(Event $event, int $userId)
    {
        $this->authorize('markAttendance', $event);

        $this->eventService->markAttendance($event, $userId);

        return back()->with('success', 'Attendance marked successfully.');
    }
}
