<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
        private readonly string $receiptNumber,
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
        $itemName = $this->order->orderable->title ?? $this->order->orderable->name ?? 'Item';
        $amount = $this->order->formattedTotal();

        return (new MailMessage)
            ->subject('Payment Confirmation — KCAU Events')
            ->greeting('Payment Confirmed!')
            ->line("Your payment for **{$itemName}** has been successfully processed.")
            ->line("**Amount:** {$amount}")
            ->line("**Receipt Number:** {$receiptNumber}")
            ->action('View Order Details', url("/orders"))
            ->line('Thank you for your purchase!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $itemName = $this->order->orderable->title ?? $this->order->orderable->name ?? 'Item';

        return new DatabaseMessage([
            'type' => 'payment_completed',
            'order_id' => $this->order->id,
            'item_name' => $itemName,
            'receipt_number' => $this->receiptNumber,
            'amount' => $this->order->formattedTotal(),
            'title' => 'Payment Confirmed',
            'message' => "Your payment for {$itemName} was successful.",
        ]);
    }
}
