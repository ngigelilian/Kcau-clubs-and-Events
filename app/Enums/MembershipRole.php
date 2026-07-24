<?php

namespace App\Enums;

enum MembershipRole: string
{
    case Member = 'member';
    case Chairperson = 'chairperson';
    case Secretary = 'secretary';
    case Treasurer = 'treasurer';
    case CoChair = 'co_chair';

    /**
     * Get a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::Member => 'Member',
            self::Chairperson => 'Chairperson',
            self::Secretary => 'Secretary',
            self::Treasurer => 'Treasurer',
            self::CoChair => 'Co-Chair',
        };
    }

    /**
     * All positions that count as "holding a leadership position" in a club
     * (i.e. anything other than a plain Member). Any of these can create/
     * publish club events, manage merchandise, and post announcements.
     *
     * @return list<self>
     */
    public static function leadershipRoles(): array
    {
        return [self::Chairperson, self::Secretary, self::Treasurer, self::CoChair];
    }

    /**
     * Positions that can be assigned to someone via an invite or a
     * promotion. Chairperson is deliberately excluded — you only become
     * Chairperson by proposing the club, being auto-promoted on succession,
     * or via an explicit transfer, never via a normal invite.
     *
     * @return list<self>
     */
    public static function assignablePositions(): array
    {
        return [self::Secretary, self::Treasurer, self::CoChair];
    }

    /**
     * Whether this position holds general leadership privileges (create/
     * publish events, manage merchandise, post announcements).
     */
    public function isLeadership(): bool
    {
        return $this !== self::Member;
    }

    /**
     * Whether this position holds the club's sensitive privileges (invite/
     * remove leaders, transfer chairpersonship, disband the club).
     */
    public function isChairperson(): bool
    {
        return $this === self::Chairperson;
    }
}
