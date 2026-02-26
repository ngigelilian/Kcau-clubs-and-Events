<?php

namespace Database\Seeders;

use App\Enums\ClubCategory;
use App\Enums\ClubStatus;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Enums\MembershipRole;
use App\Enums\MembershipStatus;
use App\Enums\MerchandiseStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentStatusEnum;
use App\Enums\RegistrationStatus;
use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Announcement;
use App\Models\Club;
use App\Models\ClubMembership;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Merchandise;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding demo data...');

        // ─── Create Students ───────────────────────────────────────────
        $students = User::factory()->count(40)->create();
        $students->each(fn (User $u) => $u->assignRole('student'));
        $this->command->info('✓ Created 40 students');

        // ─── Create Clubs ──────────────────────────────────────────────
        $clubData = [
            ['name' => 'Tech Innovators Club', 'category' => ClubCategory::Technology, 'desc' => 'A community of tech enthusiasts exploring the latest in software development, AI, cybersecurity and more. We host hackathons, workshops and coding competitions.'],
            ['name' => 'Debating Society', 'category' => ClubCategory::Academic, 'desc' => 'Sharpen your critical thinking and public speaking skills. We participate in inter-university debates and organize weekly practice sessions.'],
            ['name' => 'Drama & Theatre Club', 'category' => ClubCategory::Cultural, 'desc' => 'Express yourself through the performing arts. We stage plays, skits, and musical performances throughout the academic year.'],
            ['name' => 'Football Club', 'category' => ClubCategory::Sports, 'desc' => 'KCAU\'s premier football club. We train regularly and compete in inter-university leagues and friendly matches.'],
            ['name' => 'Christian Union', 'category' => ClubCategory::Religious, 'desc' => 'A fellowship of Christian students meeting for Bible study, worship, and community service. Open to all who want to grow in faith.'],
            ['name' => 'Entrepreneurship Hub', 'category' => ClubCategory::Social, 'desc' => 'For aspiring entrepreneurs and business minds. We organize pitch competitions, mentorship sessions, and networking events.'],
            ['name' => 'Photography & Film Club', 'category' => ClubCategory::Cultural, 'desc' => 'Capture moments and tell stories through the lens. We cover campus events and host photography walks and film screenings.'],
            ['name' => 'Basketball Club', 'category' => ClubCategory::Sports, 'desc' => 'Hit the court with KCAU\'s basketball team. Regular training sessions and competitive matches throughout the semester.'],
        ];

        $admins = User::role('admin')->get()->merge(User::role('super-admin')->get());
        $approver = $admins->first();

        $clubs = collect();
        foreach ($clubData as $i => $cd) {
            $creator = $students[$i];
            $club = Club::create([
                'name' => $cd['name'],
                'slug' => Str::slug($cd['name']),
                'description' => $cd['desc'],
                'category' => $cd['category'],
                'status' => ClubStatus::Active,
                'created_by' => $creator->id,
                'approved_by' => $approver?->id,
                'approved_at' => now()->subDays(rand(30, 90)),
                'max_members' => rand(0, 1) ? rand(50, 200) : null,
            ]);

            // Creator is leader
            ClubMembership::create([
                'club_id' => $club->id,
                'user_id' => $creator->id,
                'role' => MembershipRole::Leader,
                'status' => MembershipStatus::Active,
                'joined_at' => $club->approved_at,
            ]);

            // A co-leader
            $coLeader = $students[$i + 8] ?? $students->random();
            if ($coLeader->id !== $creator->id) {
                ClubMembership::create([
                    'club_id' => $club->id,
                    'user_id' => $coLeader->id,
                    'role' => MembershipRole::CoLeader,
                    'status' => MembershipStatus::Active,
                    'joined_at' => $club->approved_at->addDays(rand(1, 7)),
                ]);
                if (! $coLeader->hasRole('club-leader')) {
                    $coLeader->assignRole('club-leader');
                }
            }

            if (! $creator->hasRole('club-leader')) {
                $creator->assignRole('club-leader');
            }

            $clubs->push($club);
        }
        $this->command->info('✓ Created ' . $clubs->count() . ' clubs with leaders');

        // ─── Add Members to Clubs ──────────────────────────────────────
        $memberPool = $students->slice(16); // remaining students
        foreach ($clubs as $club) {
            $memberCount = rand(5, 15);
            $selectedMembers = $memberPool->random(min($memberCount, $memberPool->count()));
            foreach ($selectedMembers as $student) {
                // Skip if already a member
                if (ClubMembership::where('club_id', $club->id)->where('user_id', $student->id)->exists()) {
                    continue;
                }
                ClubMembership::create([
                    'club_id' => $club->id,
                    'user_id' => $student->id,
                    'role' => MembershipRole::Member,
                    'status' => MembershipStatus::Active,
                    'joined_at' => now()->subDays(rand(1, 60)),
                ]);
            }

            // Add a couple of pending requests
            $pendingStudents = $students->whereNotIn('id',
                ClubMembership::where('club_id', $club->id)->pluck('user_id')
            )->take(2);
            foreach ($pendingStudents as $ps) {
                ClubMembership::create([
                    'club_id' => $club->id,
                    'user_id' => $ps->id,
                    'role' => MembershipRole::Member,
                    'status' => MembershipStatus::Pending,
                    'joined_at' => null,
                ]);
            }
        }
        $this->command->info('✓ Added members to clubs');

        // ─── One Pending Club ──────────────────────────────────────────
        $pendingClub = Club::create([
            'name' => 'Robotics & IoT Club',
            'slug' => Str::slug('Robotics & IoT Club'),
            'description' => 'Building the future with robots and IoT devices. We experiment with Arduino, Raspberry Pi and cutting-edge hardware.',
            'category' => ClubCategory::Technology,
            'status' => ClubStatus::Pending,
            'created_by' => $students->random()->id,
            'max_members' => 50,
        ]);
        ClubMembership::create([
            'club_id' => $pendingClub->id,
            'user_id' => $pendingClub->created_by,
            'role' => MembershipRole::Leader,
            'status' => MembershipStatus::Pending,
        ]);
        $this->command->info('✓ Created 1 pending club');

        // ─── Create Events ────────────────────────────────────────────
        $eventData = [
            ['title' => 'Annual Hackathon 2025', 'type' => EventType::Club, 'paid' => true, 'fee' => 50000, 'venue' => 'ICT Lab 1'],
            ['title' => 'Inter-University Debate Championship', 'type' => EventType::School, 'paid' => false, 'fee' => 0, 'venue' => 'Main Hall'],
            ['title' => 'Cultural Night', 'type' => EventType::School, 'paid' => true, 'fee' => 20000, 'venue' => 'Auditorium'],
            ['title' => 'Basketball Tournament', 'type' => EventType::Club, 'paid' => false, 'fee' => 0, 'venue' => 'Sports Ground'],
            ['title' => 'Startup Pitch Competition', 'type' => EventType::Club, 'paid' => false, 'fee' => 0, 'venue' => 'Conference Room A'],
            ['title' => 'Photography Exhibition', 'type' => EventType::Club, 'paid' => false, 'fee' => 0, 'venue' => 'Student Center'],
            ['title' => 'Career Fair 2025', 'type' => EventType::School, 'paid' => false, 'fee' => 0, 'venue' => 'Main Hall'],
            ['title' => 'Movie Night: Tech Documentaries', 'type' => EventType::Club, 'paid' => true, 'fee' => 10000, 'venue' => 'Chapel Hall'],
        ];

        $events = collect();
        foreach ($eventData as $i => $ed) {
            $club = $ed['type'] === EventType::Club ? $clubs[$i % $clubs->count()] : null;
            $startDate = now()->addDays(rand(7, 60));

            $event = Event::create([
                'title' => $ed['title'],
                'slug' => Str::slug($ed['title']),
                'description' => fake()->paragraphs(3, true),
                'club_id' => $club?->id,
                'type' => $ed['type'],
                'venue' => $ed['venue'],
                'start_datetime' => $startDate,
                'end_datetime' => $startDate->copy()->addHours(rand(2, 6)),
                'capacity' => rand(0, 1) ? rand(50, 300) : null,
                'registration_deadline' => $startDate->copy()->subDays(2),
                'is_paid' => $ed['paid'],
                'fee_amount' => $ed['fee'],
                'status' => EventStatus::Approved,
                'created_by' => $club ? ClubMembership::where('club_id', $club->id)->where('role', MembershipRole::Leader)->first()?->user_id ?? $students->first()->id : $approver?->id ?? $students->first()->id,
                'approved_by' => $approver?->id,
                'approved_at' => now()->subDays(rand(1, 14)),
            ]);

            $events->push($event);
        }

        // A couple of past events
        foreach ($clubs->take(2) as $club) {
            $pastStart = now()->subDays(rand(10, 45));
            $event = Event::create([
                'title' => $club->name . ' Welcome Mixer',
                'slug' => Str::slug($club->name . ' Welcome Mixer'),
                'description' => 'A welcome event for new members of ' . $club->name . '.',
                'club_id' => $club->id,
                'type' => EventType::Club,
                'venue' => 'Student Center',
                'start_datetime' => $pastStart,
                'end_datetime' => $pastStart->copy()->addHours(3),
                'capacity' => 100,
                'registration_deadline' => $pastStart->copy()->subDays(1),
                'is_paid' => false,
                'fee_amount' => 0,
                'status' => EventStatus::Completed,
                'created_by' => ClubMembership::where('club_id', $club->id)->where('role', MembershipRole::Leader)->first()?->user_id ?? $students->first()->id,
                'approved_by' => $approver?->id,
                'approved_at' => $pastStart->copy()->subDays(7),
            ]);
            $events->push($event);
        }

        // A pending event
        $pendingEvent = Event::create([
            'title' => 'Coding Bootcamp Weekend',
            'slug' => Str::slug('Coding Bootcamp Weekend'),
            'description' => 'An intensive weekend bootcamp covering web development fundamentals.',
            'club_id' => $clubs->first()->id,
            'type' => EventType::Club,
            'venue' => 'ICT Lab 2',
            'start_datetime' => now()->addDays(30),
            'end_datetime' => now()->addDays(30)->addHours(8),
            'capacity' => 40,
            'registration_deadline' => now()->addDays(25),
            'is_paid' => true,
            'fee_amount' => 100000,
            'status' => EventStatus::Pending,
            'created_by' => $students->first()->id,
        ]);

        $this->command->info('✓ Created ' . $events->count() . ' events + 1 pending');

        // ─── Event Registrations ───────────────────────────────────────
        foreach ($events->where('status', EventStatus::Approved)->take(6) as $event) {
            $regCount = rand(5, 15);
            $registrants = $students->random(min($regCount, $students->count()));
            foreach ($registrants as $student) {
                EventRegistration::create([
                    'event_id' => $event->id,
                    'user_id' => $student->id,
                    'status' => RegistrationStatus::Registered,
                    'payment_status' => $event->is_paid ? PaymentStatusEnum::Pending : PaymentStatusEnum::Waived,
                    'registered_at' => now()->subDays(rand(1, 14)),
                ]);
            }
        }

        // Mark attendance for past events
        foreach ($events->where('status', EventStatus::Completed) as $event) {
            $attendees = $students->random(min(8, $students->count()));
            foreach ($attendees as $student) {
                EventRegistration::create([
                    'event_id' => $event->id,
                    'user_id' => $student->id,
                    'status' => RegistrationStatus::Attended,
                    'payment_status' => PaymentStatusEnum::Waived,
                    'registered_at' => $event->start_datetime->copy()->subDays(5),
                    'attended_at' => $event->start_datetime,
                ]);
            }
        }
        $this->command->info('✓ Created event registrations');

        // ─── Merchandise ───────────────────────────────────────────────
        $merchItems = [
            ['name' => 'Tech Innovators T-Shirt', 'price' => 80000, 'stock' => 50],
            ['name' => 'Tech Innovators Hoodie', 'price' => 200000, 'stock' => 30],
            ['name' => 'Debating Society Cap', 'price' => 50000, 'stock' => 40],
            ['name' => 'Football Club Jersey', 'price' => 150000, 'stock' => 25],
            ['name' => 'KCAU Branded Water Bottle', 'price' => 60000, 'stock' => 60],
            ['name' => 'Photography Club Lanyard', 'price' => 20000, 'stock' => 80],
            ['name' => 'Entrepreneurship Hub Notebook', 'price' => 30000, 'stock' => 100],
            ['name' => 'Drama Club Tote Bag', 'price' => 45000, 'stock' => 35],
            ['name' => 'Basketball Club Wristband', 'price' => 15000, 'stock' => 100],
            ['name' => 'CU Branded Mug', 'price' => 40000, 'stock' => 45],
        ];

        foreach ($merchItems as $i => $item) {
            $club = $clubs[$i % $clubs->count()];
            Merchandise::create([
                'club_id' => $club->id,
                'name' => $item['name'],
                'description' => "Official {$club->name} merchandise. High quality, limited stock.",
                'price' => $item['price'],
                'stock_quantity' => $item['stock'],
                'status' => MerchandiseStatus::Available,
            ]);
        }

        // One out of stock
        Merchandise::create([
            'club_id' => $clubs->first()->id,
            'name' => 'Limited Edition Hackathon T-Shirt',
            'description' => 'Exclusive t-shirt from the 2024 hackathon. Sold out!',
            'price' => 100000,
            'stock_quantity' => 0,
            'status' => MerchandiseStatus::OutOfStock,
        ]);
        $this->command->info('✓ Created merchandise items');

        // ─── Orders & Payments ─────────────────────────────────────────
        $merchandise = Merchandise::where('status', MerchandiseStatus::Available)->get();
        foreach ($students->random(10) as $student) {
            $item = $merchandise->random();
            $qty = rand(1, 2);
            $order = Order::create([
                'user_id' => $student->id,
                'orderable_type' => Merchandise::class,
                'orderable_id' => $item->id,
                'quantity' => $qty,
                'unit_price' => $item->price,
                'total_amount' => $item->price * $qty,
                'status' => fake()->randomElement([OrderStatus::Pending, OrderStatus::Paid, OrderStatus::Fulfilled]),
                'mpesa_reference' => fake()->boolean(60) ? strtoupper(fake()->bothify('??##??####')) : null,
            ]);

            if ($order->status !== OrderStatus::Pending) {
                Payment::create([
                    'order_id' => $order->id,
                    'user_id' => $student->id,
                    'amount' => $order->total_amount,
                    'phone_number' => '2547' . fake()->numerify('########'),
                    'mpesa_checkout_request_id' => strtoupper(fake()->bothify('ws_CO_########_######_####')),
                    'mpesa_receipt_number' => $order->mpesa_reference,
                    'status' => PaymentStatus::Completed,
                    'payment_method' => PaymentMethod::Mpesa,
                    'paid_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }
        $this->command->info('✓ Created orders & payments');

        // ─── Announcements ─────────────────────────────────────────────
        // System-wide
        Announcement::create([
            'club_id' => null,
            'user_id' => $approver?->id ?? $students->first()->id,
            'title' => 'Welcome to the New Semester!',
            'body' => "Dear students, welcome to the new semester at KCA University. We're excited to have you back! Check out all the clubs and events available this semester. Get involved and make the most of your university experience.",
            'audience' => \App\Enums\AnnouncementAudience::AllMembers,
            'is_email' => true,
            'published_at' => now()->subDays(7),
        ]);

        // Club announcements
        foreach ($clubs->take(4) as $club) {
            $leader = ClubMembership::where('club_id', $club->id)->where('role', MembershipRole::Leader)->first();
            Announcement::create([
                'club_id' => $club->id,
                'user_id' => $leader?->user_id ?? $students->first()->id,
                'title' => $club->name . ' — Important Update',
                'body' => fake()->paragraphs(2, true),
                'audience' => \App\Enums\AnnouncementAudience::AllMembers,
                'is_email' => false,
                'published_at' => now()->subDays(rand(1, 14)),
            ]);
        }
        $this->command->info('✓ Created announcements');

        // ─── Support Tickets ───────────────────────────────────────────
        $ticketSubjects = [
            'Cannot join the Football Club',
            'My event registration payment was deducted but not reflected',
            'Need to change my student email address',
            'Club proposal has been pending for 2 weeks',
            'Event attendance was not marked correctly',
        ];

        foreach ($ticketSubjects as $i => $subject) {
            $student = $students[$i];
            $ticket = Ticket::create([
                'user_id' => $student->id,
                'subject' => $subject,
                'description' => fake()->paragraphs(2, true),
                'status' => fake()->randomElement([TicketStatus::Open, TicketStatus::InProgress, TicketStatus::Resolved]),
                'priority' => fake()->randomElement(TicketPriority::cases()),
                'assigned_to' => fake()->boolean(60) ? $approver?->id : null,
                'resolved_at' => null,
            ]);

            if ($ticket->status === TicketStatus::Resolved) {
                $ticket->update(['resolved_at' => now()->subDays(rand(1, 5))]);
            }

            // Add replies
            TicketReply::create([
                'ticket_id' => $ticket->id,
                'user_id' => $student->id,
                'message' => 'I submitted this issue ' . rand(2, 7) . ' days ago. Any updates?',
            ]);

            if ($ticket->assigned_to) {
                TicketReply::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $ticket->assigned_to,
                    'message' => 'Thank you for reporting this. We are looking into it and will get back to you shortly.',
                ]);
            }
        }

        // A closed ticket
        $closedTicket = Ticket::create([
            'user_id' => $students->random()->id,
            'subject' => 'How do I enable two-factor authentication?',
            'description' => 'I want to enable 2FA on my account but cannot find the option.',
            'status' => TicketStatus::Closed,
            'priority' => TicketPriority::Low,
            'assigned_to' => $approver?->id,
            'resolved_at' => now()->subDays(3),
            'closed_at' => now()->subDays(2),
        ]);
        TicketReply::create([
            'ticket_id' => $closedTicket->id,
            'user_id' => $approver?->id ?? $students->first()->id,
            'message' => 'You can enable 2FA from Settings > Two-Factor Authentication. Let us know if you need further help!',
        ]);
        $this->command->info('✓ Created support tickets');

        $this->command->info('');
        $this->command->info('🎉 Demo data seeded successfully!');
        $this->command->info("   • {$students->count()} students");
        $this->command->info("   • {$clubs->count()} active clubs + 1 pending");
        $this->command->info("   • {$events->count()} events + 1 pending");
        $this->command->info('   • Merchandise, orders, payments, announcements, & tickets');
    }
}
