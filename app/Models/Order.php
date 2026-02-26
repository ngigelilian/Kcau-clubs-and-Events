<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Order extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'orderable_type',
        'orderable_id',
        'quantity',
        'unit_price',
        'total_amount',
        'status',
        'mpesa_reference',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'quantity' => 'integer',
            'unit_price' => 'integer',
            'total_amount' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The user who placed this order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The orderable item (Event or Merchandise).
     */
    public function orderable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Payments for this order.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only paid orders.
     */
    public function scopePaid($query)
    {
        return $query->where('status', OrderStatus::Paid);
    }

    /**
     * Scope to only pending orders.
     */
    public function scopePending($query)
    {
        return $query->where('status', OrderStatus::Pending);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Get the total amount formatted in KES.
     */
    public function formattedTotal(): string
    {
        return 'KES ' . number_format($this->total_amount / 100, 2);
    }

    /**
     * Check if this order is paid.
     */
    public function isPaid(): bool
    {
        return $this->status === OrderStatus::Paid;
    }
}
