<?php

namespace App\Enums;

enum ClubStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Suspended = 'suspended';
    case Disbanded = 'disbanded';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Approval',
            self::Active => 'Active',
            self::Suspended => 'Suspended',
            self::Disbanded => 'Disbanded',
        };
    }

    /**
     * Get the badge color for UI display.
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending => 'yellow',
            self::Active => 'green',
            self::Suspended => 'red',
            self::Disbanded => 'gray',
        };
    }
}
