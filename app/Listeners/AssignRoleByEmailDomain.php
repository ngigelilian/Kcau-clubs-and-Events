<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Str;
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

        $domain = Str::lower(Str::after($user->email, '@'));

        // Map leader-like domains to `club-leader` (tolerant to subdomains/typos containing 'leader')
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

        // Map student-like domains to `student`
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
