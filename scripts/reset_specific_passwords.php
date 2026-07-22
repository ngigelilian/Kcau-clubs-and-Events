<?php
$emails = ['lilo@students.kcau.ac.ke','ngige@students.kcau.ac.ke','liloo@students.kcau.ac.ke'];
foreach ($emails as $e) {
    $u = App\Models\User::where('email', $e)->first();
    if ($u) {
        $u->update(['password' => 'password']);
        echo 'Updated: ' . $e . PHP_EOL;
    } else {
        echo 'Not found: ' . $e . PHP_EOL;
    }
}
echo 'Done' . PHP_EOL;
