<?php

namespace App\Console\Commands;

use App\Enums\InvitationStatus;
use App\Models\ClubLeaderInvitation;
use Illuminate\Console\Command;

class ExpireClubLeaderInvitationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clubs:expire-leader-invitations';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Mark pending club leadership invitations as Expired once their expiry window has passed';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = ClubLeaderInvitation::query()
            ->where('status', InvitationStatus::Pending)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => InvitationStatus::Expired]);

        $this->info("Expired {$count} stale club leadership invitation(s).");

        return self::SUCCESS;
    }
}
