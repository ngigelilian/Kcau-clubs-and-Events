<?php

use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::post('/mpesa/callback', [PaymentController::class, 'callback'])
    ->middleware('throttle:60,1')
    ->name('api.mpesa.callback');