<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Event $event,
        private readonly ?string $reason = null,
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
        $message = (new MailMessage)
            ->subject("Event Submission Update — KCAU Events")
            ->greeting('Event Submission Update')
            ->line("Your event **{$this->event->title}** has been rejected.");

        if ($this->reason) {
            $message->line("**Reason:** {$this->reason}");
        }

        return $message
            ->action('Edit Event', url("/events/{$this->event->slug}/edit"))
            ->line('You can update your event and resubmit it for approval.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            'type' => 'event_rejected',
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'reason' => $this->reason,
            'title' => 'Event Submission Rejected',
            'message' => "{$this->event->title} was rejected. You can edit and resubmit.",
        ]);
    }
}
