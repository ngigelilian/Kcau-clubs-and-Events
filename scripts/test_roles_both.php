<?php

// Create a leader and a student, fire Registered event, then dump roles and auth flags

$leaderEmail = 'alice@leaders.kcau.ac.ke';
$studentEmail = 'bob@students.kcau.ac.ke';

$leader = App\Models\User::firstOrCreate(
    ['email' => $leaderEmail],
    ['name' => 'Alice Leader', 'password' => 'password', 'is_active' => true, 'email_verified_at' => now()]
);

$student = App\Models\User::firstOrCreate(
    ['email' => $studentEmail],
    ['name' => 'Bob Student', 'password' => 'password', 'is_active' => true, 'email_verified_at' => now()]
);

// Fire Registered event to trigger assignment listeners

event(new \Illuminate\Auth\Events\Registered($leader));
event(new \Illuminate\Auth\Events\Registered($student));

// Reload
$leader->refresh();
$student->refresh();

echo "LEADER: {$leader->email}\n";
echo ' Roles: ' . implode(',', $leader->getRoleNames()->toArray()) . "\n";
echo ' is_leader flag: ' . (in_array('club-leader', $leader->getRoleNames()->toArray()) ? 'yes' : 'no') . "\n";

echo "\nSTUDENT: {$student->email}\n";
echo ' Roles: ' . implode(',', $student->getRoleNames()->toArray()) . "\n";
echo ' is_student flag: ' . (in_array('student', $student->getRoleNames()->toArray()) ? 'yes' : 'no') . "\n";

// Print DB model_has_roles rows for both
use Illuminate\Support\Facades\DB;

$leaderRoles = DB::table('model_has_roles')->where('model_type', 'App\\Models\\User')->where('model_id', $leader->id)->get();
$studentRoles = DB::table('model_has_roles')->where('model_type', 'App\\Models\\User')->where('model_id', $student->id)->get();

echo "\nDB rows leader:\n";
print_r($leaderRoles->toArray());
echo "\nDB rows student:\n";
print_r($studentRoles->toArray());
