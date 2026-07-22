<?php

use App\Enums\MerchandiseStatus;
use App\Models\Merchandise;
use App\Models\User;
use Spatie\Permission\Models\Role;

it('allows admin to approve pending merchandise', function () {
    $admin = User::factory()->create();
    Role::firstOrCreate(['name' => 'admin']);
    $admin->assignRole('admin');

    $item = Merchandise::factory()->create(['status' => MerchandiseStatus::Pending]);

    $this->actingAs($admin)
        ->post("/admin/merchandise/{$item->id}/approve")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($item->fresh()->status)->toBe(MerchandiseStatus::Available);
});

it('allows admin to reject pending merchandise', function () {
    $admin = User::factory()->create();
    Role::firstOrCreate(['name' => 'admin']);
    $admin->assignRole('admin');

    $item = Merchandise::factory()->create(['status' => MerchandiseStatus::Pending]);

    $this->actingAs($admin)
        ->post("/admin/merchandise/{$item->id}/reject")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($item->fresh()->status)->toBe(MerchandiseStatus::Discontinued);
});
