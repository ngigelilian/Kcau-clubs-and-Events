<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Enums\RegistrationStatus;
use App\Http\Requests\Event\StoreEventRequest;
use App\Http\Requests\Event\UpdateEventRequest;
use App\Http\Requests\Payment\InitiateEventRegistrationRequest;
use App\Models\Club;
use App\Models\Event;
use App\Services\EventService;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function __construct(
        private readonly EventService $eventService,
        private readonly PaymentService $paymentService,
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

    public function show(Request $request, Event $event): Response
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
        if ($user = $request->user()) {
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
            'canCreateSchoolEvents' => $user->hasRole(['admin', 'super-admin']),
            'eventTypes' => collect(EventType::cases())->map(fn (EventType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function store(StoreEventRequest $request)
    {
        $data = $request->validated();

        $event = $this->eventService->createEvent(
            $data,
            $request->user(),
        );

        $wasSubmitted = (bool) ($data['submit_for_approval'] ?? false);

        return to_route('events.show', $event)
            ->with('success', $wasSubmitted
                ? 'Event submitted for approval. An admin will review it before publishing.'
                : 'Draft saved successfully. You can submit it for approval when ready.');
    }

    public function edit(Request $request, Event $event): Response
    {
        $this->authorize('update', $event);

        /** @var \App\Models\User $user */
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

        $event->cover_url = $event->getFirstMediaUrl('cover');

        return Inertia::render('events/edit', [
            'event' => $event,
            'clubs' => $clubs,
            'canCreateSchoolEvents' => $user->hasRole(['admin', 'super-admin']),
            'eventTypes' => collect(EventType::cases())->map(fn (EventType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event)
    {
        $data = $request->validated();
        $this->eventService->updateEvent($event, $data, $request->user());

        $wasSubmitted = (bool) ($data['submit_for_approval'] ?? false);

        return to_route('events.show', $event)
            ->with('success', $wasSubmitted
                ? 'Event submitted for approval.'
                : 'Draft updated successfully.');
    }

    public function register(InitiateEventRegistrationRequest $request, Event $event)
    {
        $this->authorize('register', $event);

        try {
            if (! $event->is_paid) {
                $this->eventService->registerUser($event, $request->user());

                return back()->with('success', 'You have been registered for this event!');
            }

            $payment = $this->paymentService->initiateEventRegistration(
                $event,
                $request->user(),
                $request->validated('phone_number'),
            );

            return back()->with('success', 'M-Pesa prompt sent. Complete payment on your phone to confirm your registration.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function cancelRegistration(Event $event)
    {
        try {
            $user = request()->user();
            if (! $user) {
                throw new \RuntimeException('You must be logged in to cancel registration.');
            }

            $this->eventService->cancelRegistration($event, $user);
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
