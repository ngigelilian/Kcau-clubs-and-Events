<?php

namespace App\Models;

use App\Enums\ClubCategory;
use App\Enums\ClubStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Club extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, LogsActivity, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
        'max_members',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => ClubCategory::class,
            'status' => ClubStatus::class,
            'approved_at' => 'datetime',
            'max_members' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Media Collections
    // -------------------------------------------------------------------------

    /**
     * Register media collections for the club.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('banner')
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
            ->setDescriptionForEvent(fn (string $eventName) => "Club '{$this->name}' was {$eventName}");
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * User who created/proposed this club.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Admin who approved this club.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * All memberships for this club.
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(ClubMembership::class);
    }

    /**
     * Events belonging to this club.
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /**
     * Merchandise listed by this club.
     */
    public function merchandise(): HasMany
    {
        return $this->hasMany(Merchandise::class);
    }

    /**
     * Announcements for this club.
     */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only active clubs.
     */
    public function scopeActive($query)
    {
        return $query->where('status', ClubStatus::Active);
    }

    /**
     * Scope to only pending clubs.
     */
    public function scopePending($query)
    {
        return $query->where('status', ClubStatus::Pending);
    }

    /**
     * Scope to filter by category.
     */
    public function scopeCategory($query, ClubCategory $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to search clubs by name or description.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'ILIKE', "%{$search}%")
              ->orWhere('description', 'ILIKE', "%{$search}%");
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Get the count of active members.
     */
    public function activeMembersCount(): int
    {
        return $this->memberships()->where('status', 'active')->count();
    }

    /**
     * Check if the club has reached its max member capacity.
     */
    public function isFull(): bool
    {
        if ($this->max_members === null) {
            return false;
        }

        return $this->activeMembersCount() >= $this->max_members;
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
