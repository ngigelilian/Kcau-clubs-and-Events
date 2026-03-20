<?php

namespace App\Http\Requests\Club;

use App\Enums\ClubCategory;
use App\Enums\ClubMembershipType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClubRequest extends FormRequest
{
    /**
     * Normalize incoming values before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('membership_fee')) {
            $feeInCents = (int) round(((float) $this->input('membership_fee')) * 100);
            $this->merge(['membership_fee' => $feeInCents]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('club'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $club = $this->route('club');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('clubs', 'name')->ignore($club->id)],
            'description' => ['required', 'string', 'min:20', 'max:5000'],
            'category' => ['required', Rule::enum(ClubCategory::class)],
            'max_members' => ['nullable', 'integer', 'min:5', 'max:1000'],
            'membership_type' => ['required', Rule::enum(ClubMembershipType::class)],
            'membership_fee' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'membership_discount_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'hybrid_free_faculty' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'banner' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * Configure conditional validation rules.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $type = (string) $this->input('membership_type', 'free');
            $fee = (int) ($this->input('membership_fee') ?? 0);

            if (in_array($type, ['subscription', 'hybrid'], true) && $fee <= 0) {
                $validator->errors()->add('membership_fee', 'Membership fee is required for subscription or hybrid clubs.');
            }

            if ($type === 'hybrid' && ! $this->filled('hybrid_free_faculty')) {
                $validator->errors()->add('hybrid_free_faculty', 'Hybrid clubs must define the faculty that can join for free.');
            }
        });
    }
}
