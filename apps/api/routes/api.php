<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CourtController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/v1/health', HealthController::class)->name('api.v1.health');
Route::prefix('v1')->group(function () {
    Route::get('/courts', [CourtController::class, 'index']);
    Route::post('/register', [AuthController::class, 'register'])->middleware(['web', 'throttle:login']);
    Route::post('/login', [AuthController::class, 'login'])->middleware(['web', 'throttle:login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{booking}', [BookingController::class, 'show']);
        Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::post('/bookings/{booking}/payments', [PaymentController::class, 'store']);
        Route::post('/payments/{payment}/review', [PaymentController::class, 'review']);
        Route::get('/payments/{payment}/proof', [PaymentController::class, 'proof']);
        Route::get('/staff/courts', [CourtController::class, 'all']);
        Route::post('/staff/courts', [CourtController::class, 'store']);
        Route::patch('/staff/courts/{court}', [CourtController::class, 'update']);
        Route::post('/staff/blocks', [BookingController::class, 'block']);
        Route::get('/reports', ReportController::class);
    });
});
