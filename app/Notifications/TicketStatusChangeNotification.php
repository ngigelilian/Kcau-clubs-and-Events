<?php

namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketStatusChangeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Ticket $ticket,
        public string $oldStatus,
        public string $newStatus,
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
        $statusLabel = match ($this->newStatus) {
            'in_progress' => 'In Progress',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            default => ucfirst(str_replace('_', ' ', $this->newStatus)),
        };

        $message = match ($this->newStatus) {
            'in_progress' => 'Your support ticket has been picked up by our support team.',
            'resolved' => 'Your support ticket has been resolved.',
            'closed' => 'Your support ticket has been closed.',
            default => "Your support ticket status has changed to {$statusLabel}.",
        };

        return (new MailMessage)
            ->subject("Ticket #{$this->ticket->id} - Status Update: {$statusLabel}")
            ->greeting("Hello {$notifiable->name},")
            ->line($message)
            ->line("**Ticket:** {$this->ticket->subject}")
            ->action('View Ticket', url("/tickets/{$this->ticket->id}"))
            ->line('Thank you for your patience!');
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $statusLabel = match ($this->newStatus) {
            'in_progress' => 'In Progress',
            'resolved' => 'Resolved',
            'closed' => 'Closed',
            default => ucfirst(str_replace('_', ' ', $this->newStatus)),
        };

        return new DatabaseMessage([
            'title' => "Ticket status updated",
            'message' => "Your ticket \"{$this->ticket->subject}\" is now {$statusLabel}.",
            'ticket_id' => $this->ticket->id,
            'type' => 'ticket_status_change',
            'status' => $this->newStatus,
        ]);
    }
}
