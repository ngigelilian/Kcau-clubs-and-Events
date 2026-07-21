<?php
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

$created = 0;
$updated = 0;
$skipped = 0;

$users = App\Models\User::withTrashed()->get();
foreach ($users as $user) {
    // Skip admins / super-admins
    if ($user->hasRole('admin') || $user->hasRole('super-admin')) {
        $skipped++;
        continue;
    }

    $domain = Str::lower(Str::after($user->email, '@') ?? '');

    if ($domain === 'leaders.kcau.ac.ke') {
        Role::firstOrCreate(['name' => 'club-leader']);
        $changed = false;
        if (! $user->hasRole('club-leader')) {
            $user->assignRole('club-leader');
            $changed = true;
        }
        if ($user->hasRole('student')) {
            $user->removeRole('student');
            $changed = true;
        }
        if ($changed) $updated++;
        continue;
    }

    if ($domain === 'students.kcau.ac.ke') {
        Role::firstOrCreate(['name' => 'student']);
        $changed = false;
        if (! $user->hasRole('student')) {
            $user->assignRole('student');
            $changed = true;
        }
        if ($user->hasRole('club-leader')) {
            $user->removeRole('club-leader');
            $changed = true;
        }
        if ($changed) $updated++;
        continue;
    }

    $skipped++;
}

echo "Done. Updated: {$updated}, Skipped: {$skipped}\n";
