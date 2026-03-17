<?php

use App\Enums\ClubStatus;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Enums\RegistrationStatus;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\User;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::findOrCreate('super-admin', 'web');
    Role::findOrCreate('admin', 'web');
    Role::findOrCreate('club-leader', 'web');
    Role::findOrCreate('student', 'web');
});

it('validates admin club queue transitions approve reject suspend reactivate', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $proposer = User::factory()->create();

    $pendingClub = Club::factory()->pending()->create(['created_by' => $proposer->id]);
    ClubMembership::factory()->leader()->pending()->create([
        'club_id' => $pendingClub->id,
        'user_id' => $proposer->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.clubs.approve', $pendingClub))
        ->assertRedirect();

    $pendingClub->refresh();
    expect($pendingClub->status)->toBe(ClubStatus::Active);

    $suspendTarget = Club::factory()->active()->create(['created_by' => $proposer->id]);

    $this->actingAs($admin)
        ->post(route('admin.clubs.suspend', $suspendTarget), ['reason' => 'Policy violation'])
        ->assertRedirect();

    $suspendTarget->refresh();
    expect($suspendTarget->status)->toBe(ClubStatus::Suspended);

    $this->actingAs($admin)
        ->post(route('admin.clubs.reactivate', $suspendTarget))
        ->assertRedirect();

    expect($suspendTarget->fresh()->status)->toBe(ClubStatus::Active);

    $rejectTarget = Club::factory()->pending()->create(['created_by' => $proposer->id]);
    ClubMembership::factory()->leader()->pending()->create([
        'club_id' => $rejectTarget->id,
        'user_id' => $proposer->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.clubs.reject', $rejectTarget), ['reason' => 'Insufficient detail'])
        ->assertRedirect();

    expect($rejectTarget->fresh()->status)->toBe(ClubStatus::Suspended)
        ->and(
            ClubMembership::where('club_id', $rejectTarget->id)
                ->where('user_id', $proposer->id)
                ->firstOrFail()
                ->status
        )->toBe(MembershipStatus::Rejected);
});

it('validates admin event queue transitions approve reject cancel complete', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $creator = User::factory()->create();

    $pendingForApproval = Event::factory()->pending()->create([
        'created_by' => $creator->id,
        'type' => EventType::School,
        'club_id' => null,
        'start_datetime' => Carbon::now()->addDays(3),
        'end_datetime' => Carbon::now()->addDays(3)->addHours(2),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.events.approve', $pendingForApproval))
        ->assertRedirect();

    expect($pendingForApproval->fresh()->status)->toBe(EventStatus::Approved);

    $pendingForReject = Event::factory()->pending()->create([
        'created_by' => $creator->id,
        'type' => EventType::School,
        'club_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.events.reject', $pendingForReject), ['reason' => 'Missing logistics'])
        ->assertRedirect();

    expect($pendingForReject->fresh()->status)->toBe(EventStatus::Rejected);

    $approvedForCancel = Event::factory()->approved()->create([
        'created_by' => $creator->id,
        'type' => EventType::School,
        'club_id' => null,
        'status' => EventStatus::Approved,
    ]);

    $registeredUser = User::factory()->create();
    EventRegistration::factory()->create([
        'event_id' => $approvedForCancel->id,
        'user_id' => $registeredUser->id,
        'status' => RegistrationStatus::Registered,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.events.cancel', $approvedForCancel), ['reason' => 'Venue unavailable'])
        ->assertRedirect();

    $cancelled = $approvedForCancel->fresh();
    expect($cancelled->status)->toBe(EventStatus::Cancelled)
        ->and(
            EventRegistration::where('event_id', $cancelled->id)
                ->where('user_id', $registeredUser->id)
                ->firstOrFail()
                ->status
        )->toBe(RegistrationStatus::Cancelled);

    $approvedForComplete = Event::factory()->approved()->create([
        'created_by' => $creator->id,
        'type' => EventType::School,
        'club_id' => null,
        'status' => EventStatus::Approved,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.events.complete', $approvedForComplete))
        ->assertRedirect();

    expect($approvedForComplete->fresh()->status)->toBe(EventStatus::Completed);
});
