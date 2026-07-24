<?php

namespace App\Policies;

use App\Models\Club;
use App\Models\User;

class ClubPolicy
{
    /**
     * Determine whether the user can view any clubs.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the club.
     */
    public function view(User $user, Club $club): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create clubs.
     * Any authenticated user can propose a new club — this is how club
     * leadership begins; the proposer becomes Chairperson once approved.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the club.
     * Only club leaders or admins can update.
     */
    public function update(User $user, Club $club): bool
    {
        // NOTE: 'club-leader' is a single global role, not scoped to one
        // club, so it must not grant access on its own — otherwise a leader
        // of Club A could edit Club B. Only admins bypass the per-club check.
        return $user->hasRole(['admin', 'super-admin'])
            || $user->isLeaderOf($club);
    }

    /**
     * Determine whether the user can delete the club.
     * Only admins can delete/suspend clubs.
     */
    public function delete(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can approve/reject the club.
     */
    public function approve(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can suspend the club.
     */
    public function suspend(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can manage ordinary club members
     * (approve/reject join requests, remove a plain Member). Any
     * leadership position can do this — it's not a sensitive action.
     */
    public function manageMembers(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin'])
            || $user->isLeaderOf($club);
    }

    /**
     * Determine whether the user can manage club leadership itself —
     * invite/remove a leader, transfer chairpersonship, disband the club.
     * Chairperson-only (admins have their own separate succession path,
     * see ClubLeadershipService::adminRemoveChairperson()).
     */
    public function manageLeadership(User $user, Club $club): bool
    {
        return $user->isChairpersonOf($club);
    }

    /**
     * Determine whether the user can manage club merchandise.
     */
    public function manageMerchandise(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin'])
            || $user->isLeaderOf($club);
    }

    /**
     * Determine whether the user can send announcements for the club.
     */
    public function sendAnnouncements(User $user, Club $club): bool
    {
        return $user->hasRole(['admin', 'super-admin'])
            || $user->isLeaderOf($club);
    }
}
