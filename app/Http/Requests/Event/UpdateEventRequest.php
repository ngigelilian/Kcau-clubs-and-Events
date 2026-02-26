<?php

namespace App\Http\Requests\Event;

use App\Enums\EventType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('event'));
    }

    public function rules(): array
    {
        $event = $this->route('event');

        return [
            'title' => ['required', 'string', 'max:255', Rule::unique('events', 'title')->ignore($event->id)],
            'description' => ['required', 'string', 'min:20', 'max:10000'],
            'club_id' => ['nullable', 'exists:clubs,id'],
            'type' => ['required', Rule::enum(EventType::class)],
            'venue' => ['required', 'string', 'max:255'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'registration_deadline' => ['nullable', 'date', 'before:start_datetime'],
            'is_paid' => ['boolean'],
            'fee_amount' => ['required_if:is_paid,true', 'nullable', 'integer', 'min:100'],
            'cover' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ];
    }
}
