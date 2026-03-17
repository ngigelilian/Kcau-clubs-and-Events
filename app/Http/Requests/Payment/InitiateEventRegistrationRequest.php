<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class InitiateEventRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'phone_number' => ['nullable', 'string', 'regex:/^(?:\+?254|0)(?:7|1)\d{8}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone_number.regex' => 'Use a valid Safaricom number such as 2547XXXXXXXX or 07XXXXXXXX.',
        ];
    }
}