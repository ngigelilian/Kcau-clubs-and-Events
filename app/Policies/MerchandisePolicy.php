<?php

namespace App\Policies;

use App\Models\Merchandise;
use App\Models\User;

class MerchandisePolicy
{
    /**
     * Determine whether the user can view any merchandise.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the merchandise.
     */
    public function view(User $user, Merchandise $merchandise): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create merchandise.
     * Only club leaders can create merchandise for their club.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'super-admin'])
            || $user->clubMemberships()->leaders()->active()->exists();
    }

    /**
     * Determine whether the user can update the merchandise.
     */
    public function update(User $user, Merchandise $merchandise): bool
    {
        return $user->isLeaderOf($merchandise->club)
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can delete the merchandise.
     */
    public function delete(User $user, Merchandise $merchandise): bool
    {
        return $user->isLeaderOf($merchandise->club)
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can purchase merchandise.
     */
    public function purchase(User $user, Merchandise $merchandise): bool
    {
        return $merchandise->isInStock();
    }
}
