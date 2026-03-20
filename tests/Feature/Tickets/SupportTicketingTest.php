<?php

namespace Tests\Feature\Tickets;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SupportTicketingTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;
    protected User $admin;
    protected User $anotherAdmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Notification::fake();

        $this->student = User::factory()->create();
        // Create roles if they don't exist
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        
        $this->student->assignRole('student');

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->anotherAdmin = User::factory()->create();
        $this->anotherAdmin->assignRole('admin');
    }

    public function test_student_can_submit_support_ticket(): void
    {
        $response = $this->actingAs($this->student)->post(
            '/tickets',
            [
                'subject' => 'Payment issue with merchandise',
                'description' => 'I purchased merchandise yesterday but haven\'t received a confirmation email yet. My transaction ID is MP123456.',
                'priority' => TicketPriority::Medium->value,
            ]
        );

        $response->assertRedirect('/tickets/1');
        $this->assertDatabaseHas('tickets', [
            'subject' => 'Payment issue with merchandise',
            'user_id' => $this->student->id,
            'status' => 'open',
            'priority' => 'medium',
        ]);
    }

    public function test_student_can_view_their_tickets(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->student->id,
            'status' => TicketStatus::Open,
        ]);

        $response = $this->actingAs($this->student)->get('/tickets');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('tickets/index')
            ->has('tickets.data', 1)
        );
    }

    public function test_student_cannot_view_other_students_tickets(): void
    {
        $otherStudent = User::factory()->create();
        $otherStudent->assignRole('student');

        $ticket = Ticket::factory()->create([
            'user_id' => $otherStudent->id,
        ]);

        $response = $this->actingAs($this->student)->get('/tickets');

        $response->assertInertia(fn ($page) => $page
            ->has('tickets.data', 0)
        );
    }

    public function test_admin_can_view_all_tickets(): void
    {
        Ticket::factory(3)->create([
            'user_id' => $this->student->id,
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/tickets');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('admin/tickets/index')
            ->has('tickets.data', 3)
        );
    }

    public function test_admin_can_filter_tickets_by_status(): void
    {
        Ticket::factory(2)->create(['user_id' => $this->student->id, 'status' => TicketStatus::Open]);
        Ticket::factory(1)->create(['user_id' => $this->student->id, 'status' => TicketStatus::Resolved]);

        $response = $this->actingAs($this->admin)->get('/admin/tickets?status=resolved');

        $response->assertInertia(fn ($page) => $page
            ->has('tickets.data', 1)
        );
    }

    public function test_admin_can_filter_tickets_by_priority(): void
    {
        Ticket::factory(2)->create(['user_id' => $this->student->id, 'priority' => TicketPriority::High]);
        Ticket::factory(1)->create(['user_id' => $this->student->id, 'priority' => TicketPriority::Low]);

        $response = $this->actingAs($this->admin)->get('/admin/tickets?priority=high');

        $response->assertInertia(fn ($page) => $page
            ->has('tickets.data', 2)
        );
    }

    public function test_admin_can_assign_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->student->id]);

        $response = $this->actingAs($this->admin)->post(
            "/tickets/{$ticket->id}/assign",
            ['assigned_to' => $this->anotherAdmin->id]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'assigned_to' => $this->anotherAdmin->id,
        ]);
    }

    public function test_admin_reply_auto_updates_status_to_in_progress(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->student->id,
            'status' => TicketStatus::Open,
        ]);

        $this->actingAs($this->admin)->post(
            "/tickets/{$ticket->id}/reply",
            ['message' => 'We are looking into your issue.']
        );

        $ticket->refresh();
        $this->assertEquals(TicketStatus::InProgress, $ticket->status);
    }

    public function test_admin_can_reply_to_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->student->id]);

        $response = $this->actingAs($this->admin)->post(
            "/tickets/{$ticket->id}/reply",
            ['message' => 'We have received your request and will investigate shortly.']
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('ticket_replies', [
            'ticket_id' => $ticket->id,
            'user_id' => $this->admin->id,
            'message' => 'We have received your request and will investigate shortly.',
        ]);
    }

    public function test_student_can_reply_to_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->student->id]);

        $response = $this->actingAs($this->student)->post(
            "/tickets/{$ticket->id}/reply",
            ['message' => 'I have additional details to share.']
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('ticket_replies', [
            'ticket_id' => $ticket->id,
            'user_id' => $this->student->id,
        ]);
    }

    public function test_admin_can_mark_ticket_as_resolved(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->student->id,
            'status' => TicketStatus::InProgress,
        ]);

        $response = $this->actingAs($this->admin)->post("/tickets/{$ticket->id}/resolve");

        $response->assertRedirect();
        $ticket->refresh();
        $this->assertEquals(TicketStatus::Resolved, $ticket->status);
        $this->assertNotNull($ticket->resolved_at);
    }

    public function test_admin_can_close_ticket(): void
    {
        $ticket = Ticket::factory()->create([
            'user_id' => $this->student->id,
            'status' => TicketStatus::Resolved,
        ]);

        $response = $this->actingAs($this->admin)->post("/tickets/{$ticket->id}/close");

        $response->assertRedirect();
        $ticket->refresh();
        $this->assertEquals(TicketStatus::Closed, $ticket->status);
        $this->assertNotNull($ticket->closed_at);
    }

    public function test_ticket_detail_page_shows_conversation(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->student->id]);
        TicketReply::factory(3)->create(['ticket_id' => $ticket->id]);

        $response = $this->actingAs($this->student)->get("/tickets/{$ticket->id}");

        $response->assertInertia(fn ($page) => $page
            ->component('tickets/show')
            ->has('ticket.replies', 3)
        );
    }

    public function test_pagination_shows_20_tickets_per_page_for_admin(): void
    {
        Ticket::factory(25)->create(['user_id' => $this->student->id]);

        $response = $this->actingAs($this->admin)->get('/admin/tickets');

        $response->assertInertia(fn ($page) => $page
            ->has('tickets.data', 20)
        );
    }

    public function test_overdue_tickets_flagged_correctly(): void
    {
        $oldTicket = Ticket::factory()->create([
            'user_id' => $this->student->id,
            'created_at' => now()->subHours(50),
            'status' => TicketStatus::Open,
        ]);

        $newTicket = Ticket::factory()->create([
            'user_id' => $this->student->id,
            'created_at' => now()->subHours(24),
            'status' => TicketStatus::Open,
        ]);

        $response = $this->actingAs($this->admin)->get('/admin/tickets');

        $response->assertInertia(fn ($page) => $page
            ->where('statusCounts.overdue', 1)
        );
    }

    public function test_admin_can_filter_by_assignment(): void
    {
        Ticket::factory(2)->create([
            'user_id' => $this->student->id,
            'assigned_to' => $this->admin->id,
        ]);
        Ticket::factory(1)->create([
            'user_id' => $this->student->id,
            'assigned_to' => $this->anotherAdmin->id,
        ]);

        $response = $this->actingAs($this->admin)->get("/admin/tickets?assigned_to={$this->admin->id}");

        $response->assertInertia(fn ($page) => $page
            ->has('tickets.data', 2)
        );
    }

    public function test_admin_can_filter_by_unassigned(): void
    {
        Ticket::factory(2)->create(['user_id' => $this->student->id, 'assigned_to' => null]);
        Ticket::factory(1)->create(['user_id' => $this->student->id, 'assigned_to' => $this->admin->id]);

        $response = $this->actingAs($this->admin)->get('/admin/tickets?assigned_to=unassigned');

        $response->assertInertia(fn ($page) => $page
            ->has('tickets.data', 2)
        );
    }
}
