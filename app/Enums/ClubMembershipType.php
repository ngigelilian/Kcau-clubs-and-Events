<?php

namespace App\Enums;

enum ClubMembershipType: string
{
    case Free = 'free';
    case Subscription = 'subscription';
    case Hybrid = 'hybrid';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Free to Join',
            self::Subscription => 'Subscription',
            self::Hybrid => 'Hybrid',
        };
    }
}
