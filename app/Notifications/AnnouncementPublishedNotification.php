<?php

namespace App\Notifications;

use App\Models\Announcement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AnnouncementPublishedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Announcement $announcement,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        // Send email if announcement has is_email flag and user is a member
        if ($this->announcement->is_email) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $club = $this->announcement->club;

        return (new MailMessage)
            ->subject("{$club->name}: {$this->announcement->title} — KCAU Events")
            ->greeting("Hello {$notifiable->name}!")
            ->line("**{$club->name}** has a new announcement:")
            ->line("\n{$this->announcement->title}\n")
            ->line($this->announcement->body)
            ->action('Read Full Announcement', url("/announcements/{$this->announcement->id}"))
            ->line('Stay tuned for more updates!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $club = $this->announcement->club;

        return new DatabaseMessage([
            'type' => 'announcement_published',
            'announcement_id' => $this->announcement->id,
            'club_id' => $club->id,
            'club_name' => $club->name,
            'title' => $this->announcement->title,
            'message' => "{$club->name}: {$this->announcement->title}",
        ]);
    }
}
