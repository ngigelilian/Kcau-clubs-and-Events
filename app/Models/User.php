<?php

namespace App\Models;

use App\Enums\Gender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'student_id',
        'email',
        'avatar',
        'phone',
        'gender',
        'department',
        'year_of_study',
        'google_id',
        'email_verified_at',
        'password',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'gender' => Gender::class,
            'year_of_study' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Clubs created by this user.
     */
    public function createdClubs(): HasMany
    {
        return $this->hasMany(Club::class, 'created_by');
    }

    /**
     * Club memberships for this user.
     */
    public function clubMemberships(): HasMany
    {
        return $this->hasMany(ClubMembership::class);
    }

    /**
     * Event registrations for this user.
     */
    public function eventRegistrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    /**
     * Orders placed by this user.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Payments made by this user.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Support tickets submitted by this user.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Tickets assigned to this user (admin).
     */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }

    /**
     * Announcements authored by this user.
     */
    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Scope to only active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to only students (users with student role).
     */
    public function scopeStudents($query)
    {
        return $query->role('student');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if the user is a member of a specific club.
     */
    public function isMemberOf(Club $club): bool
    {
        return $this->clubMemberships()
            ->where('club_id', $club->id)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Check if the user is a leader of a specific club.
     */
    public function isLeaderOf(Club $club): bool
    {
        return $this->clubMemberships()
            ->where('club_id', $club->id)
            ->where('status', 'active')
            ->whereIn('role', ['leader', 'co-leader'])
            ->exists();
    }

    /**
     * Check if this is an OAuth-only user (no password set).
     */
    public function isOAuthUser(): bool
    {
        return $this->google_id !== null && $this->password === null;
    }
}
