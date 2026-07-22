<?php

$users = App\Models\User::whereDoesntHave('roles', function ($q) {
    $q->whereIn('name', ['super-admin', 'administrator']);
})->get();

echo 'Count: ' . $users->count() . PHP_EOL;

foreach ($users as $u) {
    echo 'Updating: ' . $u->email . PHP_EOL;
    $u->update(['password' => 'password']);
}

echo 'Done' . PHP_EOL;
