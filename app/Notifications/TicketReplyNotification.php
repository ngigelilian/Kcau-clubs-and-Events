<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class TicketReplyNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Ticket $ticket,
        public TicketReply $reply,
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
        $replierName = $this->reply->user->name;
        $isAdminReply = $this->reply->user->hasRole(['admin', 'super-admin']);

        return (new MailMessage)
            ->subject($isAdminReply ? "Response to your support ticket: #{$this->ticket->id}" : "New reply to ticket: #{$this->ticket->id}")
            ->greeting("Hello {$notifiable->name},")
            ->line($isAdminReply ? "{$replierName} has responded to your support ticket." : "{$replierName} has replied to the ticket.")
            ->line("**Ticket:** {$this->ticket->subject}")
            ->line("**Reply:** " . Str::limit($this->reply->message, 100))
            ->action('View Ticket', url("/tickets/{$this->ticket->id}"))
            ->line('Thank you for using KCAU Events!');
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $replierName = $this->reply->user->name;
        $isAdminReply = $this->reply->user->hasRole(['admin', 'super-admin']);

        return new DatabaseMessage([
            'title' => $isAdminReply ? "Response to your ticket" : "New reply",
            'message' => "{$replierName} replied to your ticket: {$this->ticket->subject}",
            'ticket_id' => $this->ticket->id,
            'reply_id' => $this->reply->id,
            'type' => 'ticket_reply',
        ]);
    }
}
