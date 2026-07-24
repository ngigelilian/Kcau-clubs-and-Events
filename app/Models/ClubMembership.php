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
        'membership_fee_due',
        'membership_fee_waived',
        'joined_at',
        'leadership_since',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => MembershipRole::class,
            'status' => MembershipStatus::class,
            'membership_fee_due' => 'integer',
            'membership_fee_waived' => 'boolean',
            'joined_at' => 'datetime',
            'leadership_since' => 'datetime',
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
     * Scope to any active leadership position (Chairperson, Secretary,
     * Treasurer, Co-Chair — anything other than a plain Member).
     */
    public function scopeLeaders($query)
    {
        return $query->whereIn('role', MembershipRole::leadershipRoles());
    }

    /**
     * Scope to only the Chairperson position — the sole holder of
     * sensitive club privileges (invite/remove leaders, transfer
     * chairpersonship, disband the club).
     */
    public function scopeChairperson($query)
    {
        return $query->where('role', MembershipRole::Chairperson);
    }
}
