<?php

namespace App\Services;

use App\Enums\InvitationStatus;
use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Models\Club;
use App\Models\ClubLeaderInvitation;
use App\Models\ClubMembership;
use App\Models\User;
use App\Notifications\ClubLeaderInvitationNotification;
use Illuminate\Support\Facades\DB;

class ClubLeadershipService
{
    /**
     * How long a leadership invitation stays open before it auto-expires.
     */
    private const INVITATION_LIFETIME_DAYS = 7;

    /**
     * Invite an existing student to take up a leadership position in the club.
     * Only the Chairperson may do this (enforced by the calling controller's
     * policy check) — this method focuses on the business rules.
     */
    public function invite(Club $club, User $inviter, User $invitee, MembershipRole $position): ClubLeaderInvitation
    {
        if (! in_array($position, MembershipRole::assignablePositions(), true)) {
            throw new \InvalidArgumentException('Chairperson cannot be assigned via invite — use transferChairperson() instead.');
        }

        if ($invitee->id === $inviter->id) {
            throw new \InvalidArgumentException('You cannot invite yourself.');
        }

        // Already an active leader of this club?
        $alreadyLeader = ClubMembership::where('club_id', $club->id)
            ->where('user_id', $invitee->id)
            ->where('status', MembershipStatus::Active)
            ->whereIn('role', MembershipRole::leadershipRoles())
            ->exists();

        if ($alreadyLeader) {
            throw new \RuntimeException('This student already holds a leadership position in this club.');
        }

        // Already has a pending invite for this club?
        $existingPending = ClubLeaderInvitation::where('club_id', $club->id)
            ->where('invitee_id', $invitee->id)
            ->pending()
            ->exists();

        if ($existingPending) {
            throw new \RuntimeException('This student already has a pending invitation for this club.');
        }

        $invitation = DB::transaction(function () use ($club, $inviter, $invitee, $position) {
            $invitation = ClubLeaderInvitation::create([
                'club_id' => $club->id,
                'inviter_id' => $inviter->id,
                'invitee_id' => $invitee->id,
                'position' => $position,
                'status' => InvitationStatus::Pending,
                'expires_at' => now()->addDays(self::INVITATION_LIFETIME_DAYS),
            ]);

            activity()
                ->performedOn($club)
                ->causedBy($inviter)
                ->withProperties(['invitee_id' => $invitee->id, 'position' => $position->value])
                ->log('Leadership invitation sent');

            return $invitation;
        });

        $invitee->notify(new ClubLeaderInvitationNotification($invitation));

        return $invitation;
    }

    /**
     * The invitee accepts — creates or updates their club membership with
     * the invited position.
     */
    public function accept(ClubLeaderInvitation $invitation, User $actor): ClubMembership
    {
        $this->assertActingInvitee($invitation, $actor);

        if (! $invitation->isPending()) {
            throw new \RuntimeException('This invitation is no longer valid.');
        }

        return DB::transaction(function () use ($invitation, $actor) {
            $membership = ClubMembership::updateOrCreate(
                ['club_id' => $invitation->club_id, 'user_id' => $actor->id],
                [
                    'role' => $invitation->position,
                    'status' => MembershipStatus::Active,
                    'joined_at' => now(),
                    'leadership_since' => now(),
                ]
            );

            $invitation->update([
                'status' => InvitationStatus::Accepted,
                'responded_at' => now(),
            ]);

            activity()
                ->performedOn($invitation->club)
                ->causedBy($actor)
                ->withProperties(['position' => $invitation->position->value])
                ->log('Leadership invitation accepted');

            return $membership;
        });
    }

    /**
     * The invitee declines.
     */
    public function decline(ClubLeaderInvitation $invitation, User $actor): ClubLeaderInvitation
    {
        $this->assertActingInvitee($invitation, $actor);

        if (! $invitation->isPending()) {
            throw new \RuntimeException('This invitation is no longer valid.');
        }

        $invitation->update([
            'status' => InvitationStatus::Declined,
            'responded_at' => now(),
        ]);

        activity()
            ->performedOn($invitation->club)
            ->causedBy($actor)
            ->log('Leadership invitation declined');

        return $invitation->fresh();
    }

    /**
     * The Chairperson revokes a still-pending invite they sent.
     */
    public function revoke(ClubLeaderInvitation $invitation, User $actor): ClubLeaderInvitation
    {
        if ($invitation->status !== InvitationStatus::Pending) {
            throw new \RuntimeException('Only a pending invitation can be revoked.');
        }

        $invitation->update([
            'status' => InvitationStatus::Revoked,
            'responded_at' => now(),
        ]);

        activity()
            ->performedOn($invitation->club)
            ->causedBy($actor)
            ->log('Leadership invitation revoked');

        return $invitation->fresh();
    }

    /**
     * Remove a leader (Secretary/Treasurer/Co-Chair) from their position,
     * demoting them back to a plain Member. Chairperson-only action.
     * The Chairperson position itself cannot be removed this way — use
     * transferChairperson() or the admin succession path instead.
     */
    public function removeLeader(ClubMembership $membership, User $actor): ClubMembership
    {
        if ($membership->role->isChairperson()) {
            throw new \RuntimeException('The Chairperson cannot be removed this way. Transfer chairpersonship first.');
        }

        if (! $membership->role->isLeadership()) {
            throw new \RuntimeException('This member does not currently hold a leadership position.');
        }

        $membership->update([
            'role' => MembershipRole::Member,
            'leadership_since' => null,
        ]);

        activity()
            ->performedOn($membership->club)
            ->causedBy($actor)
            ->withProperties(['demoted_user_id' => $membership->user_id])
            ->log('Leader removed from position');

        return $membership->fresh();
    }

    /**
     * The Chairperson steps down, naming an existing leader as their
     * successor. The outgoing Chairperson becomes a Co-Chair (retaining
     * general leadership privileges) rather than being demoted to Member.
     */
    public function transferChairperson(Club $club, User $currentChairperson, ClubMembership $successor): ClubMembership
    {
        $currentMembership = ClubMembership::where('club_id', $club->id)
            ->where('user_id', $currentChairperson->id)
            ->where('status', MembershipStatus::Active)
            ->where('role', MembershipRole::Chairperson)
            ->first();

        if (! $currentMembership) {
            throw new \RuntimeException('You are not the Chairperson of this club.');
        }

        if ($successor->club_id !== $club->id || $successor->status !== MembershipStatus::Active) {
            throw new \RuntimeException('The successor must be an active member of this club.');
        }

        if (! $successor->role->isLeadership()) {
            throw new \RuntimeException('The successor must already hold a leadership position. Invite them to a position first.');
        }

        return DB::transaction(function () use ($currentMembership, $successor) {
            $successor->update(['role' => MembershipRole::Chairperson]);
            $currentMembership->update(['role' => MembershipRole::CoChair]);

            activity()
                ->performedOn($currentMembership->club)
                ->causedBy($currentMembership->user)
                ->withProperties(['new_chairperson_id' => $successor->user_id])
                ->log('Chairperson transferred');

            return $successor->fresh();
        });
    }

    /**
     * Admin removes a Chairperson for misconduct/inactivity. The most
     * senior remaining leader (earliest leadership_since) is automatically
     * promoted to Chairperson immediately — the club is never left without
     * one, and admins never directly appoint a successor themselves.
     *
     * @throws \RuntimeException if there is no other leader to promote.
     */
    public function adminRemoveChairperson(Club $club, User $admin): ClubMembership
    {
        return DB::transaction(function () use ($club, $admin) {
            $currentChair = ClubMembership::where('club_id', $club->id)
                ->where('status', MembershipStatus::Active)
                ->where('role', MembershipRole::Chairperson)
                ->lockForUpdate()
                ->first();

            if (! $currentChair) {
                throw new \RuntimeException('This club has no active Chairperson.');
            }

            $successor = ClubMembership::where('club_id', $club->id)
                ->where('status', MembershipStatus::Active)
                ->where('id', '!=', $currentChair->id)
                ->whereIn('role', MembershipRole::leadershipRoles())
                ->orderBy('leadership_since', 'asc')
                ->first();

            if (! $successor) {
                throw new \RuntimeException(
                    'This club has no other leaders to promote. Assign at least one Secretary/Treasurer/Co-Chair before removing the Chairperson.'
                );
            }

            $currentChair->update([
                'status' => MembershipStatus::Removed,
                'role' => MembershipRole::Member,
                'leadership_since' => null,
            ]);

            $successor->update(['role' => MembershipRole::Chairperson]);

            activity()
                ->performedOn($club)
                ->causedBy($admin)
                ->withProperties([
                    'removed_user_id' => $currentChair->user_id,
                    'new_chairperson_id' => $successor->user_id,
                ])
                ->log('Chairperson removed by admin; successor auto-promoted');

            return $successor->fresh();
        });
    }

    /**
     * The Chairperson disbands their own club — a deliberate, self-service
     * closure, distinct from an admin-imposed suspension. The club is
     * soft-deleted (so it disappears from all public listings immediately)
     * and marked Disbanded for the audit trail.
     */
    public function disbandClub(Club $club, User $chairperson): Club
    {
        if (! $chairperson->isChairpersonOf($club)) {
            throw new \RuntimeException('Only the Chairperson can disband this club.');
        }

        return DB::transaction(function () use ($club, $chairperson) {
            $club->update(['status' => \App\Enums\ClubStatus::Disbanded]);
            $club->delete(); // soft delete — removes it from all public listings

            activity()
                ->performedOn($club)
                ->causedBy($chairperson)
                ->log('Club disbanded by its Chairperson');

            return $club->fresh();
        });
    }

    private function assertActingInvitee(ClubLeaderInvitation $invitation, User $actor): void
    {
        if ($invitation->invitee_id !== $actor->id) {
            throw new \RuntimeException('This invitation is not addressed to you.');
        }
    }
}
