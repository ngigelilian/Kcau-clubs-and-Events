<?php

namespace Database\Factories;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'subject' => fake()->randomElement([
                'Cannot join a club', 'Payment not reflected', 'Event registration failed',
                'Need to change my email', 'Two-factor authentication issue',
                'Club proposal not reviewed', 'Cannot access my account',
                'Merchandise order not received', 'Event attendance not marked',
                'Need role change', 'Bug report: page not loading',
                'Feature request: calendar view', 'Profile update issue',
            ]),
            'description' => fake()->paragraphs(2, true),
            'status' => TicketStatus::Open,
            'priority' => fake()->randomElement(TicketPriority::cases()),
            'assigned_to' => null,
            'resolved_at' => null,
            'closed_at' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::InProgress,
            'assigned_to' => User::factory(),
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::Resolved,
            'assigned_to' => User::factory(),
            'resolved_at' => now(),
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::Closed,
            'resolved_at' => now()->subDays(1),
            'closed_at' => now(),
        ]);
    }

    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TicketPriority::High,
        ]);
    }

    public function lowPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TicketPriority::Low,
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketStatus::Open,
            'created_at' => now()->subHours(72),
            'updated_at' => now()->subHours(72),
        ]);
    }
}
