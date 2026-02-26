<?php

namespace App\Models;

use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClubMembership extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'club_id',
        'user_id',
        'role',
        'status',
        'joined_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => MembershipRole::class,
            'status' => MembershipStatus::class,
            'joined_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The club this membership belongs to.
     */
    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * The user this membership belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only active memberships.
     */
    public function scopeActive($query)
    {
        return $query->where('status', MembershipStatus::Active);
    }

    /**
     * Scope to only pending memberships.
     */
    public function scopePending($query)
    {
        return $query->where('status', MembershipStatus::Pending);
    }

    /**
     * Scope to only leaders (leaders and co-leaders).
     */
    public function scopeLeaders($query)
    {
        return $query->whereIn('role', [MembershipRole::Leader, MembershipRole::CoLeader]);
    }
}
