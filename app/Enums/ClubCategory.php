<?php

namespace App\Enums;

enum ClubCategory: string
{
    case Academic = 'academic';
    case Cultural = 'cultural';
    case Sports = 'sports';
    case Religious = 'religious';
    case Technology = 'technology';
    case Social = 'social';
    case Other = 'other';

    /**
     * Get a human-readable label for the category.
     */
    public function label(): string
    {
        return match ($this) {
            self::Academic => 'Academic',
            self::Cultural => 'Cultural',
            self::Sports => 'Sports',
            self::Religious => 'Religious',
            self::Technology => 'Technology',
            self::Social => 'Social',
            self::Other => 'Other',
        };
    }
}
