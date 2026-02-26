<?php

namespace App\Enums;

enum EventType: string
{
    case Club = 'club';
    case School = 'school';

    /**
     * Get a human-readable label for the event type.
     */
    public function label(): string
    {
        return match ($this) {
            self::Club => 'Club Event',
            self::School => 'School-Wide Event',
        };
    }
}
