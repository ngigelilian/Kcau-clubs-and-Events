<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Club;
use App\Models\ClubLeaderInvitation;
use App\Models\Event;
use Illuminate\Support\Facades\URL;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Ensure generated absolute URLs use the current request host (fixes stale APP_URL like ngrok)
        try {
            URL::forceRootUrl($request->getSchemeAndHttpHost());
        } catch (\Throwable $e) {
            // noop - don't break requests if URL forcing fails
        }

        $user = $request->user();

        $roles = $user ? $user->getRoleNames()->toArray() : [];
        $permissions = $user ? $user->getAllPermissions()->pluck('name')->toArray() : [];
        $isLeader = $user
            ? $user->clubMemberships()->leaders()->active()->exists()
            : false;
        $isChairpersonOfAny = $user
            ? $user->clubMemberships()->chairperson()->active()->exists()
            : false;
        $pendingInvitationsCount = $user
            ? ClubLeaderInvitation::forInvitee($user->id)->pending()->count()
            : 0;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $roles,
                    'permissions' => $permissions,
                    'is_leader' => $isLeader,
                    'is_chairperson' => $isChairpersonOfAny,
                    'is_student' => in_array('student', $roles, true),
                ]) : null,
            ],
            'can' => [
                'createClub' => $user ? $user->can('create', Club::class) : false,
                'createEvent' => $user ? $user->can('create', Event::class) : false,
            ],
            'pendingInvitationsCount' => $pendingInvitationsCount,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
        ];
    }
}
