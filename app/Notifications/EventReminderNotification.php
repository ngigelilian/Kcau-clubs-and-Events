<?php

namespace App\Notifications;

use App\Models\Event;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventReminderNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(private Event $event)
    {
    }

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
            ->subject("Reminder: {$this->event->title} starts tomorrow")
            ->greeting("Hi {$notifiable->name},")
            ->line("This is a friendly reminder that the event you registered for is starting tomorrow!")
            ->line('Event: ' . $this->event->title)
            ->line('Date: ' . $this->event->start_datetime->format('F j, Y'))
            ->line('Time: ' . $this->event->start_datetime->format('g:i A'))
            ->when($this->event->location, function ($message) {
                return $message->line('Location: ' . $this->event->location);
            })
            ->action('View Event Details', route('events.show', $this->event))
            ->line('We look forward to seeing you there!')
            ->line('Thank you for being part of KCAU Events.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_id' => $this->event->id,
            'event_title' => $this->event->title,
            'event_start' => $this->event->start_datetime,
            'event_location' => $this->event->location,
            'message' => "Reminder: {$this->event->title} starts tomorrow at " . $this->event->start_datetime->format('g:i A'),
        ];
    }
}
