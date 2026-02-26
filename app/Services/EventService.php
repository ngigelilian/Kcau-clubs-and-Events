<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Enums\PaymentStatusEnum;
use App\Enums\RegistrationStatus;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventService
{
    public function createEvent(array $data, User $creator): Event
    {
        return DB::transaction(function () use ($data, $creator) {
            $event = Event::create([
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'description' => $data['description'],
                'club_id' => $data['club_id'] ?? null,
                'type' => $data['type'],
                'venue' => $data['venue'],
                'start_datetime' => $data['start_datetime'],
                'end_datetime' => $data['end_datetime'],
                'capacity' => $data['capacity'] ?? null,
                'registration_deadline' => $data['registration_deadline'] ?? null,
                'is_paid' => $data['is_paid'] ?? false,
                'fee_amount' => $data['is_paid'] ? ($data['fee_amount'] ?? 0) : 0,
                'status' => EventStatus::Pending,
                'created_by' => $creator->id,
            ]);

            if (isset($data['cover'])) {
                $event->addMedia($data['cover'])->toMediaCollection('cover');
            }

            activity()
                ->performedOn($event)
                ->causedBy($creator)
                ->log('Event created');

            return $event;
        });
    }

    public function updateEvent(Event $event, array $data): Event
    {
        return DB::transaction(function () use ($event, $data) {
            $event->update([
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'description' => $data['description'],
                'club_id' => $data['club_id'] ?? $event->club_id,
                'type' => $data['type'] ?? $event->type,
                'venue' => $data['venue'],
                'start_datetime' => $data['start_datetime'],
                'end_datetime' => $data['end_datetime'],
                'capacity' => $data['capacity'] ?? null,
                'registration_deadline' => $data['registration_deadline'] ?? null,
                'is_paid' => $data['is_paid'] ?? false,
                'fee_amount' => ($data['is_paid'] ?? false) ? ($data['fee_amount'] ?? 0) : 0,
            ]);

            if (isset($data['cover'])) {
                $event->addMedia($data['cover'])->toMediaCollection('cover');
            }

            return $event->fresh();
        });
    }

    public function approveEvent(Event $event, User $approver): Event
    {
        $event->update([
            'status' => EventStatus::Approved,
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        activity()
            ->performedOn($event)
            ->causedBy($approver)
            ->log('Event approved');

        return $event->fresh();
    }

    public function rejectEvent(Event $event, User $rejector, ?string $reason = null): Event
    {
        $event->update(['status' => EventStatus::Rejected]);

        activity()
            ->performedOn($event)
            ->causedBy($rejector)
            ->withProperties(['reason' => $reason])
            ->log('Event rejected');

        return $event->fresh();
    }

    public function cancelEvent(Event $event, User $canceller, ?string $reason = null): Event
    {
        $event->update(['status' => EventStatus::Cancelled]);

        // Cancel all active registrations
        $event->registrations()
            ->where('status', RegistrationStatus::Registered)
            ->update([
                'status' => RegistrationStatus::Cancelled,
                'cancelled_at' => now(),
            ]);

        activity()
            ->performedOn($event)
            ->causedBy($canceller)
            ->withProperties(['reason' => $reason])
            ->log('Event cancelled');

        return $event->fresh();
    }

    public function completeEvent(Event $event, User $user): Event
    {
        $event->update(['status' => EventStatus::Completed]);

        activity()
            ->performedOn($event)
            ->causedBy($user)
            ->log('Event marked as completed');

        return $event->fresh();
    }

    public function registerUser(Event $event, User $user): EventRegistration
    {
        $existing = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->status === RegistrationStatus::Registered) {
                throw new \RuntimeException('You are already registered for this event.');
            }
            if ($existing->status === RegistrationStatus::Attended) {
                throw new \RuntimeException('You have already attended this event.');
            }
            // Re-register if previously cancelled
            $existing->update([
                'status' => RegistrationStatus::Registered,
                'payment_status' => $event->is_paid ? PaymentStatusEnum::Pending : PaymentStatusEnum::Waived,
                'registered_at' => now(),
                'cancelled_at' => null,
            ]);
            return $existing->fresh();
        }

        return EventRegistration::create([
            'event_id' => $event->id,
            'user_id' => $user->id,
            'status' => RegistrationStatus::Registered,
            'payment_status' => $event->is_paid ? PaymentStatusEnum::Pending : PaymentStatusEnum::Waived,
            'registered_at' => now(),
        ]);
    }

    public function cancelRegistration(Event $event, User $user): EventRegistration
    {
        $registration = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->where('status', RegistrationStatus::Registered)
            ->firstOrFail();

        $registration->update([
            'status' => RegistrationStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $registration->fresh();
    }

    public function markAttendance(Event $event, int $userId): EventRegistration
    {
        $registration = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $registration->update([
            'status' => RegistrationStatus::Attended,
            'attended_at' => now(),
        ]);

        return $registration->fresh();
    }
}
