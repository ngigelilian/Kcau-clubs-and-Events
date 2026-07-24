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
use App\Models\EventFeedback;
use App\Models\EventRegistration;
use App\Services\EventService;
use App\Services\PaymentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
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
        $userFeedback = null;
        if ($user = $request->user()) {
            $userRegistration = $event->registrations()
                ->where('user_id', $user->id)
                ->where('status', '!=', RegistrationStatus::Cancelled)
                ->first();
            $userFeedback = $event->feedback()->where('user_id', $user->id)->first();
        }

        $sessions = $event->sessions()->orderBy('sort_order')->orderBy('start_time')->get();

        $feedbackQuery = $event->feedback();
        $totalFeedback = $feedbackQuery->count();
        $feedbackStats = [
            'avg_rating'              => round($event->feedback()->avg('rating') ?? 0, 1),
            'total_feedback'          => $totalFeedback,
            'would_recommend_percent' => $totalFeedback > 0
                ? round($event->feedback()->where('would_recommend', true)->count() / $totalFeedback * 100)
                : 0,
        ];

        $recentFeedback = $event->feedback()->with('user:id,name,avatar')->latest()->take(10)->get();

        $waitlistCount   = $event->registrations()->where('is_waitlisted', true)->count();
        $registeredCount = $event->registrations()
            ->where('status', '!=', 'cancelled')
            ->where('is_waitlisted', false)
            ->count();

        // Related events: 4 upcoming approved events from same club (or school), excluding this one
        $relatedQuery = Event::query()
            ->upcoming()
            ->where('id', '!=', $event->id)
            ->with('club:id,name,slug')
            ->withCount(['registrations as registered_count' => fn ($q) => $q->where('status', '!=', RegistrationStatus::Cancelled)])
            ->orderBy('start_datetime')
            ->limit(4);

        if ($event->club_id) {
            $relatedQuery->where('club_id', $event->club_id);
        } else {
            $relatedQuery->whereNull('club_id');
        }

        $relatedEvents = $relatedQuery->get()->map(function (Event $e) {
            $e->cover_url = $e->getFirstMediaUrl('cover');
            return $e;
        });

        return Inertia::render('events/show', [
            'event'          => $event,
            'userRegistration' => $userRegistration,
            'sessions'       => $sessions,
            'feedback_stats' => $feedbackStats,
            'waitlist_count' => $waitlistCount,
            'registered_count' => $registeredCount,
            'user_feedback'  => $userFeedback,
            'recent_feedback' => $recentFeedback,
            'relatedEvents'  => $relatedEvents,
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
                    ->whereIn('role', MembershipRole::leadershipRoles())
                    ->where('status', MembershipStatus::Active))
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        return Inertia::render('events/create', [
            'clubs' => $clubs,
            'canCreateSchoolEvents' => $user->hasRole(['admin', 'super-admin'])
                || $user->clubMemberships()->leaders()->active()->exists(),
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

        return to_route('events.show', $event)
            ->with('success', match ($event->status) {
                \App\Enums\EventStatus::Approved => 'Event published! It is now live for students to see.',
                \App\Enums\EventStatus::Pending => 'Event submitted for approval. An admin will review it before publishing.',
                default => 'Draft saved successfully. You can publish it or submit it for approval when ready.',
            });
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
                    ->whereIn('role', MembershipRole::leadershipRoles())
                    ->where('status', MembershipStatus::Active))
                ->orderBy('name')
                ->get(['id', 'name']);
        }

        $event->cover_url = $event->getFirstMediaUrl('cover');

        return Inertia::render('events/edit', [
            'event' => $event,
            'clubs' => $clubs,
            'canCreateSchoolEvents' => $user->hasRole(['admin', 'super-admin'])
                || $user->clubMemberships()->leaders()->active()->exists(),
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
        $event->refresh();

        return to_route('events.show', $event)
            ->with('success', match ($event->status) {
                \App\Enums\EventStatus::Approved => 'Event published! It is now live for students to see.',
                \App\Enums\EventStatus::Pending => 'Event submitted for approval.',
                default => 'Draft updated successfully.',
            });
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

    public function submitFeedback(Request $request, Event $event)
    {
        $user = $request->user();

        $request->validate([
            'rating'           => 'required|integer|between:1,5',
            'comment'          => 'nullable|string|max:1000',
            'would_recommend'  => 'boolean',
        ]);

        // Gate: user must have attended the event and the event must have ended
        $hasAttended = $event->registrations()
            ->where('user_id', $user->id)
            ->where('status', RegistrationStatus::Attended)
            ->exists();

        if (! $hasAttended || $event->end_datetime->greaterThan(Carbon::now())) {
            return back()->with('error', 'You can only leave feedback for events you attended after they have ended.');
        }

        EventFeedback::updateOrCreate(
            ['event_id' => $event->id, 'user_id' => $user->id],
            $request->only(['rating', 'comment', 'would_recommend'])
        );

        return back()->with('success', 'Thank you for your feedback!');
    }

    public function checkIn(Request $request, Event $event, string $token): JsonResponse
    {
        $reg = EventRegistration::where('check_in_token', $token)
            ->where('event_id', $event->id)
            ->with('user:id,name')
            ->first();

        if (! $reg) {
            return response()->json(['success' => false, 'message' => 'Invalid QR code'], 404);
        }

        if ($reg->status === RegistrationStatus::Attended) {
            return response()->json([
                'success' => false,
                'message' => 'Already checked in',
                'name'    => $reg->user->name,
            ]);
        }

        $reg->update([
            'status'        => RegistrationStatus::Attended,
            'checked_in_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checked in successfully!',
            'name'    => $reg->user->name,
        ]);
    }

    public function exportAttendees(Event $event)
    {
        $this->authorize('markAttendance', $event);

        $registrations = $event->registrations()
            ->with('user:id,name,email,student_id')
            ->orderBy('registered_at')
            ->get();

        $rows = [];
        $rows[] = implode(',', ['Name', 'Email', 'Student ID', 'Status', 'Waitlisted', 'Registered At', 'Checked In At']);

        foreach ($registrations as $reg) {
            $rows[] = implode(',', [
                '"' . str_replace('"', '""', $reg->user->name ?? '') . '"',
                '"' . str_replace('"', '""', $reg->user->email ?? '') . '"',
                '"' . str_replace('"', '""', $reg->user->student_id ?? '') . '"',
                $reg->status instanceof \BackedEnum ? $reg->status->value : $reg->status,
                $reg->is_waitlisted ? 'Yes' : 'No',
                $reg->registered_at?->toDateTimeString() ?? '',
                $reg->checked_in_at?->toDateTimeString() ?? '',
            ]);
        }

        $csv = implode("\n", $rows);

        return response()->streamDownload(
            function () use ($csv) { echo $csv; },
            $event->slug . '-attendees.csv',
            ['Content-Type' => 'text/csv']
        );
    }

    public function cloneEvent(Event $event)
    {
        $this->authorize('update', $event);

        $clone = $event->replicate(['slug', 'approved_by', 'approved_at']);
        $clone->title          = $event->title . ' (Copy)';
        $clone->status         = EventStatus::Draft;
        $clone->slug           = $event->slug . '-copy-' . substr(md5(uniqid()), 0, 4);
        $clone->start_datetime = null;
        $clone->end_datetime   = null;
        $clone->save();

        return to_route('events.edit', $clone)->with('success', 'Event cloned as draft.');
    }
}
