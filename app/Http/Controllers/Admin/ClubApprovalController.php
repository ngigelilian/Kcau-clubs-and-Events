<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ClubStatus;
use App\Enums\MembershipStatus;
use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Services\ClubService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClubApprovalController extends Controller
{
    public function __construct(
        private readonly ClubService $clubService,
    ) {}

    /**
     * List all clubs for admin management.
     */
    public function index(Request $request): Response
    {
        $query = Club::query()
            ->with('creator:id,name,email')
            ->withCount(['memberships as active_members_count' => function ($q) {
                $q->where('status', MembershipStatus::Active);
            }]);

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Search
        if ($search = $request->input('search')) {
            $query->search($search);
        }

        $clubs = $query->latest()->paginate(15)->withQueryString();

        // Append media URLs
        $clubs->getCollection()->transform(function (Club $club) {
            $club->logo_url = $club->getFirstMediaUrl('logo');

            return $club;
        });

        // Count by status for tabs
        $statusCounts = [
            'all' => Club::count(),
            'pending' => Club::where('status', ClubStatus::Pending)->count(),
            'active' => Club::where('status', ClubStatus::Active)->count(),
            'suspended' => Club::where('status', ClubStatus::Suspended)->count(),
        ];

        return Inertia::render('admin/clubs/index', [
            'clubs' => $clubs,
            'filters' => [
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
            ],
            'statusCounts' => $statusCounts,
        ]);
    }

    /**
     * Show a club's details for review.
     */
    public function show(Club $club): Response
    {
        $club->load([
            'creator:id,name,email,student_id',
            'approver:id,name',
            'memberships' => fn ($q) => $q->with('user:id,name,email,student_id'),
        ]);

        $club->loadCount(['memberships as active_members_count' => fn ($q) => $q->where('status', MembershipStatus::Active)]);

        $club->logo_url = $club->getFirstMediaUrl('logo');
        $club->banner_url = $club->getFirstMediaUrl('banner');

        return Inertia::render('admin/clubs/show', [
            'club' => $club,
        ]);
    }

    /**
     * Approve a pending club.
     */
    public function approve(Club $club)
    {
        $this->authorize('approve', $club);

        if ($club->status !== ClubStatus::Pending) {
            return back()->with('error', 'Only pending clubs can be approved.');
        }

        $this->clubService->approveClub($club, auth()->user());

        return back()->with('success', "Club '{$club->name}' has been approved.");
    }

    /**
     * Reject a pending club.
     */
    public function reject(Request $request, Club $club)
    {
        $this->authorize('approve', $club);

        if ($club->status !== ClubStatus::Pending) {
            return back()->with('error', 'Only pending clubs can be rejected.');
        }

        $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->clubService->rejectClub($club, auth()->user(), $request->input('reason'));

        return back()->with('success', "Club '{$club->name}' has been rejected.");
    }

    /**
     * Suspend an active club.
     */
    public function suspend(Request $request, Club $club)
    {
        $this->authorize('suspend', $club);

        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $this->clubService->suspendClub($club, auth()->user(), $request->input('reason'));

        return back()->with('success', "Club '{$club->name}' has been suspended.");
    }

    /**
     * Reactivate a suspended club.
     */
    public function reactivate(Club $club)
    {
        $this->authorize('approve', $club);

        if ($club->status !== ClubStatus::Suspended) {
            return back()->with('error', 'Only suspended clubs can be reactivated.');
        }

        $this->clubService->reactivateClub($club, auth()->user());

        return back()->with('success', "Club '{$club->name}' has been reactivated.");
    }
}
