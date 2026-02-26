<?php

namespace Database\Factories;

use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Report>
 */
class ReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(ReportType::cases()),
            'generated_by' => User::factory(),
            'parameters' => [
                'date_from' => now()->subMonths(3)->toDateString(),
                'date_to' => now()->toDateString(),
            ],
            'file_path' => null,
            'status' => ReportStatus::Pending,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReportStatus::Completed,
            'file_path' => 'reports/' . fake()->uuid() . '.pdf',
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReportStatus::Processing,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ReportStatus::Failed,
        ]);
    }

    public function financial(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ReportType::Financial,
        ]);
    }

    public function participation(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => ReportType::Participation,
        ]);
    }
}
