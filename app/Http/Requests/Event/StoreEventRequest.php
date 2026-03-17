<?php

namespace App\Http\Requests\Event;

use App\Enums\EventType;
use App\Models\Club;
use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'club_id' => ['nullable', 'exists:clubs,id', 'required_if:type,club', 'prohibited_if:type,school'],
            'type' => ['required', Rule::enum(EventType::class)],
            'venue' => ['required', 'string', 'max:255'],
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime' => ['required', 'date', 'after:start_datetime'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'registration_deadline' => ['nullable', 'date', 'before:start_datetime'],
            'is_paid' => ['boolean'],
            'fee_amount' => ['required_if:is_paid,true', 'nullable', 'integer', 'min:100'],
            'cover' => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'submit_for_approval' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = $this->user();
            if (! $user) {
                return;
            }

            $type = $this->input('type');
            if ($type === EventType::School->value && ! $user->can('createSchool', Event::class)) {
                $validator->errors()->add('type', 'Only Admin or Super Admin can create school-wide events.');
            }

            if ($type === EventType::Club->value) {
                $clubId = (int) $this->input('club_id');
                $club = Club::find($clubId);

                if ($club && ! $user->can('createClub', [Event::class, $club])) {
                    $validator->errors()->add('club_id', 'You can only create club events for clubs you lead.');
                }
            }
        });
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
