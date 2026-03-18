<?php

namespace App\Notifications;

use App\Models\ClubMembership;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMembershipRequestNotification extends Notification implements ShouldQueue
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
        $user = $this->membership->user;
        $club = $this->membership->club;

        return (new MailMessage)
            ->subject("New Member Request: {$club->name} — KCAU Events")
            ->greeting('New Membership Request')
            ->line("**{$user->name}** has requested to join **{$club->name}**.")
            ->action('Review Request', url("/clubs/{$club->slug}/members"))
            ->line('Approve or reject this membership request.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $user = $this->membership->user;
        $club = $this->membership->club;

        return new DatabaseMessage([
            'type' => 'new_membership_request',
            'membership_id' => $this->membership->id,
            'club_id' => $club->id,
            'user_name' => $user->name,
            'club_name' => $club->name,
            'title' => 'New Membership Request',
            'message' => "{$user->name} requested to join {$club->name}",
        ]);
    }
}
