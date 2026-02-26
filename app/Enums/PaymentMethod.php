<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Mpesa = 'mpesa';

    /**
     * Get a human-readable label for the payment method.
     */
    public function label(): string
    {
        return match ($this) {
            self::Mpesa => 'M-Pesa',
        };
    }
}
