<?php

namespace App\Http\Requests\Club;

use App\Enums\ClubCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClubRequest extends FormRequest
{
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
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'banner' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ];
    }
}
