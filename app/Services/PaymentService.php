<?php

namespace App\Services;

use App\Enums\MerchandiseStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentStatusEnum;
use App\Enums\RegistrationStatus;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Merchandise;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\AdminPaymentCompletedNotification;
use App\Notifications\PaymentCompletedNotification;
use App\Notifications\PaymentFailedNotification;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use RuntimeException;

class PaymentService
{
    public function __construct(
        private readonly MpesaService $mpesaService,
    ) {}

    /**
     * Initiate a paid event registration via M-Pesa.
     */
    public function initiateEventRegistration(Event $event, User $user, ?string $phoneNumber = null): Payment
    {
        if (! $event->is_paid) {
            throw new RuntimeException('This event does not require payment.');
        }

        $phone = $this->normalizePhoneNumber($phoneNumber, $user->phone);

        /** @var array{order: Order, payment: Payment} $records */
        $records = DB::transaction(function () use ($event, $user, $phone): array {
            $lockedEvent = Event::query()->whereKey($event->id)->lockForUpdate()->firstOrFail();

            if (! $lockedEvent->isRegistrationOpen()) {
                throw new RuntimeException('Registration for this event is closed.');
            }

            $registration = EventRegistration::where('event_id', $lockedEvent->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if ($registration?->status === RegistrationStatus::Attended) {
                throw new RuntimeException('You have already attended this event.');
            }

            $pendingOrder = $this->findPendingOrder($user, Event::class, $lockedEvent->id, true);

            if ($registration?->status === RegistrationStatus::Registered && ! $pendingOrder) {
                throw new RuntimeException('You are already registered for this event.');
            }

            if ($pendingOrder && $this->hasRecentActiveAttempt($pendingOrder)) {
                throw new RuntimeException('A payment request is already in progress. Please complete it or wait 60 seconds before retrying.');
            }

            $registration ??= new EventRegistration([
                'event_id' => $lockedEvent->id,
                'user_id' => $user->id,
            ]);

            $registration->fill([
                'status' => RegistrationStatus::Registered,
                'payment_status' => PaymentStatusEnum::Pending,
                'registered_at' => now(),
                'attended_at' => null,
                'cancelled_at' => null,
            ]);
            $registration->save();

            $order = $pendingOrder ?? Order::create([
                'user_id' => $user->id,
                'orderable_type' => Event::class,
                'orderable_id' => $lockedEvent->id,
                'quantity' => 1,
                'unit_price' => $lockedEvent->fee_amount,
                'total_amount' => $lockedEvent->fee_amount,
                'status' => OrderStatus::Pending,
            ]);

            $payment = $this->createAttempt($order, $user, $phone, $lockedEvent->fee_amount);

            return ['order' => $order, 'payment' => $payment];
        });

        return $this->dispatchStkPush(
            $records['payment'],
            'EVENT-'.$records['order']->id,
            'Event registration payment'
        );
    }

    /**
     * Initiate a merchandise purchase via M-Pesa.
     */
    public function initiateMerchandisePurchase(Merchandise $item, User $user, int $quantity, ?string $phoneNumber = null): Payment
    {
        $phone = $this->normalizePhoneNumber($phoneNumber, $user->phone);

        /** @var array{order: Order, payment: Payment} $records */
        $records = DB::transaction(function () use ($item, $user, $quantity, $phone): array {
            $lockedItem = Merchandise::query()->whereKey($item->id)->lockForUpdate()->firstOrFail();

            $pendingOrder = $this->findPendingOrder($user, Merchandise::class, $lockedItem->id, true);

            if ($pendingOrder && $this->hasRecentActiveAttempt($pendingOrder)) {
                throw new RuntimeException('A payment request is already in progress. Please complete it or wait 60 seconds before retrying.');
            }

            if (! $pendingOrder) {
                if (! $lockedItem->isInStock()) {
                    throw new RuntimeException('This item is currently out of stock.');
                }

                if ($lockedItem->stock_quantity < $quantity) {
                    throw new RuntimeException("Only {$lockedItem->stock_quantity} item(s) are available.");
                }

                $order = Order::create([
                    'user_id' => $user->id,
                    'orderable_type' => Merchandise::class,
                    'orderable_id' => $lockedItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $lockedItem->price,
                    'total_amount' => $lockedItem->price * $quantity,
                    'status' => OrderStatus::Pending,
                ]);

                $lockedItem->decrement('stock_quantity', $quantity);
                $lockedItem->refresh();

                if ($lockedItem->stock_quantity <= 0 && $lockedItem->status === MerchandiseStatus::Available) {
                    $lockedItem->update(['status' => MerchandiseStatus::OutOfStock]);
                }
            } else {
                $order = $pendingOrder;
            }

            $payment = $this->createAttempt($order, $user, $phone, $order->total_amount);

            return ['order' => $order, 'payment' => $payment];
        });

        return $this->dispatchStkPush(
            $records['payment'],
            'ORDER-'.$records['order']->id,
            'Merchandise purchase payment'
        );
    }

    /**
     * Handle an M-Pesa callback and update payment/order domain state.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleMpesaCallback(array $payload): ?Payment
    {
        $callback = $this->mpesaService->parseCallback($payload);

        $payment = DB::transaction(function () use ($callback): ?Payment {
            $paymentModel = Payment::query()
                ->where('mpesa_checkout_request_id', $callback['checkout_request_id'])
                ->lockForUpdate()
                ->first();

            if (! $paymentModel) {
                return null;
            }

            if (in_array($paymentModel->status, [PaymentStatus::Completed, PaymentStatus::Failed], true)) {
                return $paymentModel;
            }

            $order = $paymentModel->order()->lockForUpdate()->firstOrFail();

            if ($callback['result_code'] === 0) {
                $paymentModel->update([
                    'status' => PaymentStatus::Completed,
                    'mpesa_receipt_number' => $callback['receipt_number'],
                    'paid_at' => now(),
                    'failed_at' => null,
                    'failure_reason' => null,
                ]);

                $order->update([
                    'status' => OrderStatus::Paid,
                    'mpesa_reference' => $callback['receipt_number'],
                ]);

                if ($order->orderable_type === Event::class) {
                    EventRegistration::where('event_id', $order->orderable_id)
                        ->where('user_id', $order->user_id)
                        ->update([
                            'status' => RegistrationStatus::Registered,
                            'payment_status' => PaymentStatusEnum::Paid,
                            'cancelled_at' => null,
                        ]);
                }

                return $paymentModel->fresh();
            }

            $paymentModel->update([
                'status' => PaymentStatus::Failed,
                'failed_at' => now(),
                'failure_reason' => $callback['result_description'],
            ]);

            return $paymentModel->fresh();
        });

        if ($payment) {
            $this->dispatchPaymentNotifications($payment);
        }

        return $payment;
    }

    /**
     * Dispatch notifications for payment completion or failure.
     */
    private function dispatchPaymentNotifications(Payment $payment): void
    {
        $order = $payment->order;
        $user = $payment->user;

        if ($payment->status === PaymentStatus::Completed && $payment->mpesa_receipt_number) {
            // Notify user of successful payment
            $user->notify(new PaymentCompletedNotification($order, $payment->mpesa_receipt_number));

            // Notify admins
            $admins = User::role(['admin', 'super-admin'])->get();
            Notification::send($admins, new AdminPaymentCompletedNotification($payment));
        } elseif ($payment->status === PaymentStatus::Failed) {
            // Notify user of failed payment
            $user->notify(new PaymentFailedNotification($order, $payment->failure_reason ?? 'Payment failed'));
        }
    }

    private function createAttempt(Order $order, User $user, string $phoneNumber, int $amount): Payment
    {
        return Payment::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'amount' => $amount,
            'phone_number' => $phoneNumber,
            'status' => PaymentStatus::Initiated,
            'payment_method' => PaymentMethod::Mpesa,
        ]);
    }

    private function dispatchStkPush(Payment $payment, string $accountReference, string $description): Payment
    {
        try {
            $response = $this->mpesaService->initiateStkPush($payment, $accountReference, $description);
        } catch (\Throwable $exception) {
            $payment->update([
                'status' => PaymentStatus::Failed,
                'failed_at' => now(),
                'failure_reason' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        $isAccepted = ($response['ResponseCode'] ?? null) === '0';

        $payment->update([
            'mpesa_checkout_request_id' => $response['CheckoutRequestID'] ?? null,
            'status' => $isAccepted ? PaymentStatus::Pending : PaymentStatus::Failed,
            'failed_at' => $isAccepted ? null : now(),
            'failure_reason' => $isAccepted ? null : ($response['ResponseDescription'] ?? 'M-Pesa request was not accepted.'),
        ]);

        if (! $isAccepted) {
            throw new RuntimeException($payment->failure_reason ?? 'M-Pesa request was not accepted.');
        }

        return $payment->fresh();
    }

    private function findPendingOrder(User $user, string $orderableType, int $orderableId, bool $lock = false): ?Order
    {
        $query = Order::query()
            ->where('user_id', $user->id)
            ->where('orderable_type', $orderableType)
            ->where('orderable_id', $orderableId)
            ->where('status', OrderStatus::Pending)
            ->latest('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->first();
    }

    private function hasRecentActiveAttempt(Order $order): bool
    {
        return $order->payments()
            ->whereIn('status', [PaymentStatus::Initiated, PaymentStatus::Pending])
            ->where('created_at', '>=', now()->subSeconds(60))
            ->exists();
    }

    private function normalizePhoneNumber(?string $candidate, ?string $fallback): string
    {
        $phone = preg_replace('/\s+/', '', $candidate ?: $fallback ?: '');
        $phone = ltrim((string) $phone, '+');

        if (str_starts_with($phone, '0')) {
            $phone = '254'.substr($phone, 1);
        }

        if (! preg_match('/^254(?:7|1)\d{8}$/', $phone)) {
            throw new RuntimeException('A valid Safaricom phone number is required to initiate M-Pesa payment.');
        }

        return $phone;
    }
}