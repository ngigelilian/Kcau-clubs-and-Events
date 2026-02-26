<?php

namespace App\Models;

use App\Enums\MerchandiseStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Merchandise extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    /**
     * @var string
     */
    protected $table = 'merchandise';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'club_id',
        'name',
        'description',
        'price',
        'stock_quantity',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => MerchandiseStatus::class,
            'price' => 'integer',
            'stock_quantity' => 'integer',
        ];
    }

    // -------------------------------------------------------------------------
    // Media Collections
    // -------------------------------------------------------------------------

    /**
     * Register media collections for merchandise.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The club that sells this merchandise.
     */
    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * Orders for this merchandise (polymorphic).
     */
    public function orders(): MorphMany
    {
        return $this->morphMany(Order::class, 'orderable');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only available merchandise.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', MerchandiseStatus::Available);
    }

    /**
     * Scope to only in-stock items.
     */
    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0)
                     ->where('status', MerchandiseStatus::Available);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Get the price formatted in KES.
     */
    public function formattedPrice(): string
    {
        return 'KES ' . number_format($this->price / 100, 2);
    }

    /**
     * Check if the item is in stock.
     */
    public function isInStock(): bool
    {
        return $this->stock_quantity > 0 && $this->status === MerchandiseStatus::Available;
    }
}
