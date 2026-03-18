<?php

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::post('/mpesa/callback', [PaymentController::class, 'callback'])
    ->middleware('throttle:60,1')
    ->name('api.mpesa.callback');

// Notification endpoints (authenticated)
Route::middleware('auth:sanctum')->prefix('notifications')->name('api.notifications.')->group(function () {
    Route::get('/unread', [NotificationController::class, 'unread'])->name('unread');
    Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('mark-read');
    Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
    Route::delete('/{notification}', [NotificationController::class, 'delete'])->name('delete');
    Route::delete('/', [NotificationController::class, 'clearAll'])->name('clear-all');
});