<?php

namespace Database\Factories;

use App\Enums\ClubCategory;
use App\Enums\ClubStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Club>
 */
class ClubFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(rand(2, 4), true);
        $name = ucwords($name) . ' Club';

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->paragraphs(3, true),
            'category' => fake()->randomElement(ClubCategory::cases()),
            'status' => ClubStatus::Active,
            'created_by' => User::factory(),
            'approved_by' => null,
            'approved_at' => null,
            'max_members' => fake()->optional(0.4)->numberBetween(20, 200),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ClubStatus::Pending,
            'approved_by' => null,
            'approved_at' => null,
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ClubStatus::Active,
            'approved_by' => User::factory(),
            'approved_at' => now()->subDays(fake()->numberBetween(1, 60)),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ClubStatus::Suspended,
        ]);
    }

    public function category(ClubCategory $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => $category,
        ]);
    }
}
