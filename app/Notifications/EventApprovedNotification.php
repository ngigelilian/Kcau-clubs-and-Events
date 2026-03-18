<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Event $event,
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
        $eventDate = $this->event->start_datetime->format('l, F j, Y');
        $clubText = $this->event->club ? "**Club:** {$this->event->club->name}\n\n" : '';

        return (new MailMessage)
            ->subject("Event Approved: {$this->event->title} — KCAU Events")
            ->greeting('Event Approved!')
            ->line("Your event **{$this->event->title}** has been approved and is now live.")
            ->line($clubText)
            ->line("**Date:** {$eventDate}")
            ->action('View Event', url("/events/{$this->event->slug}"))
            ->line('Students can now register for this event.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        return new DatabaseMessage([
            'type' => 'event_approved',
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'event_date' => $this->event->start_datetime->toDateTimeString(),
            'title' => 'Event Approved',
            'message' => "{$this->event->title} has been approved.",
        ]);
    }
}
