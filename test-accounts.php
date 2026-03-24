<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Get existing admin
$admin = User::where('email', 'admin@kcau.ac.ke')->first();
echo "=== ADMIN ACCOUNT ===\n";
echo "Email: admin@kcau.ac.ke\n";
echo "Password: password\n";
echo "Roles: Approve clubs, manage system\n\n";

// Get first club leader
$leader = User::role('club-leader')->first();
if ($leader) {
    echo "=== CLUB LEADER ACCOUNT (from seeded data) ===\n";
    echo "Email: {$leader->email}\n";
    echo "Name: {$leader->name}\n";
    echo "Password: password (same as factory default)\n";
    echo "Note: This student created a club that was approved by admin\n";
}

// Create a test club leader if needed
$testLeader = User::where('email', 'leader@students.kcau.ac.ke')->first();
if (!$testLeader) {
    $testLeader = User::create([
        'name' => 'John Doe',
        'email' => 'leader@students.kcau.ac.ke',
        'password' => Hash::make('password'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]);
    $testLeader->assignRole('club-leader');
    
    echo "\n=== NEW TEST CLUB LEADER (created) ===\n";
    echo "Email: leader@students.kcau.ac.ke\n";
    echo "Password: password\n";
    echo "Ready to create/manage clubs\n";
} else {
    echo "\n=== TEST CLUB LEADER (already exists) ===\n";
    echo "Email: leader@students.kcau.ac.ke\n";
    echo "Password: password\n";
}
