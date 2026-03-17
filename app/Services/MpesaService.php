<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MpesaService
{
    /**
     * Request an STK push from Daraja for the given payment.
     *
     * @return array<string, mixed>
     */
    public function initiateStkPush(Payment $payment, string $accountReference, string $description): array
    {
        $timestamp = now()->format('YmdHis');
        $shortcode = (string) config('services.mpesa.shortcode');
        $passkey = (string) config('services.mpesa.passkey');

        if ($shortcode === '' || $passkey === '') {
            throw new RuntimeException('M-Pesa credentials are not configured.');
        }

        $response = Http::baseUrl($this->baseUrl())
            ->withToken($this->accessToken())
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->post('/mpesa/stkpush/v1/processrequest', [
                'BusinessShortCode' => $shortcode,
                'Password' => base64_encode($shortcode.$passkey.$timestamp),
                'Timestamp' => $timestamp,
                'TransactionType' => 'CustomerPayBillOnline',
                'Amount' => $this->formatAmountForDaraja($payment->amount),
                'PartyA' => $payment->phone_number,
                'PartyB' => $shortcode,
                'PhoneNumber' => $payment->phone_number,
                'CallBackURL' => (string) config('services.mpesa.callback_url'),
                'AccountReference' => $accountReference,
                'TransactionDesc' => $description,
            ]);

        if ($response->failed()) {
            throw new RuntimeException($response->json('errorMessage') ?: 'Failed to initiate M-Pesa STK push.');
        }

        /** @var array<string, mixed> $payload */
        $payload = $response->json();

        return $payload;
    }

    /**
     * Parse callback metadata into a flat associative array.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function parseCallback(array $payload): array
    {
        $callback = $payload['Body']['stkCallback'];
        $items = collect($callback['CallbackMetadata']['Item'] ?? [])
            ->mapWithKeys(fn (array $item): array => [$item['Name'] => $item['Value'] ?? null])
            ->all();

        return [
            'checkout_request_id' => $callback['CheckoutRequestID'],
            'merchant_request_id' => $callback['MerchantRequestID'] ?? null,
            'result_code' => (int) $callback['ResultCode'],
            'result_description' => $callback['ResultDesc'],
            'receipt_number' => $items['MpesaReceiptNumber'] ?? null,
            'paid_amount' => isset($items['Amount']) ? (int) round(((float) $items['Amount']) * 100) : null,
            'phone_number' => isset($items['PhoneNumber']) ? (string) $items['PhoneNumber'] : null,
            'transaction_date' => isset($items['TransactionDate']) ? (string) $items['TransactionDate'] : null,
            'metadata' => $items,
        ];
    }

    private function accessToken(): string
    {
        $consumerKey = (string) config('services.mpesa.consumer_key');
        $consumerSecret = (string) config('services.mpesa.consumer_secret');

        if ($consumerKey === '' || $consumerSecret === '') {
            throw new RuntimeException('M-Pesa consumer credentials are not configured.');
        }

        try {
            $response = Http::baseUrl($this->baseUrl())
                ->acceptJson()
                ->withBasicAuth($consumerKey, $consumerSecret)
                ->timeout(15)
                ->get('/oauth/v1/generate', ['grant_type' => 'client_credentials']);
        } catch (ConnectionException $exception) {
            throw new RuntimeException('Unable to connect to the M-Pesa gateway.', previous: $exception);
        }

        if ($response->failed()) {
            throw new RuntimeException('Unable to obtain an M-Pesa access token.');
        }

        $token = $response->json('access_token');
        if (! is_string($token) || $token === '') {
            throw new RuntimeException('M-Pesa access token response was invalid.');
        }

        return $token;
    }

    private function baseUrl(): string
    {
        return config('services.mpesa.env') === 'production'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    private function formatAmountForDaraja(int $amountInCents): int
    {
        return max(1, (int) ceil($amountInCents / 100));
    }
}