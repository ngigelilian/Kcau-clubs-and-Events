<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Support\Str;
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

        $domain = Str::lower(Str::after($user->email, '@'));

        if (Str::contains($domain, 'leader')) {
            Role::firstOrCreate(['name' => 'club-leader']);
            if (! $user->hasRole('club-leader')) {
                $user->assignRole('club-leader');
            }
            if ($user->hasRole('student')) {
                $user->removeRole('student');
            }
            return;
        }

        if (Str::contains($domain, 'student') || $domain === 'kcau.ac.ke') {
            Role::firstOrCreate(['name' => 'student']);
            if (! $user->hasRole('student')) {
                $user->assignRole('student');
            }
            if ($user->hasRole('club-leader')) {
                $user->removeRole('club-leader');
            }
            return;
        }

        // leave other domains unchanged
    }
}