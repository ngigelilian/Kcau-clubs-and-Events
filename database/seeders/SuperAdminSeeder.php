<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seed the Super Admin user.
     */
    public function run(): void
    {
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@kcau.ac.ke'],
            [
                'name' => 'Super Admin',
                'password' => 'password',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        $superAdmin->assignRole('super-admin');

        // Create a secondary admin for testing
        $admin = User::updateOrCreate(
            ['email' => 'admin2@kcau.ac.ke'],
            [
                'name' => 'Administrator',
                'password' => 'password',
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        $admin->assignRole('admin');
    }
}
