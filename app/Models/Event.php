<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Enums\EventType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Event extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'club_id',
        'type',
        'venue',
        'start_datetime',
        'end_datetime',
        'capacity',
        'registration_deadline',
        'is_paid',
        'fee_amount',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => EventType::class,
            'status' => EventStatus::class,
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
            'registration_deadline' => 'datetime',
            'approved_at' => 'datetime',
            'is_paid' => 'boolean',
            'fee_amount' => 'integer',
            'capacity' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Media Collections
    // -------------------------------------------------------------------------

    /**
     * Register media collections for the event.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
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
            ->logFillable()
            ->logOnlyDirty()
            ->setDescriptionForEvent(fn (string $eventName) => "Event '{$this->title}' was {$eventName}");
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The club this event belongs to (nullable for school-wide events).
     */
    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * User who created this event.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Admin who approved this event.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Registrations for this event.
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Orders for this event (polymorphic).
     */
    public function orders(): MorphMany
    {
        return $this->morphMany(Order::class, 'orderable');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only upcoming events (start_datetime in the future).
     */
    public function scopeUpcoming($query)
    {
        return $query->where('start_datetime', '>', now())
                     ->where('status', EventStatus::Approved);
    }

    /**
     * Scope to only past events.
     */
    public function scopePast($query)
    {
        return $query->where('end_datetime', '<', now());
    }

    /**
     * Scope to only approved events.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', EventStatus::Approved);
    }

    /**
     * Scope to filter events for a specific club.
     */
    public function scopeForClub($query, int $clubId)
    {
        return $query->where('club_id', $clubId);
    }

    /**
     * Scope to search events by title or description.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'ILIKE', "%{$search}%")
              ->orWhere('description', 'ILIKE', "%{$search}%");
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if registration is still open.
     */
    public function isRegistrationOpen(): bool
    {
        if ($this->status !== EventStatus::Approved) {
            return false;
        }

        if ($this->registration_deadline && $this->registration_deadline->isPast()) {
            return false;
        }

        if ($this->start_datetime->isPast()) {
            return false;
        }

        return ! $this->isFull();
    }

    /**
     * Check if the event is at capacity.
     */
    public function isFull(): bool
    {
        if ($this->capacity === null) {
            return false;
        }

        return $this->registrations()
            ->where('status', '!=', 'cancelled')
            ->count() >= $this->capacity;
    }

    /**
     * Get the number of available spots.
     */
    public function availableSpots(): ?int
    {
        if ($this->capacity === null) {
            return null;
        }

        $registered = $this->registrations()
            ->where('status', '!=', 'cancelled')
            ->count();

        return max(0, $this->capacity - $registered);
    }

    /**
     * Get the fee amount formatted in KES.
     */
    public function formattedFee(): string
    {
        return 'KES ' . number_format($this->fee_amount / 100, 2);
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
