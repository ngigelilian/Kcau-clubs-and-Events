<?php

namespace App\Models;

use App\Enums\PaymentStatusEnum;
use App\Enums\RegistrationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRegistration extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'payment_status',
        'registered_at',
        'attended_at',
        'cancelled_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => RegistrationStatus::class,
            'payment_status' => PaymentStatusEnum::class,
            'registered_at' => 'datetime',
            'attended_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The event this registration is for.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * The user who registered.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only active registrations (not cancelled).
     */
    public function scopeActive($query)
    {
        return $query->where('status', '!=', RegistrationStatus::Cancelled);
    }

    /**
     * Scope to only attended registrations.
     */
    public function scopeAttended($query)
    {
        return $query->where('status', RegistrationStatus::Attended);
    }

    /**
     * Scope to only paid registrations.
     */
    public function scopePaid($query)
    {
        return $query->where('payment_status', PaymentStatusEnum::Paid);
    }
}
