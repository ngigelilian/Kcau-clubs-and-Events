<?php

use App\Http\Controllers\Admin\ClubApprovalController;
use App\Http\Controllers\Admin\EventApprovalController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Auth\SocialiteController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MerchandiseController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// -------------------------------------------------------------------------
// Google OAuth Routes
// -------------------------------------------------------------------------

Route::prefix('auth/google')->name('auth.google.')->group(function () {
    Route::get('/redirect', [SocialiteController::class, 'redirect'])->name('redirect');
    Route::get('/callback', [SocialiteController::class, 'callback'])->name('callback');
});

// -------------------------------------------------------------------------
// Public Routes
// -------------------------------------------------------------------------

Route::get('clubs', [ClubController::class, 'index'])->name('clubs.index');
Route::get('clubs/{club}', [ClubController::class, 'show'])->name('clubs.show');

Route::get('events', [EventController::class, 'index'])->name('events.index');
Route::get('events/{event}', [EventController::class, 'show'])->name('events.show');

Route::get('merchandise', [MerchandiseController::class, 'index'])->name('merchandise.index');
Route::get('merchandise/{merchandise}', [MerchandiseController::class, 'show'])->name('merchandise.show');

// -------------------------------------------------------------------------
// Authenticated Routes
// -------------------------------------------------------------------------

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('orders', [PaymentController::class, 'orders'])->name('orders.index');
    Route::get('payments', [PaymentController::class, 'payments'])->name('payments.index');

    // -----------------------------------------------------------------
    // Club Routes (authenticated)
    // -----------------------------------------------------------------
    Route::prefix('clubs')->name('clubs.')->group(function () {
        Route::get('/create', [ClubController::class, 'create'])->name('create');
        Route::post('/', [ClubController::class, 'store'])->name('store');
        Route::get('/{club}/edit', [ClubController::class, 'edit'])->name('edit');
        Route::put('/{club}', [ClubController::class, 'update'])->name('update');
        Route::post('/{club}/join', [ClubController::class, 'join'])->name('join');
        Route::delete('/{club}/leave', [ClubController::class, 'leave'])->name('leave');

        // Membership management (club leaders)
        Route::get('/{club}/members', [ClubController::class, 'members'])->name('members');
        Route::post('/{club}/members/{membershipId}/approve', [ClubController::class, 'approveMember'])->name('members.approve');
        Route::post('/{club}/members/{membershipId}/reject', [ClubController::class, 'rejectMember'])->name('members.reject');
        Route::delete('/{club}/members/{membershipId}', [ClubController::class, 'removeMember'])->name('members.remove');
        Route::post('/{club}/members/{membershipId}/promote', [ClubController::class, 'promoteMember'])->name('members.promote');
        Route::post('/{club}/members/{membershipId}/demote', [ClubController::class, 'demoteMember'])->name('members.demote');

        // Club Merchandise
        Route::get('/{club}/merchandise/create', [MerchandiseController::class, 'create'])->name('merchandise.create');
        Route::post('/{club}/merchandise', [MerchandiseController::class, 'store'])->name('merchandise.store');
    });

    // -----------------------------------------------------------------
    // Event Routes (authenticated)
    // -----------------------------------------------------------------
    Route::prefix('events')->name('events.')->group(function () {
        Route::get('/create', [EventController::class, 'create'])->name('create');
        Route::post('/', [EventController::class, 'store'])->name('store');
        Route::get('/{event}/edit', [EventController::class, 'edit'])->name('edit');
        Route::put('/{event}', [EventController::class, 'update'])->name('update');
        Route::post('/{event}/register', [EventController::class, 'register'])->name('register');
        Route::delete('/{event}/register', [EventController::class, 'cancelRegistration'])->name('cancel-registration');
        Route::get('/{event}/attendees', [EventController::class, 'attendees'])->name('attendees');
        Route::post('/{event}/attendees/{userId}', [EventController::class, 'markAttendance'])->name('mark-attendance');
    });

    // -----------------------------------------------------------------
    // Merchandise Routes (authenticated)
    // -----------------------------------------------------------------
    Route::prefix('merchandise')->name('merchandise.')->group(function () {
        Route::get('/{merchandise}/edit', [MerchandiseController::class, 'edit'])->name('edit');
        Route::put('/{merchandise}', [MerchandiseController::class, 'update'])->name('update');
        Route::delete('/{merchandise}', [MerchandiseController::class, 'destroy'])->name('destroy');
        Route::post('/{merchandise}/order', [MerchandiseController::class, 'order'])->name('order');
    });

    // -----------------------------------------------------------------
    // Ticket Routes
    // -----------------------------------------------------------------
    Route::prefix('tickets')->name('tickets.')->group(function () {
        Route::get('/', [TicketController::class, 'index'])->name('index');
        Route::get('/create', [TicketController::class, 'create'])->name('create');
        Route::post('/', [TicketController::class, 'store'])->name('store');
        Route::get('/{ticket}', [TicketController::class, 'show'])->name('show');
        Route::post('/{ticket}/reply', [TicketController::class, 'reply'])->name('reply');
        Route::post('/{ticket}/assign', [TicketController::class, 'assign'])->name('assign');
        Route::post('/{ticket}/resolve', [TicketController::class, 'resolve'])->name('resolve');
        Route::post('/{ticket}/close', [TicketController::class, 'close'])->name('close');
    });

    // -----------------------------------------------------------------
    // Announcement Routes
    // -----------------------------------------------------------------
    Route::prefix('announcements')->name('announcements.')->group(function () {
        Route::get('/', [AnnouncementController::class, 'index'])->name('index');
        Route::get('/create', [AnnouncementController::class, 'create'])->name('create');
        Route::post('/', [AnnouncementController::class, 'store'])->name('store');
        Route::get('/{announcement}', [AnnouncementController::class, 'show'])->name('show');
    });

    // -----------------------------------------------------------------
    // Admin Routes
    // -----------------------------------------------------------------
    Route::prefix('admin')->name('admin.')->middleware('role:admin|super-admin')->group(function () {
        // Club Approval & Management
        Route::get('/clubs', [ClubApprovalController::class, 'index'])->name('clubs.index');
        Route::get('/clubs/{club}', [ClubApprovalController::class, 'show'])->name('clubs.show');
        Route::post('/clubs/{club}/approve', [ClubApprovalController::class, 'approve'])->name('clubs.approve');
        Route::post('/clubs/{club}/reject', [ClubApprovalController::class, 'reject'])->name('clubs.reject');
        Route::post('/clubs/{club}/suspend', [ClubApprovalController::class, 'suspend'])->name('clubs.suspend');
        Route::post('/clubs/{club}/reactivate', [ClubApprovalController::class, 'reactivate'])->name('clubs.reactivate');

        // Event Approval & Management
        Route::get('/events', [EventApprovalController::class, 'index'])->name('events.index');
        Route::get('/events/{event}', [EventApprovalController::class, 'show'])->name('events.show');
        Route::post('/events/{event}/approve', [EventApprovalController::class, 'approve'])->name('events.approve');
        Route::post('/events/{event}/reject', [EventApprovalController::class, 'reject'])->name('events.reject');
        Route::post('/events/{event}/cancel', [EventApprovalController::class, 'cancel'])->name('events.cancel');
        Route::post('/events/{event}/complete', [EventApprovalController::class, 'complete'])->name('events.complete');

        // User Management
        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserManagementController::class, 'show'])->name('users.show');
        Route::post('/users/{user}/toggle-active', [UserManagementController::class, 'toggleActive'])->name('users.toggle-active');
        Route::put('/users/{user}/role', [UserManagementController::class, 'updateRole'])->name('users.update-role');
    });
});

require __DIR__.'/settings.php';
