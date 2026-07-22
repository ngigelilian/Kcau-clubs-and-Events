<?php

$u = App\Models\User::firstOrCreate(
    ['email' => 'lilo@leaders.kcau.ac.ke'],
    ['name' => 'Lilo Leaders', 'password' => 'password', 'is_active' => true, 'email_verified_at' => now()]
);

// Fire Registered event to trigger role assignment listener
event(new \Illuminate\Auth\Events\Registered($u));

echo implode(',', $u->getRoleNames()->toArray()) . PHP_EOL;
