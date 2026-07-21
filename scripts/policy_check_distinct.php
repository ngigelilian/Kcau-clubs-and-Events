<?php
use App\Models\User;
use App\Models\Club;
use App\Models\Event;

$studentOnly = User::whereHas('roles', function($q){ $q->where('name','student'); })
    ->whereDoesntHave('roles', function($q){ $q->where('name','club-leader'); })
    ->first();

if ($studentOnly) {
    echo 'STUDENT_ONLY: ' . $studentOnly->email . PHP_EOL;
    echo 'ROLES: ' . $studentOnly->getRoleNames()->implode(', ') . PHP_EOL;
    echo 'can_create_club: ' . ($studentOnly->can('create', Club::class) ? 'true' : 'false') . PHP_EOL;
} else {
    echo 'No student-only user found' . PHP_EOL;
}

$leaderOnly = User::whereHas('roles', function($q){ $q->where('name','club-leader'); })
    ->whereDoesntHave('roles', function($q){ $q->where('name','student'); })
    ->first();

if ($leaderOnly) {
    echo 'LEADER_ONLY: ' . $leaderOnly->email . PHP_EOL;
    echo 'ROLES: ' . $leaderOnly->getRoleNames()->implode(', ') . PHP_EOL;
    echo 'can_create_club: ' . ($leaderOnly->can('create', Club::class) ? 'true' : 'false') . PHP_EOL;
    echo 'can_create_event: ' . ($leaderOnly->can('create', Event::class) ? 'true' : 'false') . PHP_EOL;
} else {
    echo 'No club-leader-only user found' . PHP_EOL;
}
