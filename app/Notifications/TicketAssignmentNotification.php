<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketAssignmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Ticket $ticket,
        public string $assignedByName,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Ticket #{$this->ticket->id} Assigned to You")
            ->greeting("Hello {$notifiable->name},")
            ->line("A support ticket has been assigned to you by {$this->assignedByName}.")
            ->line("**Ticket ID:** #{$this->ticket->id}")
            ->line("**Subject:** {$this->ticket->subject}")
            ->line("**Priority:** " . ucfirst($this->ticket->priority->value))
            ->action('View Ticket', url("/tickets/{$this->ticket->id}"))
            ->line('Please review and respond to the ticket as soon as possible.');
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            'title' => "Ticket assigned to you",
            'message' => "Ticket #{$this->ticket->id} (\"{$this->ticket->subject}\") has been assigned to you.",
            'ticket_id' => $this->ticket->id,
            'type' => 'ticket_assignment',
        ]);
    }
}
