<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminPaymentCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Payment $payment,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->payment->order;
        $orderable = $order->orderable;
        $itemName = $orderable->title ?? $orderable->name ?? 'Item';
        $user = $this->payment->user;

        return (new MailMessage)
            ->subject("Payment Received: {$itemName} — KCAU Events")
            ->greeting('Payment Received')
            ->line("A payment has been received from **{$user->name}**.")
            ->line("**Item:** {$itemName}")
            ->line("**Amount:** {$this->payment->formattedAmount()}")
            ->line("**Receipt:** {$this->payment->mpesa_receipt_number}")
            ->line("**Phone:** {$this->payment->phone_number}")
            ->action('View Orders', url('/admin/orders'))
            ->line('Update order status as needed.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $order = $this->payment->order;
        $orderable = $order->orderable;
        $itemName = $orderable->title ?? $orderable->name ?? 'Item';
        $user = $this->payment->user;

        return new DatabaseMessage([
            'type' => 'admin_payment_completed',
            'payment_id' => $this->payment->id,
            'order_id' => $order->id,
            'user_name' => $user->name,
            'item_name' => $itemName,
            'amount' => $this->payment->formattedAmount(),
            'receipt_number' => $this->payment->mpesa_receipt_number,
            'title' => 'Payment Completed',
            'message' => "{$user->name} paid {$this->payment->formattedAmount()} for {$itemName}",
        ]);
    }
}
