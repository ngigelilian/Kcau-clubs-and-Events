<?php

use App\Enums\OrderStatus;
use App\Enums\RegistrationStatus;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\AdminPaymentCompletedNotification;
use App\Notifications\AnnouncementPublishedNotification;
use App\Notifications\EventReminderNotification;
use App\Notifications\PaymentCompletedNotification;
use App\Notifications\PaymentFailedNotification;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->seed(RoleAndPermissionSeeder::class);
});

it('sends user and admin notifications when payment callback succeeds', function () {
    Notification::fake();

    $payer = User::factory()->create();
    $payer->assignRole('student');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $event = Event::factory()->schoolWide()->approved()->paid(50000)->create();

    $order = Order::factory()->forEvent()->create([
        'user_id' => $payer->id,
        'orderable_type' => Event::class,
        'orderable_id' => $event->id,
        'status' => OrderStatus::Pending,
        'unit_price' => 50000,
        'total_amount' => 50000,
    ]);

    Payment::factory()->initiated()->create([
        'order_id' => $order->id,
        'user_id' => $payer->id,
        'amount' => 50000,
        'mpesa_checkout_request_id' => 'ws_CO_ntf_success_1',
    ]);

    $this->postJson('/api/mpesa/callback', [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => '29115-34620561-1',
                'CheckoutRequestID' => 'ws_CO_ntf_success_1',
                'ResultCode' => 0,
                'ResultDesc' => 'The service request is processed successfully.',
                'CallbackMetadata' => [
                    'Item' => [
                        ['Name' => 'Amount', 'Value' => 500],
                        ['Name' => 'MpesaReceiptNumber', 'Value' => 'NTF123PAY'],
                        ['Name' => 'TransactionDate', 'Value' => 20260318110000],
                        ['Name' => 'PhoneNumber', 'Value' => 254712345678],
                    ],
                ],
            ],
        ],
    ])->assertOk();

    Notification::assertSentTo($payer, PaymentCompletedNotification::class);
    Notification::assertSentTo($admin, AdminPaymentCompletedNotification::class);
});

it('sends failed payment notification to the user when callback fails', function () {
    Notification::fake();

    $payer = User::factory()->create();
    $payer->assignRole('student');

    $event = Event::factory()->schoolWide()->approved()->paid(50000)->create();

    $order = Order::factory()->forEvent()->create([
        'user_id' => $payer->id,
        'orderable_type' => Event::class,
        'orderable_id' => $event->id,
        'status' => OrderStatus::Pending,
        'unit_price' => 50000,
        'total_amount' => 50000,
    ]);

    Payment::factory()->initiated()->create([
        'order_id' => $order->id,
        'user_id' => $payer->id,
        'amount' => 50000,
        'mpesa_checkout_request_id' => 'ws_CO_ntf_failed_1',
    ]);

    $this->postJson('/api/mpesa/callback', [
        'Body' => [
            'stkCallback' => [
                'MerchantRequestID' => '29115-34620561-1',
                'CheckoutRequestID' => 'ws_CO_ntf_failed_1',
                'ResultCode' => 1032,
                'ResultDesc' => 'Request cancelled by user.',
                'CallbackMetadata' => [
                    'Item' => [],
                ],
            ],
        ],
    ])->assertOk();

    Notification::assertSentTo($payer, PaymentFailedNotification::class);
});

it('notifies active club members when a leader publishes a club announcement', function () {
    Notification::fake();

    $leader = User::factory()->create();
    $leader->assignRole('student');

    $member = User::factory()->create();
    $member->assignRole('student');

    $outsider = User::factory()->create();
    $outsider->assignRole('student');

    $club = Club::factory()->active()->create(['created_by' => $leader->id]);

    ClubMembership::factory()->leader()->create([
        'club_id' => $club->id,
        'user_id' => $leader->id,
    ]);

    ClubMembership::factory()->create([
        'club_id' => $club->id,
        'user_id' => $member->id,
    ]);

    $this->actingAs($leader)
        ->post(route('announcements.store'), [
            'title' => 'Training Session Update',
            'body' => 'There is a training session this Friday at 4 PM in the main hall.',
            'club_id' => $club->id,
            'audience' => 'all_members',
            'is_email' => false,
            'publish_now' => true,
        ])
        ->assertRedirect(route('announcements.index'));

    Notification::assertSentTo($member, AnnouncementPublishedNotification::class);
    Notification::assertNotSentTo($outsider, AnnouncementPublishedNotification::class);
});

it('sends 24 hour reminder notifications to registered event attendees', function () {
    Notification::fake();

    $attendee = User::factory()->create();
    $attendee->assignRole('student');

    $event = Event::factory()->approved()->create([
        'start_datetime' => now()->addHours(24),
        'end_datetime' => now()->addHours(27),
    ]);

    EventRegistration::factory()->create([
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'status' => RegistrationStatus::Registered,
    ]);

    $this->artisan('send:event-reminders')->assertSuccessful();

    Notification::assertSentTo($attendee, EventReminderNotification::class);
});
