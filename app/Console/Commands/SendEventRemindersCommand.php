<?php

namespace App\Console\Commands;

use App\Enums\RegistrationStatus;
use App\Models\EventRegistration;
use App\Notifications\EventReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendEventRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'send:event-reminders';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Send email reminders to users 24 hours before event start time';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Get events starting between now + 23.5 hours and now + 24.5 hours
        // This ensures we catch events even if the command is run at slightly different times
        $now = now();
        $startMin = $now->copy()->addHours(23.5);
        $startMax = $now->copy()->addHours(24.5);

        $registrations = EventRegistration::query()
            ->with(['user', 'event'])
            ->where('status', RegistrationStatus::Registered)
            ->whereHas('event', function ($q) use ($startMin, $startMax) {
                $q->whereBetween('start_datetime', [$startMin, $startMax]);
            })
            ->get();

        if ($registrations->isEmpty()) {
            $this->info('No events require reminders at this time.');
            return Command::SUCCESS;
        }

        $count = 0;
        foreach ($registrations as $registration) {
            try {
                Notification::send(
                    $registration->user,
                    new EventReminderNotification($registration->event)
                );
                $count++;
            } catch (\Exception $e) {
                $this->error("Failed to send reminder for user {$registration->user_id} and event {$registration->event_id}: " . $e->getMessage());
            }
        }

        $this->info("Successfully sent {$count} event reminder notifications.");
        return Command::SUCCESS;
    }
}
