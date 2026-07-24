<?php

namespace App\Http\Controllers;

use App\Models\ClubLeaderInvitation;
use App\Services\ClubLeadershipService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function __construct(
        private readonly ClubLeadershipService $leadershipService,
    ) {}

    /**
     * The current user's pending leadership invitations.
     */
    public function index(Request $request): Response
    {
        $invitations = ClubLeaderInvitation::with(['club:id,name,slug', 'inviter:id,name'])
            ->forInvitee($request->user()->id)
            ->pending()
            ->latest()
            ->get();

        return Inertia::render('invitations/index', [
            'invitations' => $invitations,
        ]);
    }

    /**
     * Accept an invitation.
     */
    public function accept(Request $request, ClubLeaderInvitation $invitation)
    {
        try {
            $this->leadershipService->accept($invitation, $request->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "You are now {$invitation->position->label()} of {$invitation->club->name}.");
    }

    /**
     * Decline an invitation.
     */
    public function decline(Request $request, ClubLeaderInvitation $invitation)
    {
        try {
            $this->leadershipService->decline($invitation, $request->user());
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Invitation declined.');
    }
}
