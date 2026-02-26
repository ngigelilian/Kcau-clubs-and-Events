<?php

namespace App\Enums;

enum TicketPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';

    /**
     * Get a human-readable label for the priority.
     */
    public function label(): string
    {
        return match ($this) {
            self::Low => 'Low',
            self::Medium => 'Medium',
            self::High => 'High',
        };
    }

    /**
     * Get the badge color for UI display.
     */
    public function color(): string
    {
        return match ($this) {
            self::Low => 'gray',
            self::Medium => 'yellow',
            self::High => 'red',
        };
    }
}
