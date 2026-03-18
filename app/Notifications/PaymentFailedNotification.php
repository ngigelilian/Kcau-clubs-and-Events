<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
        private readonly string $failureReason,
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

        return (new MailMessage)
            ->subject('Payment Failed — KCAU Events')
            ->greeting('Payment Could Not Be Processed')
            ->line("Your payment for **{$itemName}** failed.")
            ->line("**Reason:** {$this->failureReason}")
            ->action('Retry Payment', url("/orders"))
            ->line('Please try again or contact support for assistance.');
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
            'type' => 'payment_failed',
            'order_id' => $this->order->id,
            'item_name' => $itemName,
            'failure_reason' => $this->failureReason,
            'title' => 'Payment Failed',
            'message' => "Your payment for {$itemName} could not be processed.",
        ]);
    }
}
