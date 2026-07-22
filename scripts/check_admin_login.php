<?php
use App\Models\User;

$admins = User::role(['admin','super-admin'])->get();
if ($admins->isEmpty()) {
    echo "No admin or super-admin users found\n";
    return;
}

foreach ($admins as $u) {
    echo 'EMAIL: ' . $u->email . PHP_EOL;
    echo 'ROLES: ' . $u->getRoleNames()->implode(',') . PHP_EOL;
    $ok = auth()->guard('web')->attempt(['email' => $u->email, 'password' => 'password']);
    echo 'AUTH(password): ' . ($ok ? 'true' : 'false') . PHP_EOL;
    echo "---\n";
}
