<?php
namespace App\Http\Controllers;
use App\Models\EventRegistration;
use Illuminate\Http\Request;

class StudentMyEventsController extends Controller
{
    public function __invoke(Request $request)
    {
        $tab = $request->input('tab', 'upcoming');

        $query = EventRegistration::where('user_id', $request->user()->id)
            ->with(['event' => fn($q) => $q->with('club:id,name,slug')]);

        $registrations = match($tab) {
            'past' => $query->whereHas('event', fn($q) => $q->where('end_datetime', '<', now()))
                            ->where('status', '!=', 'cancelled')
                            ->orderByDesc('registered_at'),
            'waitlisted' => $query->where('is_waitlisted', true),
            'cancelled' => $query->where('status', 'cancelled'),
            default => $query->where('status', '!=', 'cancelled')
                             ->where('is_waitlisted', false)
                             ->whereHas('event', fn($q) => $q->where('start_datetime', '>', now()))
                             ->orderBy('registered_at'),
        };

        $registrations = $registrations->paginate(12)->withQueryString();
        $registrations->getCollection()->transform(function ($reg) {
            if ($reg->event) {
                $reg->event->cover_url = $reg->event->getFirstMediaUrl('cover');
                $reg->event->formatted_fee = $reg->event->is_paid ? $reg->event->formattedFee() : 'Free';
            }
            return $reg;
        });

        $counts = [
            'upcoming' => EventRegistration::where('user_id', request()->user()->id)->where('status', '!=', 'cancelled')->where('is_waitlisted', false)->whereHas('event', fn($q) => $q->where('start_datetime', '>', now()))->count(),
            'past' => EventRegistration::where('user_id', request()->user()->id)->where('status', '!=', 'cancelled')->whereHas('event', fn($q) => $q->where('end_datetime', '<', now()))->count(),
            'waitlisted' => EventRegistration::where('user_id', request()->user()->id)->where('is_waitlisted', true)->count(),
            'cancelled' => EventRegistration::where('user_id', request()->user()->id)->where('status', 'cancelled')->count(),
        ];

        return inertia('student/my-events', compact('registrations', 'tab', 'counts'));
    }
}
