<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Seed the application's roles and permissions.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // =====================================================================
        // Permissions
        // =====================================================================

        $permissions = [
            // System
            'manage-settings',
            'view-activity-log',

            // Users
            'manage-users',
            'assign-admin-role',

            // Clubs
            'approve-clubs',
            'create-clubs',
            'manage-club-members',
            'manage-club-merchandise',
            'send-club-announcements',
            'view-club-reports',

            // Events
            'approve-events',
            'create-school-events',
            'create-club-events',
            'manage-event-attendance',

            // Finance
            'view-financial-reports',

            // Tickets
            'manage-tickets',
            'create-tickets',

            // General
            'browse-clubs',
            'browse-events',
            'join-clubs',
            'register-events',
            'purchase-merchandise',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // =====================================================================
        // Roles
        // =====================================================================

        // Super Admin — all permissions (uses Gate::before in AuthServiceProvider)
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions([
            'manage-users',
            'view-activity-log',
            'approve-clubs',
            'approve-events',
            'create-school-events',
            'view-club-reports',
            'view-financial-reports',
            'manage-tickets',
            'browse-clubs',
            'browse-events',
            'register-events',
            'purchase-merchandise',
        ]);

        // Club Leader
        $clubLeader = Role::firstOrCreate(['name' => 'club-leader']);
        $clubLeader->syncPermissions([
            'create-club-events',
            'manage-club-members',
            'manage-club-merchandise',
            'send-club-announcements',
            'manage-event-attendance',
            'view-club-reports',
            'create-tickets',
            'browse-clubs',
            'browse-events',
            'register-events',
            'purchase-merchandise',
        ]);

        // Student
        $student = Role::firstOrCreate(['name' => 'student']);
        $student->syncPermissions([
            'create-clubs',
            'create-tickets',
            'browse-clubs',
            'browse-events',
            'join-clubs',
            'register-events',
            'purchase-merchandise',
        ]);
    }
}
