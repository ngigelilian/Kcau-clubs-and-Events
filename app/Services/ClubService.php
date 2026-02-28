http://localhost:8000<?php

namespace App\Services;

use App\Enums\ClubStatus;
use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClubService
{
    /**
     * Create a new club proposal and make the creator a pending leader.
     *
     * @param  array<string, mixed>  $data
     */
    public function createClub(array $data, User $creator): Club
    {
        return DB::transaction(function () use ($data, $creator) {
            $club = Club::create([
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'],
                'category' => $data['category'],
                'max_members' => $data['max_members'] ?? null,
                'status' => ClubStatus::Pending,
                'created_by' => $creator->id,
            ]);

            // Handle media uploads
            if (isset($data['logo'])) {
                $club->addMedia($data['logo'])->toMediaCollection('logo');
            }

            if (isset($data['banner'])) {
                $club->addMedia($data['banner'])->toMediaCollection('banner');
            }

            // Creator becomes the leader (pending until club is approved)
            $club->memberships()->create([
                'user_id' => $creator->id,
                'role' => MembershipRole::Leader,
                'status' => MembershipStatus::Pending,
            ]);

            activity()
                ->performedOn($club)
                ->causedBy($creator)
                ->log('Club proposed');

            return $club;
        });
    }

    /**
     * Update an existing club's details.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateClub(Club $club, array $data): Club
    {
        return DB::transaction(function () use ($club, $data) {
            $club->update([
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'],
                'category' => $data['category'],
                'max_members' => $data['max_members'] ?? $club->max_members,
            ]);

            if (isset($data['logo'])) {
                $club->addMedia($data['logo'])->toMediaCollection('logo');
            }

            if (isset($data['banner'])) {
                $club->addMedia($data['banner'])->toMediaCollection('banner');
            }

            return $club->fresh();
        });
    }

    /**
     * Approve a pending club registration.
     * Activates the club and the founder's membership.
     */
    public function approveClub(Club $club, User $approver): Club
    {
        return DB::transaction(function () use ($club, $approver) {
            $club->update([
                'status' => ClubStatus::Active,
                'approved_by' => $approver->id,
                'approved_at' => now(),
            ]);

            // Activate the founder's membership
            $club->memberships()
                ->where('role', MembershipRole::Leader)
                ->where('status', MembershipStatus::Pending)
                ->update([
                    'status' => MembershipStatus::Active,
                    'joined_at' => now(),
                ]);

            // Assign club-leader role to the creator if not already assigned
            $creator = $club->creator;
            if ($creator && ! $creator->hasRole('club-leader')) {
                $creator->assignRole('club-leader');
            }

            activity()
                ->performedOn($club)
                ->causedBy($approver)
                ->log('Club approved');

            return $club->fresh();
        });
    }

    /**
     * Reject a pending club registration.
     */
    public function rejectClub(Club $club, User $rejector, ?string $reason = null): Club
    {
        return DB::transaction(function () use ($club, $rejector, $reason) {
            $club->update([
                'status' => ClubStatus::Suspended,
            ]);

            // Reject the founder's membership
            $club->memberships()
                ->where('status', MembershipStatus::Pending)
                ->update(['status' => MembershipStatus::Rejected]);

            activity()
                ->performedOn($club)
                ->causedBy($rejector)
                ->withProperties(['reason' => $reason])
                ->log('Club registration rejected');

            return $club->fresh();
        });
    }

    /**
     * Suspend an active club.
     */
    public function suspendClub(Club $club, User $suspender, ?string $reason = null): Club
    {
        $club->update(['status' => ClubStatus::Suspended]);

        activity()
            ->performedOn($club)
            ->causedBy($suspender)
            ->withProperties(['reason' => $reason])
            ->log('Club suspended');

        return $club->fresh();
    }

    /**
     * Reactivate a suspended club.
     */
    public function reactivateClub(Club $club, User $activator): Club
    {
        $club->update(['status' => ClubStatus::Active]);

        activity()
            ->performedOn($club)
            ->causedBy($activator)
            ->log('Club reactivated');

        return $club->fresh();
    }

    /**
     * Request to join a club.
     */
    public function requestJoin(Club $club, User $user): ClubMembership
    {
        // Check if user already has a membership record
        $existing = $club->memberships()
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            if ($existing->status === MembershipStatus::Active) {
                throw new \RuntimeException('You are already a member of this club.');
            }
            if ($existing->status === MembershipStatus::Pending) {
                throw new \RuntimeException('You already have a pending join request.');
            }
            // If rejected, allow re-request
            $existing->update([
                'status' => MembershipStatus::Pending,
                'role' => MembershipRole::Member,
            ]);

            return $existing->fresh();
        }

        return $club->memberships()->create([
            'user_id' => $user->id,
            'role' => MembershipRole::Member,
            'status' => MembershipStatus::Pending,
        ]);
    }

    /**
     * Approve a membership join request.
     */
    public function approveMembership(ClubMembership $membership, User $approver): ClubMembership
    {
        $membership->update([
            'status' => MembershipStatus::Active,
            'joined_at' => now(),
        ]);

        activity()
            ->performedOn($membership->club)
            ->causedBy($approver)
            ->withProperties(['member_id' => $membership->user_id])
            ->log('Membership approved');

        return $membership->fresh();
    }

    /**
     * Reject a membership join request.
     */
    public function rejectMembership(ClubMembership $membership, User $rejector): ClubMembership
    {
        $membership->update([
            'status' => MembershipStatus::Rejected,
        ]);

        activity()
            ->performedOn($membership->club)
            ->causedBy($rejector)
            ->withProperties(['member_id' => $membership->user_id])
            ->log('Membership rejected');

        return $membership->fresh();
    }

    /**
     * Remove a member from the club.
     */
    public function removeMember(Club $club, User $member, User $removedBy): void
    {
        $club->memberships()
            ->where('user_id', $member->id)
            ->delete();

        activity()
            ->performedOn($club)
            ->causedBy($removedBy)
            ->withProperties(['removed_user_id' => $member->id])
            ->log('Member removed');
    }

    /**
     * Promote a member to co-leader.
     */
    public function promoteToColeader(ClubMembership $membership, User $promotedBy): ClubMembership
    {
        $membership->update(['role' => MembershipRole::CoLeader]);

        // Ensure the user has the club-leader role
        $user = $membership->user;
        if (! $user->hasRole('club-leader')) {
            $user->assignRole('club-leader');
        }

        activity()
            ->performedOn($membership->club)
            ->causedBy($promotedBy)
            ->withProperties(['promoted_user_id' => $membership->user_id])
            ->log('Member promoted to co-leader');

        return $membership->fresh();
    }

    /**
     * Demote a co-leader back to member.
     */
    public function demoteToMember(ClubMembership $membership, User $demotedBy): ClubMembership
    {
        $membership->update(['role' => MembershipRole::Member]);

        // Check if user is still a leader in any other club
        $user = $membership->user;
        $isLeaderElsewhere = ClubMembership::where('user_id', $user->id)
            ->where('id', '!=', $membership->id)
            ->whereIn('role', [MembershipRole::Leader, MembershipRole::CoLeader])
            ->where('status', MembershipStatus::Active)
            ->exists();

        if (! $isLeaderElsewhere && $user->hasRole('club-leader')) {
            $user->removeRole('club-leader');
        }

        activity()
            ->performedOn($membership->club)
            ->causedBy($demotedBy)
            ->withProperties(['demoted_user_id' => $membership->user_id])
            ->log('Member demoted from co-leader');

        return $membership->fresh();
    }
}
