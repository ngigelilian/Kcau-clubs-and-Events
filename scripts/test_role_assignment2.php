<?php

$u = App\Models\User::firstOrCreate(
    ['email' => 'test@leaders.kca.ac.ke'],
    ['name' => 'Test Leader', 'password' => 'password', 'is_active' => true, 'email_verified_at' => now()]
);

event(new \Illuminate\Auth\Events\Registered($u));

echo 'Roles: ' . implode(',', $u->getRoleNames()->toArray()) . PHP_EOL;
echo 'Permissions: ' . implode(',', $u->getAllPermissions()->pluck('name')->toArray()) . PHP_EOL;
