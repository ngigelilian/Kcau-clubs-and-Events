<?php

namespace Database\Factories;

use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ClubMembership>
 */
class ClubMembershipFactory extends Factory
{
    public function definition(): array
    {
        return [
            'club_id' => Club::factory(),
            'user_id' => User::factory(),
            'role' => MembershipRole::Member,
            'status' => MembershipStatus::Active,
            'membership_fee_due' => 0,
            'membership_fee_waived' => true,
            'joined_at' => now()->subDays(fake()->numberBetween(1, 180)),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MembershipStatus::Pending,
            'joined_at' => null,
        ]);
    }

    public function leader(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => MembershipRole::Leader,
        ]);
    }

    public function coLeader(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => MembershipRole::CoLeader,
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MembershipStatus::Rejected,
            'joined_at' => null,
        ]);
    }
}
