<?php

namespace App\Notifications;

use App\Models\ClubMembership;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClubJoinApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly ClubMembership $membership,
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
        $club = $this->membership->club;

        return (new MailMessage)
            ->subject("Welcome to {$club->name}! — KCAU Events")
            ->greeting("Welcome to {$club->name}!")
            ->line('Your request to join the club has been approved.')
            ->action('View Club', url("/clubs/{$club->slug}"))
            ->line('Start exploring club events and updates.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $club = $this->membership->club;

        return new DatabaseMessage([
            'type' => 'club_join_approved',
            'club_id' => $club->id,
            'club_name' => $club->name,
            'title' => 'Club Membership Approved',
            'message' => "Your request to join {$club->name} has been approved.",
        ]);
    }
}
