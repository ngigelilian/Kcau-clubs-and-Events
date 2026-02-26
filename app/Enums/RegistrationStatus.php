<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case Registered = 'registered';
    case Attended = 'attended';
    case Cancelled = 'cancelled';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Registered => 'Registered',
            self::Attended => 'Attended',
            self::Cancelled => 'Cancelled',
        };
    }
}
