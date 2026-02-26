<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Event;
use App\Models\Merchandise;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 3);
        $unitPrice = fake()->randomElement([50000, 100000, 150000, 200000]);

        return [
            'user_id' => User::factory(),
            'orderable_type' => Merchandise::class,
            'orderable_id' => Merchandise::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_amount' => $unitPrice * $quantity,
            'status' => OrderStatus::Pending,
            'mpesa_reference' => null,
        ];
    }

    public function forEvent(): static
    {
        return $this->state(fn (array $attributes) => [
            'orderable_type' => Event::class,
            'orderable_id' => Event::factory(),
            'quantity' => 1,
        ]);
    }

    public function forMerchandise(): static
    {
        return $this->state(fn (array $attributes) => [
            'orderable_type' => Merchandise::class,
            'orderable_id' => Merchandise::factory(),
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Paid,
            'mpesa_reference' => strtoupper(fake()->bothify('??##??####')),
        ]);
    }

    public function fulfilled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Fulfilled,
            'mpesa_reference' => strtoupper(fake()->bothify('??##??####')),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::Cancelled,
        ]);
    }
}
