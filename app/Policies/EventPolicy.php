<?php

namespace App\Policies;

use App\Enums\EventStatus;
use App\Models\Club;
use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    /**
     * Determine whether the user can view any events.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the event.
     * Draft events are only visible to the creator and admins.
     */
    public function view(User $user, Event $event): bool
    {
        if ($event->status === EventStatus::Approved || $event->status === EventStatus::Completed) {
            return true;
        }

        // Drafts and pending events visible to creator, club leaders, and admins
        return $event->created_by === $user->id
            || ($event->club_id && $user->isLeaderOf($event->club))
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can create events.
     * Club Leaders (for their club) and Admins (school-wide) can create events.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'super-admin'])
            || $user->clubMemberships()->leaders()->active()->exists();
    }

    /**
     * Determine whether the user can create a school-wide event.
     */
    public function createSchool(User $user): bool
    {
        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can create a club event for a specific club.
     */
    public function createClub(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin'])
            || $user->isLeaderOf($club);
    }

    /**
     * Determine whether the user can update the event.
     */
    public function update(User $user, Event $event): bool
    {
        // Can't update approved/completed/cancelled events (except admins)
        if (in_array($event->status, [EventStatus::Completed, EventStatus::Cancelled])
            && ! $user->hasRole(['admin', 'super-admin'])) {
            return false;
        }

        return $event->created_by === $user->id
            || ($event->club && $user->isLeaderOf($event->club))
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can delete the event.
     */
    public function delete(User $user, Event $event): bool
    {
        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can approve/reject the event.
     * Club Leaders cannot approve their own events.
     */
    public function approve(User $user, Event $event): bool
    {
        if ($event->created_by === $user->id) {
            return false;
        }

        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can cancel the event.
     */
    public function cancel(User $user, Event $event): bool
    {
        return ($event->club_id && $user->isLeaderOf($event->club))
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can mark attendance for the event.
     */
    public function markAttendance(User $user, Event $event): bool
    {
        return ($event->club_id && $user->isLeaderOf($event->club))
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can register for the event.
     */
    public function register(User $user, Event $event): bool
    {
        return $event->isRegistrationOpen();
    }
}
