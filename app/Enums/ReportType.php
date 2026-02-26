<?php

namespace App\Enums;

enum ReportType: string
{
    case Participation = 'participation';
    case Financial = 'financial';
    case ClubPerformance = 'club_performance';
    case UserActivity = 'user_activity';

    /**
     * Get a human-readable label for the report type.
     */
    public function label(): string
    {
        return match ($this) {
            self::Participation => 'Participation Report',
            self::Financial => 'Financial Report',
            self::ClubPerformance => 'Club Performance Report',
            self::UserActivity => 'User Activity Report',
        };
    }
}
