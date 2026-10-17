<?php

use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\TestCase;

uses(TestCase::class);

function raceDemo(array $a, array $b): array
{
    $start = microtime(true) + 3;
    $processes = [];
    foreach ([$a, $b] as $input) {
        $process = new Process([PHP_BINARY, '-c', php_ini_loaded_file(), base_path('tests/concurrency-worker.php'), json_encode([...$input, 'start' => $start])], base_path(), ['APP_ENV' => 'testing', 'DB_DATABASE' => 'lola_demo_test']);
        $process->setTimeout(45);
        $process->start();
        $processes[] = $process;
    }
    $results = [];
    foreach ($processes as $process) {
        $process->wait();
        expect($process->isSuccessful())->toBeTrue($process->getErrorOutput());
        $results[] = json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR);
    }

    return $results;
}

beforeEach(function () {
    $this->artisan('migrate', ['--no-interaction' => true])->assertSuccessful();
    $this->seed();
    $this->staff = User::where('role', 'staff')->firstOrFail();
    $this->customer = User::where('role', 'customer')->firstOrFail();
    $this->court = Court::create(['name' => 'Race '.bin2hex(random_bytes(6)), 'sport' => 'badminton', 'hourly_rate' => 50000, 'open_hour' => 8, 'close_hour' => 22, 'active' => true]);
    $this->data = ['court_id' => $this->court->id, 'date' => now('Asia/Jakarta')->addDays(3)->format('Y-m-d'), 'hour' => 10, 'duration' => 2];
});

it('allows exactly one overlapping concurrent booking from independent processes', function () {
    $job = ['action' => 'create', 'user' => $this->customer->id, 'data' => $this->data];
    $results = raceDemo($job, $job);
    expect(array_column($results, 'ok'))->toContain(true, false);
    expect(Booking::where('court_id', $this->court->id)->count())->toBe(1);
    expect(min(array_column($results, 'ended')))->toBeGreaterThan(max(array_column($results, 'began')));
});

it('approves a pending payment once under simultaneous verification', function () {
    $booking = app(BookingService::class)->create($this->customer, $this->data);
    $payment = $booking->payments()->create(['amount' => 50000, 'method' => 'transfer', 'status' => 'pending', 'submitted_by' => $this->customer->id]);
    $booking->update(['status' => 'review']);
    $job = ['action' => 'review', 'user' => $this->staff->id, 'payment' => $payment->id];
    $results = raceDemo($job, $job);
    expect(array_column($results, 'ok'))->toContain(true, false);
    expect((int) $booking->payments()->where('status', 'approved')->sum('amount'))->toBe(50000);
    expect(DB::table('audit_events')->where('booking_id', $booking->id)->where('action', 'payment_approved')->count())->toBe(1);
});

it('prevents concurrent cash payments from exceeding the bill', function () {
    $booking = app(BookingService::class)->create($this->customer, $this->data);
    $job = ['action' => 'cash', 'user' => $this->staff->id, 'booking' => $booking->id, 'amount' => 100000];
    $results = raceDemo($job, $job);
    expect(array_column($results, 'ok'))->toContain(true, false);
    expect((int) $booking->payments()->where('status', 'approved')->sum('amount'))->toBe(100000);
});

it('serializes cancellation against approval and keeps accepted receipts', function () {
    $booking = app(BookingService::class)->create($this->customer, $this->data);
    $payment = $booking->payments()->create(['amount' => 50000, 'method' => 'transfer', 'status' => 'pending', 'submitted_by' => $this->customer->id]);
    $booking->update(['status' => 'review']);
    raceDemo(['action' => 'cancel', 'user' => $this->customer->id, 'booking' => $booking->id], ['action' => 'review', 'user' => $this->staff->id, 'payment' => $payment->id]);
    expect($booking->refresh()->status)->toBe('cancelled');
    expect(Payment::find($payment->id)->status)->toBeIn(['approved', 'rejected']);
    expect((int) $booking->payments()->where('status', 'approved')->sum('amount'))->toBeIn([0, 50000]);
});
