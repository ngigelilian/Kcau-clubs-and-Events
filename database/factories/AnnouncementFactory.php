<?php

namespace Database\Factories;

use App\Enums\AnnouncementAudience;
use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Announcement>
 */
class AnnouncementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'club_id' => Club::factory(),
            'user_id' => User::factory(),
            'title' => fake()->sentence(rand(4, 8)),
            'body' => fake()->paragraphs(rand(2, 5), true),
            'audience' => AnnouncementAudience::AllMembers,
            'is_email' => fake()->boolean(20),
            'published_at' => now()->subDays(fake()->numberBetween(0, 30)),
        ];
    }

    public function systemWide(): static
    {
        return $this->state(fn (array $attributes) => [
            'club_id' => null,
            'audience' => AnnouncementAudience::AllMembers,
        ]);
    }

    public function leadersOnly(): static
    {
        return $this->state(fn (array $attributes) => [
            'audience' => AnnouncementAudience::LeadersOnly,
        ]);
    }

    public function unpublished(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => null,
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'published_at' => now()->addDays(fake()->numberBetween(1, 14)),
        ]);
    }

    public function withEmail(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_email' => true,
        ]);
    }
}
