<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Spatie\Permission\Models\Role;

class EnsureRoleMatchesOnLogin
{
    public function handle(Login $event): void
    {
        $user = $event->user;
        if (! $user) {
            return;
        }

        // Do not modify admins or super-admins
        if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
            return;
        }

        // Leadership positions live in club_memberships now, never as a
        // platform role — everyone who isn't Admin/Super Admin is a Student.
        Role::firstOrCreate(['name' => 'student']);
        if (! $user->hasRole('student')) {
            $user->assignRole('student');
        }
    }
}