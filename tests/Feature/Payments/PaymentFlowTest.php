<?php

use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentStatusEnum;
use App\Enums\RegistrationStatus;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Merchandise;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.mpesa.env', 'sandbox');
    config()->set('services.mpesa.consumer_key', 'test-key');
    config()->set('services.mpesa.consumer_secret', 'test-secret');
    config()->set('services.mpesa.shortcode', '174379');
    config()->set('services.mpesa.passkey', 'test-passkey');
    config()->set('services.mpesa.callback_url', 'http://localhost/api/mpesa/callback');
});

function fakeSuccessfulMpesa(): void
{
    Http::fake([
        'https://sandbox.safaricom.co.ke/oauth/v1/generate*' => Http::response([
            'access_token' => 'sandbox-token',
        ], 200),
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest' => Http::response([
            'MerchantRequestID' => '29115-34620561-1',
            'CheckoutRequestID' => 'ws_CO_123456789',
            'ResponseCode' => '0',
            'ResponseDescription' => 'Success. Request accepted for processing',
            'CustomerMessage' => 'Success. Request accepted for processing',
        ], 200),
    ]);
}

it('initiates stk push for paid event registration and creates pending records', function () {
    fakeSuccessfulMpesa();

    $user = User::factory()->create(['phone' => '0712345678']);
    $event = Event::factory()->approved()->paid(50000)->create([
        'status' => EventStatus::Approved,
        'type' => EventType::School,
        'club_id' => null,
        'start_datetime' => Carbon::now()->addDays(5),
        'end_datetime' => Carbon::now()->addDays(5)->addHours(2),
        'registration_deadline' => Carbon::now()->addDays(4),
    ]);

    $this->actingAs($user)
        ->post(route('events.register', $event))
        ->assertRedirect();

    $registration = EventRegistration::where('event_id', $event->id)
        ->where('user_id', $user->id)
        ->firstOrFail();
    $order = Order::where('user_id', $user->id)
        ->where('orderable_type', Event::class)
        ->where('orderable_id', $event->id)
        ->firstOrFail();
    $payment = Payment::where('order_id', $order->id)->firstOrFail();

    expect($registration->status)->toBe(RegistrationStatus::Registered)
        ->and($registration->payment_status)->toBe(PaymentStatusEnum::Pending)
        ->and($order->status)->toBe(OrderStatus::Pending)
        ->and($payment->status)->toBe(PaymentStatus::Pending)
        ->and($payment->phone_number)->toBe('254712345678')
        ->and($payment->mpesa_checkout_request_id)->toBe('ws_CO_123456789');
});

it('completes paid event payment via mpesa callback', function () {
    $user = User::factory()->create();
    $event = Event::factory()->approved()->paid(50000)->create([
        'type' => EventType::School,
        'club_id' => null,
    ]);

    $order = Order::factory()->forEvent()->create([
        'user_id' => $user->id,
        'orderable_type' => Event::class,
        'orderable_id' => $event->id,
        'status' => OrderStatus::Pending,
        'unit_price' => 50000,
        'total_amount' => 50000,
    ]);

    EventRegistration::factory()->create([
        'event_id' => $event->id,
        'user_id' => $user->id,
        'status' => RegistrationStatus::Registered,
        'payment_status' => PaymentStatusEnum::Pending,
    ]);

    $payment = Payment::factory()->initiated()->create([
        'order_id' => $order->id,
        'user_id' => $user->id,
        'amount' => 50000,
        'mpesa_checkout_request_id' => 'ws_CO_complete_123',
    ]);

    $this->postJson('/api/mpesa/callback', [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => '29115-34620561-1',
                'CheckoutRequestID' => 'ws_CO_complete_123',
                'ResultCode' => 0,
                'ResultDesc' => 'The service request is processed successfully.',
                'CallbackMetadata' => [
                    'Item' => [
                        ['Name' => 'Amount', 'Value' => 500],
                        ['Name' => 'MpesaReceiptNumber', 'Value' => 'TST123PAY'],
                        ['Name' => 'TransactionDate', 'Value' => 20260315094500],
                        ['Name' => 'PhoneNumber', 'Value' => 254712345678],
                    ],
                ],
            ],
        ],
    ])->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Completed)
        ->and($payment->fresh()->mpesa_receipt_number)->toBe('TST123PAY')
        ->and($order->fresh()->status)->toBe(OrderStatus::Paid)
        ->and($order->fresh()->mpesa_reference)->toBe('TST123PAY')
        ->and(
            EventRegistration::where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->firstOrFail()
                ->payment_status
        )->toBe(PaymentStatusEnum::Paid);
});

it('reserves stock and creates pending payment for merchandise purchase', function () {
    fakeSuccessfulMpesa();

    $user = User::factory()->create(['phone' => '0712345678']);
    $item = Merchandise::factory()->create([
        'price' => 25000,
        'stock_quantity' => 4,
    ]);

    $this->actingAs($user)
        ->post(route('merchandise.order', $item), ['quantity' => 2])
        ->assertRedirect();

    $item->refresh();
    $order = Order::where('user_id', $user->id)
        ->where('orderable_type', Merchandise::class)
        ->where('orderable_id', $item->id)
        ->firstOrFail();
    $payment = Payment::where('order_id', $order->id)->firstOrFail();

    expect($item->stock_quantity)->toBe(2)
        ->and($order->quantity)->toBe(2)
        ->and($order->total_amount)->toBe(50000)
        ->and($payment->status)->toBe(PaymentStatus::Pending);
});

it('blocks duplicate active payment attempts within sixty seconds', function () {
    fakeSuccessfulMpesa();

    $user = User::factory()->create(['phone' => '0712345678']);
    $event = Event::factory()->approved()->paid(50000)->create([
        'status' => EventStatus::Approved,
        'type' => EventType::School,
        'club_id' => null,
        'start_datetime' => Carbon::now()->addDays(3),
        'end_datetime' => Carbon::now()->addDays(3)->addHours(2),
        'registration_deadline' => Carbon::now()->addDays(2),
    ]);

    $this->actingAs($user)
        ->post(route('events.register', $event))
        ->assertRedirect();

    $this->actingAs($user)
        ->from(route('events.show', $event))
        ->post(route('events.register', $event))
        ->assertRedirect(route('events.show', $event));

    $this->assertDatabaseCount('payments', 1);
});

it('shows student order and payment history pages', function () {
    $user = User::factory()->create();
    $order = Order::factory()->create(['user_id' => $user->id]);
    Payment::factory()->create(['order_id' => $order->id, 'user_id' => $user->id]);

    $this->actingAs($user)->get('/orders')->assertOk();
    $this->actingAs($user)->get('/payments')->assertOk();
});

it('allows a user to download pdf receipt for completed payment', function () {
    $user = User::factory()->create();
    $order = Order::factory()->paid()->create(['user_id' => $user->id]);
    $payment = Payment::factory()->completed()->create([
        'order_id' => $order->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('payments.receipt', $payment))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('forbids downloading another users payment receipt', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $order = Order::factory()->paid()->create(['user_id' => $owner->id]);
    $payment = Payment::factory()->completed()->create([
        'order_id' => $order->id,
        'user_id' => $owner->id,
    ]);

    $this->actingAs($otherUser)
        ->get(route('payments.receipt', $payment))
        ->assertForbidden();
});