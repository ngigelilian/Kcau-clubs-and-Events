<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Registered;
use Spatie\Permission\Models\Role;

class AssignRoleByEmailDomain
{
    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        $user = $event->user;

        if (! $user) {
            return;
        }

        // Do not modify admins or super-admins
        if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
            return;
        }

        // Under the club-scoped leadership model, platform role is always
        // 'student' for anyone who isn't an Admin/Super Admin — leadership
        // positions (Chairperson/Secretary/Treasurer/Co-Chair) live entirely
        // in club_memberships, never as a platform role. Email domain no
        // longer grants any special platform role.
        Role::firstOrCreate(['name' => 'student']);
        if (! $user->hasRole('student')) {
            $user->assignRole('student');
        }
    }
}
