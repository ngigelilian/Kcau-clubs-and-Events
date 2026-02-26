<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the order.
     * Users can only view their own orders; admins can view all.
     */
    public function view(User $user, Order $order): bool
    {
        return $order->user_id === $user->id
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can cancel the order.
     */
    public function cancel(User $user, Order $order): bool
    {
        return ($order->user_id === $user->id && $order->status->value === 'pending')
            || $user->hasRole(['admin', 'super-admin']);
    }
}
