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
            ->filter(fn ($m) => $m->role->isLeadership())
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

        // Only the Chairperson is barred from leaving directly — they must
        // transfer chairpersonship to another leader first (succession rule).
        // Other leadership positions (Secretary/Treasurer/Co-Chair) can leave freely.
        if ($membership->role->isChairperson()) {
            return back()->with('error', 'As Chairperson, you must transfer leadership to another leader before leaving.');
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
            ->orderByRaw("CASE WHEN role = 'chairperson' THEN 0 WHEN role = 'co_chair' THEN 1 WHEN role = 'secretary' THEN 2 WHEN role = 'treasurer' THEN 3 ELSE 4 END")
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
            'isChairperson' => auth()->user()->isChairpersonOf($club),
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
     * Remove a plain member from the club. Anyone holding a leadership
     * position is out of scope here — removing a leader is a sensitive
     * action handled by ClubLeadershipController::removeLeader() instead.
     */
    public function removeMember(Club $club, int $membershipId)
    {
        $this->authorize('manageMembers', $club);

        $membership = $club->memberships()->findOrFail($membershipId);

        if ($membership->role->isLeadership()) {
            return back()->with('error', 'This member holds a leadership position. Use the leadership management page to remove them.');
        }

        $this->clubService->removeMember($club, $membership->user, auth()->user());

        return back()->with('success', 'Member removed.');
    }
}
