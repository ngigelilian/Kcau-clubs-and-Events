<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    /**
     * Determine whether the user can view any tickets.
     * Admins see all; users see their own.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the ticket.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        return $ticket->user_id === $user->id
            || $ticket->assigned_to === $user->id
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can create tickets.
     * Any authenticated user (Student, Admin, Super Admin) can create a support ticket.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['student', 'admin', 'super-admin']);
    }

    /**
     * Determine whether the user can reply to the ticket.
     */
    public function reply(User $user, Ticket $ticket): bool
    {
        return $ticket->user_id === $user->id
            || $ticket->assigned_to === $user->id
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can assign the ticket.
     */
    public function assign(User $user, Ticket $ticket): bool
    {
        return $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can close the ticket.
     */
    public function close(User $user, Ticket $ticket): bool
    {
        return $ticket->user_id === $user->id
            || $ticket->assigned_to === $user->id
            || $user->hasRole(['admin', 'super-admin']);
    }

    /**
     * Determine whether the user can resolve the ticket.
     */
    public function resolve(User $user, Ticket $ticket): bool
    {
        return $ticket->assigned_to === $user->id
            || $user->hasRole(['admin', 'super-admin']);
    }
}
