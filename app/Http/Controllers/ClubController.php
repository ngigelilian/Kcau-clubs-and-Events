<?php

namespace App\Http\Controllers;

use App\Enums\ClubCategory;
use App\Enums\ClubStatus;
use App\Enums\MembershipStatus;
use App\Enums\MerchandiseStatus;
use App\Http\Requests\Club\StoreClubRequest;
use App\Http\Requests\Club\UpdateClubRequest;
use App\Models\Club;
use App\Services\ClubService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClubController extends Controller
{
    public function __construct(
        private readonly ClubService $clubService,
    ) {}

    /**
     * Display the club discovery page.
     * Shows all active clubs with search, filter, and sort.
     */
    public function index(Request $request): Response
    {
        $query = Club::query()
            ->active()
            ->withCount(['memberships as active_members_count' => function ($q) {
                $q->where('status', MembershipStatus::Active);
            }]);

        // Search
        if ($search = $request->input('search')) {
            $query->search($search);
        }

        // Filter by category
        if ($category = $request->input('category')) {
            $query->category(ClubCategory::from($category));
        }

        // Sort
        $sort = $request->input('sort', 'popular');
        $query = match ($sort) {
            'newest' => $query->latest(),
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('active_members_count'), // popular
        };

        $clubs = $query->paginate(12)->withQueryString();

        // Append media URLs
        $clubs->getCollection()->transform(function (Club $club) {
            $club->logo_url = $club->getFirstMediaUrl('logo');
            $club->banner_url = $club->getFirstMediaUrl('banner');

            return $club;
        });

        return Inertia::render('clubs/index', [
            'clubs' => $clubs,
            'filters' => [
                'search' => $request->input('search', ''),
                'category' => $request->input('category', ''),
                'sort' => $sort,
            ],
            'categories' => collect(ClubCategory::cases())->map(fn (ClubCategory $c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    /**
     * Display the club detail/profile page.
     */
    public function show(Club $club): Response
    {
        $club->load([
            'creator:id,name,avatar',
            'memberships' => fn ($q) => $q->where('status', MembershipStatus::Active)->with('user:id,name,avatar,student_id'),
            'events' => fn ($q) => $q->where('status', 'approved')->where('start_datetime', '>=', now())->orderBy('start_datetime')->limit(5),
            'merchandise' => fn ($q) => $q->where('status', MerchandiseStatus::Available)->orderBy('name')->limit(8),
        ]);

        $club->loadCount(['memberships as active_members_count' => function ($q) {
            $q->where('status', MembershipStatus::Active);
        }]);

        $club->logo_url = $club->getFirstMediaUrl('logo');
        $club->banner_url = $club->getFirstMediaUrl('banner');
        $club->merchandise->each(function ($item) {
            $item->image_urls = $item->getMedia('images')->map->getUrl()->toArray();
            $item->formatted_price = $item->formattedPrice();
            $item->is_in_stock = $item->isInStock();
        });

        // Current user's membership status
        $userMembership = null;
        if ($user = auth()->user()) {
            $userMembership = $club->memberships()
                ->where('user_id', $user->id)
                ->first();
        }

        // Leaders (for display)
        $leaders = $club->memberships
            ->filter(fn ($m) => in_array($m->role->value, ['leader', 'co-leader']))
            ->values();

        return Inertia::render('clubs/show', [
            'club' => $club,
            'leaders' => $leaders,
            'userMembership' => $userMembership,
        ]);
    }

    /**
     * Show the form for creating/proposing a new club.
     */
    public function create(): Response
    {
        $this->authorize('create', Club::class);

        return Inertia::render('clubs/create', [
            'categories' => collect(ClubCategory::cases())->map(fn (ClubCategory $c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    /**
     * Store a newly proposed club.
     */
    public function store(StoreClubRequest $request)
    {
        $club = $this->clubService->createClub(
            $request->validated(),
            $request->user(),
        );

        return to_route('clubs.show', $club)
            ->with('success', 'Club proposal submitted! An admin will review it shortly.');
    }

    /**
     * Show the form for editing a club.
     */
    public function edit(Club $club): Response
    {
        $this->authorize('update', $club);

        $club->logo_url = $club->getFirstMediaUrl('logo');
        $club->banner_url = $club->getFirstMediaUrl('banner');

        return Inertia::render('clubs/edit', [
            'club' => $club,
            'categories' => collect(ClubCategory::cases())->map(fn (ClubCategory $c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    /**
     * Update the club details.
     */
    public function update(UpdateClubRequest $request, Club $club)
    {
        $this->clubService->updateClub($club, $request->validated());

        return to_route('clubs.show', $club)
            ->with('success', 'Club updated successfully.');
    }

    /**
     * Request to join a club.
     */
    public function join(Club $club)
    {
        try {
            $membership = $this->clubService->requestJoin($club, auth()->user());

            $message = $membership->membership_fee_due > 0
                ? 'Join request submitted. Subscription due: KES '.number_format($membership->membership_fee_due / 100, 2).'. The club leader will review your request.'
                : 'Join request submitted! The club leader will review it.';

            return back()->with('success', $message);
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Leave a club (cancel own membership).
     */
    public function leave(Club $club)
    {
        $user = auth()->user();
        $membership = $club->memberships()
            ->where('user_id', $user->id)
            ->where('status', MembershipStatus::Active)
            ->first();

        if (! $membership) {
            return back()->with('error', 'You are not an active member of this club.');
        }

        // Leaders cannot leave — they must transfer leadership first
        if ($membership->role->value === 'leader') {
            return back()->with('error', 'Club leaders cannot leave. Transfer leadership first.');
        }

        $membership->delete();

        return back()->with('success', 'You have left the club.');
    }

    /**
     * Show membership management page for club leaders.
     */
    public function members(Club $club): Response
    {
        $this->authorize('manageMembers', $club);

        $members = $club->memberships()
            ->with('user:id,name,email,avatar,student_id,department,year_of_study')
            ->orderByRaw("CASE WHEN role = 'leader' THEN 0 WHEN role = 'co-leader' THEN 1 ELSE 2 END")
            ->orderBy('joined_at')
            ->paginate(20);

        $pendingRequests = $club->memberships()
            ->with('user:id,name,email,avatar,student_id')
            ->where('status', MembershipStatus::Pending)
            ->latest()
            ->get();

        return Inertia::render('clubs/members', [
            'club' => $club,
            'members' => $members,
            'pendingRequests' => $pendingRequests,
        ]);
    }

    /**
     * Approve a membership join request.
     */
    public function approveMember(Club $club, int $membershipId)
    {
        $this->authorize('manageMembers', $club);

        $membership = $club->memberships()->findOrFail($membershipId);
        $this->clubService->approveMembership($membership, auth()->user());

        return back()->with('success', 'Member approved.');
    }

    /**
     * Reject a membership join request.
     */
    public function rejectMember(Club $club, int $membershipId)
    {
        $this->authorize('manageMembers', $club);

        $membership = $club->memberships()->findOrFail($membershipId);
        $this->clubService->rejectMembership($membership, auth()->user());

        return back()->with('success', 'Join request rejected.');
    }

    /**
     * Remove a member from the club.
     */
    public function removeMember(Club $club, int $membershipId)
    {
        $this->authorize('manageMembers', $club);

        $membership = $club->memberships()->findOrFail($membershipId);

        // Cannot remove the primary leader
        if ($membership->role === \App\Enums\MembershipRole::Leader) {
            return back()->with('error', 'Cannot remove the primary club leader.');
        }

        $this->clubService->removeMember($club, $membership->user, auth()->user());

        return back()->with('success', 'Member removed.');
    }

    /**
     * Promote a member to co-leader.
     */
    public function promoteMember(Club $club, int $membershipId)
    {
        $this->authorize('manageMembers', $club);

        $membership = $club->memberships()->findOrFail($membershipId);
        $this->clubService->promoteToColeader($membership, auth()->user());

        return back()->with('success', 'Member promoted to co-leader.');
    }

    /**
     * Demote a co-leader to member.
     */
    public function demoteMember(Club $club, int $membershipId)
    {
        $this->authorize('manageMembers', $club);

        $membership = $club->memberships()->findOrFail($membershipId);
        $this->clubService->demoteToMember($membership, auth()->user());

        return back()->with('success', 'Co-leader demoted to member.');
    }
}
