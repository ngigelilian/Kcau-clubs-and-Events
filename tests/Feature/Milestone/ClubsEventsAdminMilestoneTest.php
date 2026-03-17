<?php

use App\Enums\ClubCategory;
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

function eventPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Milestone Event ' . fake()->unique()->numerify('###'),
        'description' => 'This is a sufficiently detailed event description for milestone tests.',
        'type' => EventType::Club->value,
        'venue' => 'Main Hall',
        'start_datetime' => Carbon::now()->addDays(5)->format('Y-m-d H:i:s'),
        'end_datetime' => Carbon::now()->addDays(5)->addHours(2)->format('Y-m-d H:i:s'),
        'capacity' => 50,
        'registration_deadline' => Carbon::now()->addDays(4)->format('Y-m-d H:i:s'),
        'is_paid' => false,
        'fee_amount' => null,
        'submit_for_approval' => true,
    ], $overrides);
}

it('promotes proposer membership to active leader when club is approved', function () {
    $proposer = User::factory()->create();
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($proposer)->post(route('clubs.store'), [
        'name' => 'Milestone Robotics Club',
        'description' => str_repeat('Robotics innovation and practical projects. ', 3),
        'category' => ClubCategory::Technology->value,
        'max_members' => 100,
    ])->assertRedirect();

    $club = Club::where('name', 'Milestone Robotics Club')->firstOrFail();

    $membership = ClubMembership::where('club_id', $club->id)
        ->where('user_id', $proposer->id)
        ->firstOrFail();

    expect($membership->status)->toBe(MembershipStatus::Pending)
        ->and($membership->role)->toBe(MembershipRole::Leader);

    $this->actingAs($admin)
        ->post(route('admin.clubs.approve', $club))
        ->assertRedirect();

    $club->refresh();
    $membership->refresh();
    $proposer->refresh();

    expect($club->status)->toBe(ClubStatus::Active)
        ->and($membership->status)->toBe(MembershipStatus::Active)
        ->and($membership->role)->toBe(MembershipRole::Leader)
        ->and($membership->joined_at)->not()->toBeNull()
        ->and($proposer->hasRole('club-leader'))->toBeTrue();
});

it('updates join request status on approve and reject actions', function () {
    $leader = User::factory()->create();
    $club = Club::factory()->active()->create(['created_by' => $leader->id]);

    ClubMembership::factory()->leader()->create([
        'club_id' => $club->id,
        'user_id' => $leader->id,
        'status' => MembershipStatus::Active,
    ]);

    $approveCandidate = User::factory()->create();
    $rejectCandidate = User::factory()->create();

    $this->actingAs($approveCandidate)
        ->post(route('clubs.join', $club))
        ->assertRedirect();

    $approveMembership = ClubMembership::where('club_id', $club->id)
        ->where('user_id', $approveCandidate->id)
        ->firstOrFail();

    expect($approveMembership->status)->toBe(MembershipStatus::Pending);

    $this->actingAs($leader)
        ->post(route('clubs.members.approve', [$club, $approveMembership->id]))
        ->assertRedirect();

    $approveMembership->refresh();
    expect($approveMembership->status)->toBe(MembershipStatus::Active);

    $this->actingAs($rejectCandidate)
        ->post(route('clubs.join', $club))
        ->assertRedirect();

    $rejectMembership = ClubMembership::where('club_id', $club->id)
        ->where('user_id', $rejectCandidate->id)
        ->firstOrFail();

    $this->actingAs($leader)
        ->post(route('clubs.members.reject', [$club, $rejectMembership->id]))
        ->assertRedirect();

    expect($rejectMembership->fresh()->status)->toBe(MembershipStatus::Rejected);
});

it('blocks registration when event is already full', function () {
    $event = Event::factory()->approved()->create([
        'capacity' => 1,
        'type' => EventType::School,
        'club_id' => null,
        'status' => EventStatus::Approved,
        'start_datetime' => Carbon::now()->addDays(3),
        'end_datetime' => Carbon::now()->addDays(3)->addHours(2),
    ]);

    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();

    EventRegistration::factory()->create([
        'event_id' => $event->id,
        'user_id' => $firstUser->id,
        'status' => RegistrationStatus::Registered,
    ]);

    $this->actingAs($secondUser)
        ->post(route('events.register', $event))
        ->assertForbidden();
});

it('marks attendance and updates registration status', function () {
    $leader = User::factory()->create();
    $club = Club::factory()->active()->create(['created_by' => $leader->id]);

    ClubMembership::factory()->leader()->create([
        'club_id' => $club->id,
        'user_id' => $leader->id,
        'status' => MembershipStatus::Active,
    ]);

    $event = Event::factory()->approved()->create([
        'club_id' => $club->id,
        'type' => EventType::Club,
        'created_by' => $leader->id,
        'status' => EventStatus::Approved,
        'start_datetime' => Carbon::now()->addDays(2),
        'end_datetime' => Carbon::now()->addDays(2)->addHours(3),
    ]);

    $attendee = User::factory()->create();

    $registration = EventRegistration::factory()->create([
        'event_id' => $event->id,
        'user_id' => $attendee->id,
        'status' => RegistrationStatus::Registered,
        'attended_at' => null,
    ]);

    $this->actingAs($leader)
        ->post(route('events.mark-attendance', [$event, $attendee->id]))
        ->assertRedirect();

    $registration->refresh();

    expect($registration->status)->toBe(RegistrationStatus::Attended)
        ->and($registration->attended_at)->not()->toBeNull();
});

it('enforces role restrictions for school and club event creation', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $leader = User::factory()->create();
    $leader->assignRole('club-leader');

    $nonLeader = User::factory()->create();

    $club = Club::factory()->active()->create(['created_by' => $leader->id]);

    ClubMembership::factory()->leader()->create([
        'club_id' => $club->id,
        'user_id' => $leader->id,
        'status' => MembershipStatus::Active,
    ]);

    $leaderSchoolPayload = eventPayload([
        'type' => EventType::School->value,
        'club_id' => null,
    ]);

    $this->actingAs($leader)
        ->post(route('events.store'), $leaderSchoolPayload)
        ->assertSessionHasErrors('type');

    $leaderClubPayload = eventPayload([
        'title' => 'Leader Club Event ' . fake()->unique()->numerify('###'),
        'type' => EventType::Club->value,
        'club_id' => $club->id,
    ]);

    $this->actingAs($leader)
        ->post(route('events.store'), $leaderClubPayload)
        ->assertRedirect();

    $createdByLeader = Event::where('title', $leaderClubPayload['title'])->firstOrFail();
    expect($createdByLeader->type)->toBe(EventType::Club)
        ->and($createdByLeader->status)->toBe(EventStatus::Pending)
        ->and($createdByLeader->club_id)->toBe($club->id);

    $this->actingAs($nonLeader)
        ->post(route('events.store'), eventPayload([
            'title' => 'Non Leader Club Event ' . fake()->unique()->numerify('###'),
            'type' => EventType::Club->value,
            'club_id' => $club->id,
        ]))
        ->assertForbidden();

    $adminSchoolPayload = eventPayload([
        'title' => 'Admin School Event ' . fake()->unique()->numerify('###'),
        'type' => EventType::School->value,
        'club_id' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('events.store'), $adminSchoolPayload)
        ->assertRedirect();

    $createdByAdmin = Event::where('title', $adminSchoolPayload['title'])->firstOrFail();
    expect($createdByAdmin->type)->toBe(EventType::School)
        ->and($createdByAdmin->status)->toBe(EventStatus::Pending)
        ->and($createdByAdmin->club_id)->toBeNull();
});
