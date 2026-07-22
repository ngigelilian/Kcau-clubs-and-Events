<?php
use App\Models\User;

$leaderDomain = 'leaders.kcau.ac.ke';
$studentDomain = 'students.kcau.ac.ke';

$skipped = [];
$changes = [];

$users = User::whereDoesntHave('roles', function($q){ $q->whereIn('name', ['admin','super-admin']); })->get();

foreach ($users as $u) {
    $roles = $u->getRoleNames()->toArray();

    $old = $u->email;

    // Decide target domain: leaders if has club-leader role, else students if has student role.
    if (in_array('club-leader', $roles, true)) {
        $domain = $leaderDomain;
    } elseif (in_array('student', $roles, true)) {
        $domain = $studentDomain;
    } else {
        // skip users that are neither student nor club-leader
        $skipped[] = $old;
        continue;
    }

    $local = preg_replace('/[^A-Za-z0-9_.+-]/', '', strstr($old, '@', true) ?: $u->id);
    $candidate = $local . '@' . $domain;

    // Ensure uniqueness: if email exists for someone else, append .{id}
    $exists = User::where('email', $candidate)->where('id', '!=', $u->id)->exists();
    if ($exists) {
        $candidate = $local . '.' . $u->id . '@' . $domain;
    }

    // Update
    $u->email = $candidate;
    $u->save();

    $changes[] = [$old, $candidate];
}

echo "Updated: " . count($changes) . " users\n";
foreach ($changes as $c) {
    echo $c[0] . ' -> ' . $c[1] . "\n";
}

if (count($skipped)) {
    echo "Skipped (neither student nor club-leader):\n";
    foreach ($skipped as $s) echo " - $s\n";
}
