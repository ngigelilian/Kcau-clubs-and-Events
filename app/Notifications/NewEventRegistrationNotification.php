<?php

namespace App\Notifications;

use App\Models\EventRegistration;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewEventRegistrationNotification extends Notification implements ShouldQueue
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
        $user = $this->registration->user;
        $event = $this->registration->event;

        return (new MailMessage)
            ->subject("New Registration: {$event->title} — KCAU Events")
            ->greeting('New Event Registration')
            ->line("**{$user->name}** has registered for **{$event->title}**.")
            ->line("**Total Registrations:** {$event->registrations()->count()}")
            ->action('View Registrations', url("/events/{$event->slug}/attendees"))
            ->line('Keep track of your event registrations.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $user = $this->registration->user;
        $event = $this->registration->event;

        return new DatabaseMessage([
            'type' => 'new_event_registration',
            'registration_id' => $this->registration->id,
            'event_id' => $event->id,
            'user_name' => $user->name,
            'event_title' => $event->title,
            'title' => 'New Event Registration',
            'message' => "{$user->name} registered for {$event->title}",
        ]);
    }
}
