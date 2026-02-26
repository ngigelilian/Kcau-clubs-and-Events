<?php

namespace App\Http\Requests\Event;

use App\Enums\EventType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\Event::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255', 'unique:events,title'],
            'description' => ['required', 'string', 'min:20', 'max:10000'],
            'club_id' => ['nullable', 'exists:clubs,id'],
            'type' => ['required', Rule::enum(EventType::class)],
            'venue' => ['required', 'string', 'max:255'],
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'registration_deadline' => ['nullable', 'date', 'before:start_datetime'],
            'is_paid' => ['boolean'],
            'fee_amount' => ['required_if:is_paid,true', 'nullable', 'integer', 'min:100'],
            'cover' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'description.min' => 'Please provide a detailed description of at least 20 characters.',
            'start_datetime.after' => 'The event must start in the future.',
            'end_datetime.after' => 'The event must end after it starts.',
            'fee_amount.required_if' => 'A fee amount is required for paid events.',
            'cover.max' => 'Cover image must be less than 5MB.',
        ];
    }
}
