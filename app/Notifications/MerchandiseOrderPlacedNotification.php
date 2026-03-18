<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MerchandiseOrderPlacedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Order $order,
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
        $merchandise = $this->order->orderable;
        $club = $merchandise->club;
        $quantity = $this->order->quantity;

        return (new MailMessage)
            ->subject("New Order: {$merchandise->name} — KCAU Events")
            ->greeting('New Order Received!')
            ->line("A new order has been placed for **{$merchandise->name}**.")
            ->line("**Club:** {$club->name}")
            ->line("**Quantity:** {$quantity}")
            ->line("**Amount:** {$this->order->formattedTotal()}")
            ->action('View Order', url('/orders'))
            ->line('Please process and fulfill this order.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $merchandise = $this->order->orderable;
        $club = $merchandise->club;

        return new DatabaseMessage([
            'type' => 'merchandise_order_placed',
            'order_id' => $this->order->id,
            'club_id' => $club->id,
            'merchandise_name' => $merchandise->name,
            'quantity' => $this->order->quantity,
            'title' => 'New Merchandise Order',
            'message' => "{$this->order->quantity}x {$merchandise->name} ordered from {$club->name}",
        ]);
    }
}
