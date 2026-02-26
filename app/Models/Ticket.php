<?php

namespace App\Models;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'subject',
        'description',
        'status',
        'priority',
        'assigned_to',
        'resolved_at',
        'closed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'priority' => TicketPriority::class,
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The user who submitted this ticket.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The admin assigned to this ticket.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Replies on this ticket.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only open tickets.
     */
    public function scopeOpen($query)
    {
        return $query->where('status', TicketStatus::Open);
    }

    /**
     * Scope to tickets that are overdue (open > 48 hours).
     */
    public function scopeOverdue($query)
    {
        return $query->whereIn('status', [TicketStatus::Open, TicketStatus::InProgress])
                     ->where('created_at', '<', now()->subHours(48));
    }

    /**
     * Scope to tickets assigned to a specific admin.
     */
    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    /**
     * Scope to unassigned tickets.
     */
    public function scopeUnassigned($query)
    {
        return $query->whereNull('assigned_to');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if the ticket is overdue (open for more than 48 hours).
     */
    public function isOverdue(): bool
    {
        return in_array($this->status, [TicketStatus::Open, TicketStatus::InProgress])
            && $this->created_at->diffInHours(now()) > 48;
    }

    /**
     * Check if the ticket can be closed.
     */
    public function canClose(): bool
    {
        return in_array($this->status, [TicketStatus::Resolved, TicketStatus::InProgress]);
    }
}
