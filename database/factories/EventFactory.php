<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Club;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(rand(3, 6));
        $startDate = fake()->dateTimeBetween('+1 day', '+3 months');
        $endDate = (clone $startDate)->modify('+' . rand(1, 8) . ' hours');
        $isPaid = fake()->boolean(30);

        return [
            'title' => $title,
            'slug' => Str::slug($title),
            'description' => fake()->paragraphs(3, true),
            'club_id' => Club::factory(),
            'type' => EventType::Club,
            'venue' => fake()->randomElement([
                'Main Hall', 'Auditorium', 'Conference Room A', 'Conference Room B',
                'Sports Ground', 'Library Seminar Room', 'Student Center',
                'ICT Lab 1', 'ICT Lab 2', 'Open Air Theatre', 'Chapel Hall',
            ]),
            'start_datetime' => $startDate,
            'end_datetime' => $endDate,
            'capacity' => fake()->optional(0.6)->numberBetween(30, 500),
            'registration_deadline' => (clone $startDate)->modify('-1 day'),
            'is_paid' => $isPaid,
            'fee_amount' => $isPaid ? fake()->randomElement([20000, 50000, 100000, 150000, 200000]) : 0,
            'status' => EventStatus::Approved,
            'created_by' => User::factory(),
            'approved_by' => null,
            'approved_at' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Draft,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Pending,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Approved,
            'approved_by' => User::factory(),
            'approved_at' => now()->subDays(fake()->numberBetween(1, 14)),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Cancelled,
        ]);
    }

    public function completed(): static
    {
        $start = fake()->dateTimeBetween('-60 days', '-1 day');

        return $this->state(fn (array $attributes) => [
            'status' => EventStatus::Completed,
            'start_datetime' => $start,
            'end_datetime' => (clone $start)->modify('+3 hours'),
        ]);
    }

    public function schoolWide(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => EventType::School,
            'club_id' => null,
        ]);
    }

    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_paid' => false,
            'fee_amount' => 0,
        ]);
    }

    public function paid(int $amountInCents = 50000): static
    {
        return $this->state(fn (array $attributes) => [
            'is_paid' => true,
            'fee_amount' => $amountInCents,
        ]);
    }

    public function past(): static
    {
        $start = fake()->dateTimeBetween('-90 days', '-1 day');

        return $this->state(fn (array $attributes) => [
            'start_datetime' => $start,
            'end_datetime' => (clone $start)->modify('+4 hours'),
            'registration_deadline' => (clone $start)->modify('-1 day'),
        ]);
    }

    public function upcoming(): static
    {
        $start = fake()->dateTimeBetween('+1 day', '+60 days');

        return $this->state(fn (array $attributes) => [
            'start_datetime' => $start,
            'end_datetime' => (clone $start)->modify('+4 hours'),
            'registration_deadline' => (clone $start)->modify('-1 day'),
        ]);
    }
}
