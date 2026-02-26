<?php

namespace App\Enums;

enum PaymentStatusEnum: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Waived = 'waived';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Paid => 'Paid',
            self::Waived => 'Waived',
        };
    }
}
