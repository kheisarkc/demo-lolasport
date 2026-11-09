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
    // Pelanggan tanpa akun: pesan, cek pesanan, bayar QRIS, batalkan sebelum bayar.
    Route::get('/courts', [CourtController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store'])->middleware('throttle:booking');
    Route::post('/bookings/lookup', [BookingController::class, 'lookup'])->middleware('throttle:lookup');
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
    Route::post('/bookings/{booking}/payments', [PaymentController::class, 'store']);
    Route::get('/payments/{payment}/proof', [PaymentController::class, 'proof']);

    // Penjaga dan pemilik.
    Route::post('/login', [AuthController::class, 'login'])->middleware(['web', 'throttle:login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings/{booking}/check-in', [BookingController::class, 'checkIn']);
        Route::post('/bookings/{booking}/no-show', [BookingController::class, 'noShow']);
        Route::post('/payments/{payment}/review', [PaymentController::class, 'review']);
        Route::post('/staff/blocks', [BookingController::class, 'block']);
        Route::get('/owner/settings', [CourtController::class, 'settings']);
        Route::put('/owner/settings', [CourtController::class, 'updateSettings']);
        Route::post('/owner/courts', [CourtController::class, 'store']);
        Route::patch('/owner/courts/{court}', [CourtController::class, 'update']);
        Route::get('/reports', ReportController::class);
    });
});
