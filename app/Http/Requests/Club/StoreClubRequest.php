<?php

namespace App\Http\Requests\Club;

use App\Enums\ClubCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClubRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Club::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:clubs,name'],
            'description' => ['required', 'string', 'min:20', 'max:5000'],
            'category' => ['required', Rule::enum(ClubCategory::class)],
            'max_members' => ['nullable', 'integer', 'min:5', 'max:1000'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'banner' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'description.min' => 'Please provide a detailed description of at least 20 characters.',
            'logo.max' => 'Logo must be less than 5MB.',
            'banner.max' => 'Banner must be less than 5MB.',
        ];
    }
}
