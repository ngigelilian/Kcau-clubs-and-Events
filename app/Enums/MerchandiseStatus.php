<?php

namespace App\Enums;

enum MerchandiseStatus: string
{
    case Pending = 'pending';
    case Available = 'available';
    case OutOfStock = 'out_of_stock';
    case Discontinued = 'discontinued';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Approval',
            self::Available => 'Available',
            self::OutOfStock => 'Out of Stock',
            self::Discontinued => 'Discontinued',
        };
    }

    /**
     * Get the badge color for UI display.
     */
    public function color(): string
    {
        return match ($this) {
            self::Pending => 'amber',
            self::Available => 'green',
            self::OutOfStock => 'yellow',
            self::Discontinued => 'red',
        };
    }
}
