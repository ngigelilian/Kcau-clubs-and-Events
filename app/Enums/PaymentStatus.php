<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Initiated = 'initiated';
    case Pending = 'pending';
    case Completed = 'completed';
    case Failed = 'failed';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Initiated => 'Initiated',
            self::Pending => 'Pending',
            self::Completed => 'Completed',
            self::Failed => 'Failed',
        };
    }

    /**
     * Get the badge color for UI display.
     */
    public function color(): string
    {
        return match ($this) {
            self::Initiated => 'gray',
            self::Pending => 'yellow',
            self::Completed => 'green',
            self::Failed => 'red',
        };
    }
}
