<?php

namespace Database\Factories;

use App\Enums\PaymentStatusEnum;
use App\Enums\RegistrationStatus;
use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\EventRegistration>
 */
class EventRegistrationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory(),
            'status' => RegistrationStatus::Registered,
            'payment_status' => PaymentStatusEnum::Waived,
            'registered_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'attended_at' => null,
            'cancelled_at' => null,
        ];
    }

    public function attended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RegistrationStatus::Attended,
            'attended_at' => now(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RegistrationStatus::Cancelled,
            'cancelled_at' => now(),
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => PaymentStatusEnum::Paid,
        ]);
    }

    public function pendingPayment(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => PaymentStatusEnum::Pending,
        ]);
    }
}
