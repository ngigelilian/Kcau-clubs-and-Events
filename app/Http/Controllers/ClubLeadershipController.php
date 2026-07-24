<?php

namespace App\Http\Controllers;

use App\Enums\MembershipRole;
use App\Models\Club;
use App\Models\ClubLeaderInvitation;
use App\Models\ClubMembership;
use App\Models\User;
use App\Services\ClubLeadershipService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClubLeadershipController extends Controller
{
    public function __construct(
        private readonly ClubLeadershipService $leadershipService,
    ) {}

    /**
     * Leadership management console for the Chairperson: current team,
     * pending sent invitations, and the invite form.
     */
    public function index(Club $club): Response
    {
        $this->authorize('manageLeadership', $club);

        $leaders = $club->memberships()
            ->with('user:id,name,email,avatar,student_id')
            ->leaders()
            ->active()
            ->orderByRaw("CASE WHEN role = 'chairperson' THEN 0 ELSE 1 END")
            ->orderBy('leadership_since')
            ->get();

        $pendingInvitations = $club->leaderInvitations()
            ->with(['invitee:id,name,email,student_id', 'inviter:id,name'])
            ->pending()
            ->latest()
            ->get();

        return Inertia::render('clubs/leaders', [
            'club' => $club,
            'leaders' => $leaders,
            'pendingInvitations' => $pendingInvitations,
            'positions' => collect(MembershipRole::assignablePositions())->map(fn (MembershipRole $r) => [
                'value' => $r->value,
                'label' => $r->label(),
            ]),
        ]);
    }

    /**
     * Search existing students to invite (excludes those who already hold
     * an active leadership position in this club).
     */
    public function searchStudents(Request $request, Club $club)
    {
        $this->authorize('manageLeadership', $club);

        $query = trim((string) $request->query('q', ''));

        if (strlen($query) < 2) {
            return response()->json(['data' => []]);
        }

        $existingLeaderIds = ClubMembership::where('club_id', $club->id)
            ->where('status', 'active')
            ->whereIn('role', MembershipRole::leadershipRoles())
            ->pluck('user_id');

        $students = User::role('student')
            ->whereNotIn('id', $existingLeaderIds)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('student_id', 'like', "%{$query}%");
            })
            ->limit(10)
            ->get(['id', 'name', 'email', 'student_id']);

        return response()->json(['data' => $students]);
    }

    /**
     * Send a leadership invitation.
     */
    public function invite(Request $request, Club $club)
    {
        $this->authorize('manageLeadership', $club);

        $data = $request->validate([
            'invitee_id' => ['required', 'integer', 'exists:users,id'],
            'position' => ['required', 'string', 'in:'.implode(',', array_map(fn ($r) => $r->value, MembershipRole::assignablePositions()))],
        ]);

        $invitee = User::findOrFail($data['invitee_id']);
        $position = MembershipRole::from($data['position']);

        try {
            $this->leadershipService->invite($club, $request->user(), $invitee, $position);
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Invitation sent to {$invitee->name}.");
    }

    /**
     * Revoke a still-pending invitation.
     */
    public function revokeInvitation(Club $club, ClubLeaderInvitation $invitation)
    {
        $this->authorize('manageLeadership', $club);

        try {
            $this->leadershipService->revoke($invitation, auth()->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Invitation revoked.');
    }

    /**
     * Remove a leader (Secretary/Treasurer/Co-Chair), demoting them to a
     * plain Member. The Chairperson position cannot be removed this way.
     */
    public function removeLeader(Club $club, int $membershipId)
    {
        $this->authorize('manageLeadership', $club);

        $membership = $club->memberships()->findOrFail($membershipId);

        try {
            $this->leadershipService->removeLeader($membership, auth()->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Leader removed from their position.');
    }

    /**
     * Transfer chairpersonship to another existing leader.
     */
    public function transferChairperson(Club $club, int $membershipId)
    {
        $this->authorize('manageLeadership', $club);

        $successor = $club->memberships()->findOrFail($membershipId);

        try {
            $this->leadershipService->transferChairperson($club, auth()->user(), $successor);
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Chairpersonship transferred.');
    }

    /**
     * Disband the club entirely. Chairperson-only, irreversible via the
     * normal UI (soft-deleted — an admin could restore it manually if ever needed).
     */
    public function disband(Club $club)
    {
        $this->authorize('manageLeadership', $club);

        try {
            $this->leadershipService->disbandClub($club, auth()->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('clubs.index')->with('success', "{$club->name} has been disbanded.");
    }
}
