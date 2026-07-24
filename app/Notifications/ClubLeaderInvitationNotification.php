<?php

namespace App\Notifications;

use App\Models\ClubLeaderInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClubLeaderInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly ClubLeaderInvitation $invitation,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $club = $this->invitation->club;
        $inviter = $this->invitation->inviter;
        $position = $this->invitation->position->label();

        return (new MailMessage)
            ->subject("You've been invited to lead {$club->name} — KCAU Events")
            ->greeting('Leadership Invitation')
            ->line("**{$inviter->name}** has invited you to become **{$position}** of **{$club->name}**.")
            ->line('Accepting will give you leadership access for this club — you can create and publish events, manage merchandise, and post announcements.')
            ->action('View Invitation', url('/invitations'))
            ->line('If you did not expect this invitation, you can safely decline it.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $club = $this->invitation->club;
        $inviter = $this->invitation->inviter;
        $position = $this->invitation->position->label();

        return new DatabaseMessage([
            'type' => 'club_leader_invitation',
            'invitation_id' => $this->invitation->id,
            'club_id' => $club->id,
            'club_name' => $club->name,
            'inviter_name' => $inviter->name,
            'position' => $this->invitation->position->value,
            'title' => 'Leadership Invitation',
            'message' => "{$inviter->name} invited you to become {$position} of {$club->name}",
        ]);
    }
}
