<?php
$emails = ['lilo@students.kcau.ac.ke','ngige@students.kcau.ac.ke','liloo@students.kcau.ac.ke'];
$roleName = 'student';

$role = Spatie\Permission\Models\Role::firstOrCreate(['name' => $roleName]);

foreach ($emails as $e) {
    if (App\Models\User::where('email', $e)->exists()) {
        echo "Exists: {$e}\n";
        continue;
    }

    $local = explode('@', $e)[0];
    $name = ucwords(str_replace(['.', '_'], ' ', $local));

    $user = App\Models\User::create([
        'name' => $name,
        'email' => $e,
        'password' => 'password',
        'is_active' => true,
        'email_verified_at' => now(),
    ]);

    // Trigger Registered event so domain-based role assignment runs
    event(new \Illuminate\Auth\Events\Registered($user));
    echo "Created: {$e}\n";
}

echo "Done\n";