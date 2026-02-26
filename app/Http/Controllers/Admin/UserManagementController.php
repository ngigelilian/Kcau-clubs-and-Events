<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::query()
            ->with('roles:id,name');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('email', 'ILIKE', "%{$search}%")
                  ->orWhere('student_id', 'ILIKE', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->role($role);
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $users = $query->latest()->paginate(20)->withQueryString();

        $roles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $request->input('search', ''),
                'role' => $request->input('role', ''),
                'active' => $request->input('active', ''),
            ],
            'roles' => $roles,
        ]);
    }

    public function show(User $user): Response
    {
        $user->load('roles:id,name');

        $user->loadCount([
            'clubMemberships as clubs_count' => fn ($q) => $q->where('status', 'active'),
            'eventRegistrations as events_count',
            'orders as orders_count',
            'tickets as tickets_count',
        ]);

        $roles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/users/show', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function toggleActive(User $user)
    {
        if ($user->hasRole('super-admin') && ! auth()->user()->hasRole('super-admin')) {
            return back()->with('error', 'Cannot modify super admin account.');
        }

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', $user->is_active ? 'User activated.' : 'User deactivated.');
    }

    public function updateRole(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Cannot change your own role.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        // Only super-admin can assign admin/super-admin roles
        if (in_array($validated['role'], ['admin', 'super-admin']) && ! auth()->user()->hasRole('super-admin')) {
            return back()->with('error', 'Only super admins can assign admin roles.');
        }

        $user->syncRoles([$validated['role']]);

        return back()->with('success', "User role updated to {$validated['role']}.");
    }
}
