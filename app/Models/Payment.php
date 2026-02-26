<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Payment extends Model
{
    use HasFactory, LogsActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_id',
        'user_id',
        'amount',
        'phone_number',
        'mpesa_checkout_request_id',
        'mpesa_receipt_number',
        'status',
        'payment_method',
        'paid_at',
        'failed_at',
        'failure_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'payment_method' => PaymentMethod::class,
            'amount' => 'integer',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Activity Log
    // -------------------------------------------------------------------------

    /**
     * Configure activity log options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status', 'mpesa_receipt_number', 'paid_at', 'failed_at', 'failure_reason'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => "Payment #{$this->id} was {$eventName}");
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The order this payment is for.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * The user who made this payment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only completed payments.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', PaymentStatus::Completed);
    }

    /**
     * Scope to only failed payments.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', PaymentStatus::Failed);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Get the amount formatted in KES.
     */
    public function formattedAmount(): string
    {
        return 'KES ' . number_format($this->amount / 100, 2);
    }

    /**
     * Check if payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === PaymentStatus::Completed;
    }

    /**
     * Check if payment can be retried.
     */
    public function canRetry(): bool
    {
        return $this->status === PaymentStatus::Failed;
    }
}
