<?php

use App\Enums\ClubStatus;
use App\Enums\MembershipStatus;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\User;

it('sets subscription fee due when joining a subscription club', function () {
    $student = User::factory()->create(['department' => 'Business Administration']);

    $club = Club::factory()->create([
        'status' => ClubStatus::Active,
        'membership_type' => 'subscription',
        'membership_fee' => 50000,
        'membership_discount_percent' => 10,
    ]);

    $this->actingAs($student)
        ->post(route('clubs.join', $club))
        ->assertRedirect();

    $membership = ClubMembership::where('club_id', $club->id)
        ->where('user_id', $student->id)
        ->firstOrFail();

    expect($membership->status)->toBe(MembershipStatus::Pending)
        ->and($membership->membership_fee_due)->toBe(45000)
        ->and($membership->membership_fee_waived)->toBeFalse();
});

it('waives fee for eligible faculty when joining a hybrid club', function () {
    $student = User::factory()->create(['department' => 'Information Technology']);

    $club = Club::factory()->create([
        'status' => ClubStatus::Active,
        'membership_type' => 'hybrid',
        'membership_fee' => 30000,
        'hybrid_free_faculty' => 'Information Technology',
    ]);

    $this->actingAs($student)
        ->post(route('clubs.join', $club))
        ->assertRedirect();

    $membership = ClubMembership::where('club_id', $club->id)
        ->where('user_id', $student->id)
        ->firstOrFail();

    expect($membership->status)->toBe(MembershipStatus::Pending)
        ->and($membership->membership_fee_due)->toBe(0)
        ->and($membership->membership_fee_waived)->toBeTrue();
});

it('allows a user to be a member of multiple clubs', function () {
    $student = User::factory()->create(['department' => 'Computer Science']);

    $clubOne = Club::factory()->create([
        'status' => ClubStatus::Active,
        'membership_type' => 'free',
    ]);

    $clubTwo = Club::factory()->create([
        'status' => ClubStatus::Active,
        'membership_type' => 'subscription',
        'membership_fee' => 20000,
    ]);

    $this->actingAs($student)->post(route('clubs.join', $clubOne))->assertRedirect();
    $this->actingAs($student)->post(route('clubs.join', $clubTwo))->assertRedirect();

    $memberships = ClubMembership::where('user_id', $student->id)->get();

    expect($memberships)->toHaveCount(2)
        ->and($memberships->pluck('club_id')->all())->toContain($clubOne->id, $clubTwo->id);
});
