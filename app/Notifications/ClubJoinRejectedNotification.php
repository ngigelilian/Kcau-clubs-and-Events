<?php

namespace App\Notifications;

use App\Models\ClubMembership;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClubJoinRejectedNotification extends Notification implements ShouldQueue
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
            ->subject("Club Request Update — KCAU Events")
            ->greeting('Update on Your Club Request')
            ->line("Your request to join **{$club->name}** has been declined.")
            ->action('Explore Other Clubs', url('/clubs'))
            ->line('Feel free to request to join other clubs.');
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
            'type' => 'club_join_rejected',
            'club_id' => $club->id,
            'club_name' => $club->name,
            'title' => 'Club Membership Request Declined',
            'message' => "Your request to join {$club->name} has been declined.",
        ]);
    }
}
