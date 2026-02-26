<?php

namespace App\Enums;

enum MembershipRole: string
{
    case Member = 'member';
    case Leader = 'leader';
    case CoLeader = 'co-leader';

    /**
     * Get a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::Member => 'Member',
            self::Leader => 'Club Leader',
            self::CoLeader => 'Co-Leader',
        };
    }
}
