<?php

namespace App\Notifications;

use App\Models\EventRegistration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventRegistrationConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly EventRegistration $registration,
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
        $event = $this->registration->event;
        $eventDate = $event->start_datetime->format('l, F j, Y \a\t g:i A');

        return (new MailMessage)
            ->subject("You're Registered — {$event->title} - KCAU Events")
            ->greeting('Registration Confirmed!')
            ->line("You have been successfully registered for **{$event->title}**.")
            ->line("**Event Date:** {$eventDate}")
            ->line("**Venue:** {$event->venue}")
            ->action('View Event Details', url("/events/{$event->slug}"))
            ->line('See you there!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $event = $this->registration->event;

        return new DatabaseMessage([
            'type' => 'event_registration_confirmed',
            'event_id' => $event->id,
            'event_title' => $event->title,
            'event_date' => $event->start_datetime->toDateTimeString(),
            'title' => 'Event Registration Confirmed',
            'message' => "You are registered for {$event->title}.",
        ]);
    }
}
