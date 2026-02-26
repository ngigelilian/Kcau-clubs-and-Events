<?php

namespace Database\Factories;

use App\Enums\MerchandiseStatus;
use App\Models\Club;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Merchandise>
 */
class MerchandiseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'club_id' => Club::factory(),
            'name' => fake()->randomElement([
                'Club T-Shirt', 'Branded Hoodie', 'Club Cap', 'Wristband',
                'Lanyard', 'Notebook & Pen Set', 'Club Mug', 'Tote Bag',
                'Club Jersey', 'Sticker Pack', 'Branded Water Bottle',
            ]) . ' - ' . fake()->colorName(),
            'description' => fake()->paragraph(2),
            'price' => fake()->randomElement([30000, 50000, 80000, 100000, 120000, 150000, 200000, 250000]),
            'stock_quantity' => fake()->numberBetween(5, 100),
            'status' => MerchandiseStatus::Available,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
            'status' => MerchandiseStatus::OutOfStock,
        ]);
    }

    public function discontinued(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => MerchandiseStatus::Discontinued,
        ]);
    }

    public function cheap(): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => fake()->randomElement([10000, 20000, 30000]),
        ]);
    }

    public function expensive(): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => fake()->randomElement([300000, 400000, 500000]),
        ]);
    }
}
