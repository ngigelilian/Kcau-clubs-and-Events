<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class ProcessMpesaCallbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        $expectedToken = (string) config('services.mpesa.callback_token');
        if ($expectedToken === '') {
            return true;
        }

        $providedToken = (string) $this->header('X-Mpesa-Callback-Token', '');

        return hash_equals($expectedToken, $providedToken);
    }

    public function rules(): array
    {
        return [
            'Body' => ['required', 'array'],
            'Body.stkCallback' => ['required', 'array'],
            'Body.stkCallback.CheckoutRequestID' => ['required', 'string'],
            'Body.stkCallback.ResultCode' => ['required', 'integer'],
            'Body.stkCallback.ResultDesc' => ['required', 'string'],
            'Body.stkCallback.CallbackMetadata' => ['nullable', 'array'],
            'Body.stkCallback.CallbackMetadata.Item' => ['nullable', 'array'],
        ];
    }
}