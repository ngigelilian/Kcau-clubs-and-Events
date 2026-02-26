<?php

namespace App\Enums;

enum AnnouncementAudience: string
{
    case AllMembers = 'all_members';
    case LeadersOnly = 'leaders_only';
    case SpecificClub = 'specific_club';

    /**
     * Get a human-readable label for the audience.
     */
    public function label(): string
    {
        return match ($this) {
            self::AllMembers => 'All Members',
            self::LeadersOnly => 'Leaders Only',
            self::SpecificClub => 'Specific Club',
        };
    }
}
