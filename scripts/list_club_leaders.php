<?php
use App\Models\User;

$leaders = User::role('club-leader')->get();
echo 'Total club-leaders: ' . $leaders->count() . PHP_EOL;
foreach ($leaders as $l) {
    echo $l->email . ' | roles: ' . $l->getRoleNames()->implode(', ') . ' | is_student: ' . ($l->hasRole('student') ? 'yes' : 'no') . PHP_EOL;
}
