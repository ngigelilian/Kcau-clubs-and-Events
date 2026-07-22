<?php

use App\Models\Club;

$leader = App\Models\User::where('email', 'alice@leaders.kcau.ac.ke')->first();
$student = App\Models\User::where('email', 'bob@students.kcau.ac.ke')->first();

if (! $leader || ! $student) {
    echo "Ensure test users exist (run test_roles_both.php first).\n";
    exit(1);
}

echo "Leader can create club? ";
echo $leader->can('create', Club::class) ? "yes\n" : "no\n";

echo "Student can create club? ";
echo $student->can('create', Club::class) ? "yes\n" : "no\n";
