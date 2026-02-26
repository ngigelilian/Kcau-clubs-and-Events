<?php

namespace Database\Factories;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'user_id' => User::factory(),
            'amount' => fake()->randomElement([50000, 100000, 150000, 200000]),
            'phone_number' => fake()->regexify('2547[0-9]{8}'),
            'mpesa_checkout_request_id' => strtoupper(fake()->bothify('ws_CO_########_######_####')),
            'mpesa_receipt_number' => null,
            'status' => PaymentStatus::Pending,
            'payment_method' => PaymentMethod::Mpesa,
            'paid_at' => null,
            'failed_at' => null,
            'failure_reason' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::Completed,
            'mpesa_receipt_number' => strtoupper(fake()->bothify('??##??####')),
            'paid_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::Failed,
            'failed_at' => now(),
            'failure_reason' => fake()->randomElement([
                'Insufficient funds', 'Transaction cancelled by user',
                'Request timed out', 'Invalid PIN entered',
            ]),
        ]);
    }

    public function initiated(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::Initiated,
        ]);
    }
}
