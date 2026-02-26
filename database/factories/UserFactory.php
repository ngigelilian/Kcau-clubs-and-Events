<?php

namespace Database\Factories;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $gender = fake()->randomElement(Gender::cases());

        return [
            'name' => fake()->name($gender->value === 'other' ? null : $gender->value),
            'student_id' => strtoupper(fake()->unique()->bothify('??/####/##')),
            'email' => fake()->unique()->safeEmail(),
            'avatar' => null,
            'phone' => fake()->regexify('07[0-9]{8}'),
            'gender' => $gender,
            'department' => fake()->randomElement([
                'Computer Science', 'Information Technology', 'Business Administration',
                'Accounting', 'Finance', 'Economics', 'Law', 'Education',
                'Journalism', 'Engineering', 'Mathematics', 'Statistics',
            ]),
            'year_of_study' => fake()->numberBetween(1, 4),
            'google_id' => null,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'is_active' => true,
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'student_id' => null,
            'email' => fake()->unique()->safeEmail(),
            'year_of_study' => null,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function oauthUser(): static
    {
        return $this->state(fn (array $attributes) => [
            'google_id' => (string) fake()->unique()->randomNumber(8),
            'password' => null,
            'avatar' => 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        ]);
    }
}
