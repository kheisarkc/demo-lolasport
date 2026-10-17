<?php

use App\Models\Court;
use App\Models\User;
use App\Services\BookingService;
use Carbon\CarbonImmutable;

it('exposes distinct public slot states and server clock without booking identity', function () {
    $this->seed();
    $customer = User::where('role', 'customer')->firstOrFail();
    $staff = User::where('role', 'staff')->firstOrFail();
    $court = Court::firstOrFail();
    $date = now('Asia/Jakarta')->addDay()->format('Y-m-d');
    $data = ['court_id' => $court->id, 'date' => $date, 'hour' => 10, 'duration' => 1];
    $booking = app(BookingService::class)->create($customer, $data);
    app(BookingService::class)->create($staff, [...$data, 'hour' => 11, 'reason' => 'Pemeliharaan demo'], true);
    $result = $this->getJson('/api/v1/courts?date='.$date)->assertOk()->json();
    expect($result['server_now'])->not->toBeEmpty();
    $slots = collect($result['courts'][0]['slots'])->keyBy('hour');
    expect($slots[8]['status'])->toBe('available')->and($slots[10]['status'])->toBe('booked')->and($slots[11]['status'])->toBe('blocked');
    expect(json_encode($result))->not->toContain('customer_name', 'customer_id', 'Pemeliharaan demo');
    $past = $this->getJson('/api/v1/courts?date=2020-01-01')->assertOk()->json('courts.0.slots.0.status');
    expect($past)->toBe('past');
    $this->actingAs($customer)->getJson('/api/v1/bookings/'.$booking->id)->assertOk()->assertJsonStructure(['server_now', 'expires_at']);
});

it('reconciles payment kinds using complete approval history outside the report range', function () {
    $this->seed();
    $staff = User::where('role', 'staff')->firstOrFail();
    $owner = User::where('role', 'owner')->firstOrFail();
    $court = Court::firstOrFail();
    $service = app(BookingService::class);
    $data = ['court_id' => $court->id, 'date' => now('Asia/Jakarta')->addDays(5)->format('Y-m-d'), 'hour' => 10, 'duration' => 1, 'customer_name' => 'Tim Fiktif'];
    $booking = $service->create($staff, $data);
    $dp = $service->submit($booking, $staff, ['method' => 'cash', 'amount' => 75000], null);
    $dp->update(['reviewed_at' => CarbonImmutable::parse('2026-10-01 10:00', 'Asia/Jakarta')]);
    $settlement = $service->submit($booking, $staff, ['method' => 'cash', 'amount' => 75000], null);
    $settlement->update(['reviewed_at' => CarbonImmutable::parse('2026-10-02 10:00', 'Asia/Jakarta')]);
    $fullBooking = $service->create($staff, [...$data, 'hour' => 12]);
    $full = $service->submit($fullBooking, $staff, ['method' => 'cash', 'amount' => 150000], null);
    $full->update(['reviewed_at' => CarbonImmutable::parse('2026-10-02 11:00', 'Asia/Jakarta')]);
    $report = $this->actingAs($owner)->getJson('/api/v1/reports?from=2026-10-02&to=2026-10-02')->assertOk();
    $report->assertJsonPath('total', 225000)->assertJsonPath('totals_by_kind', ['dp' => 0, 'settlement' => 75000, 'full' => 150000]);
    expect(collect($report->json('transactions'))->keyBy('id')[$settlement->id]['kind'])->toBe('settlement');
    $all = $this->getJson('/api/v1/reports?from=2026-10-01&to=2026-10-02')->assertOk()->json();
    expect(array_sum($all['totals_by_kind']))->toBe($all['total'])->and($all['totals_by_kind']['dp'])->toBe(75000);
    $this->getJson('/api/v1/reports?from=2026-10-03&to=2026-10-01')->assertUnprocessable();
    $this->actingAs($staff)->getJson('/api/v1/reports')->assertForbidden();
});
