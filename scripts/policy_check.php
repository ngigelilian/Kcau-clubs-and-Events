<?php
use App\Models\User;
use App\Models\Club;
use App\Models\Event;

$student = User::role('student')->first();
echo 'STUDENT: ' . ($student?->email ?? 'none') . PHP_EOL;
echo 'ROLES: ' . ($student?->getRoleNames()->implode(', ') ?? '') . PHP_EOL;
echo 'can_create_club: ' . ($student ? ($student->can('create', Club::class) ? 'true' : 'false') : 'false') . PHP_EOL;
echo 'can_create_event: ' . ($student ? ($student->can('create', Event::class) ? 'true' : 'false') : 'false') . PHP_EOL;
$leader = User::role('club-leader')->first();
$leader = User::role('club-leader')->first();
echo 'LEADER: ' . ($leader?->email ?? 'none') . PHP_EOL;
echo 'ROLES: ' . ($leader?->getRoleNames()->implode(', ') ?? '') . PHP_EOL;
echo 'can_create_club: ' . ($leader ? ($leader->can('create', Club::class) ? 'true' : 'false') : 'false') . PHP_EOL;
echo 'can_create_event: ' . ($leader ? ($leader->can('create', Event::class) ? 'true' : 'false') : 'false') . PHP_EOL;

$club = Club::first();
if ($club) {
    echo 'Club: ' . $club->id . ' ' . $club->name . ' status:' . $club->status . PHP_EOL;
    echo 'Leader_isLeaderOf_club: ' . ($leader ? ($leader->isLeaderOf($club) ? 'true' : 'false') : 'false') . PHP_EOL;
    echo 'Leader_can_createClub_for_club: ' . ($leader ? ($leader->can('createClub', $club) ? 'true' : 'false') : 'false') . PHP_EOL;
} else {
    echo 'No clubs' . PHP_EOL;
}
