<?php

use App\Models\AuditEvent;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/*
 * Aturan demo setelah disamakan dengan lola-sport-v1 (10 Nov 2026).
 * Waktu dibekukan Selasa 10 Nov 2026 10.00 WIB.
 */
beforeEach(function () {
    $this->travelTo(CarbonImmutable::parse('2026-11-10 10:00', 'Asia/Jakarta'));
    $this->seed();
    $this->staff = User::where('role', 'staff')->firstOrFail();
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->court = Court::where('name', 'Futsal Sintetis')->firstOrFail();
    $this->payload = ['court_id' => $this->court->id, 'date' => '2026-11-12', 'hour' => 10, 'duration' => 2, 'customer_name' => 'Raka', 'customer_phone' => '0812-3456-7890'];
    Storage::fake('local');
});

/** @return array{code: string, token: string} */
function guestBooking($test, array $overrides = []): array
{
    $result = $test->postJson('/api/v1/bookings', [...$test->payload, ...$overrides])->assertCreated()->json();

    return ['code' => $result['code'], 'token' => $result['access_token']];
}

function proof(): UploadedFile
{
    return UploadedFile::fake()->create('bukti.pdf', 10, 'application/pdf');
}

function asGuest($test, string $token)
{
    return $test->withHeader('X-Booking-Token', $token);
}

it('seeds the real prices, staff and owner only, DP 50% and a 30 minute hold', function () {
    expect(Court::orderBy('id')->pluck('hourly_rate', 'name')->all())->toBe(['Futsal Sintetis' => 130000, 'Futsal Vinil' => 160000, 'Badminton 1' => 35000, 'Badminton 2' => 35000])
        ->and(User::pluck('role')->sort()->values()->all())->toBe(['owner', 'staff'])
        ->and(Setting::current()->only('dp_percent', 'hold_minutes'))->toBe(['dp_percent' => 50, 'hold_minutes' => 30]);
    $this->postJson('/api/v1/register', ['name' => 'x'])->assertNotFound();
});

it('lets a guest book with name and WhatsApp, without an account', function () {
    $result = $this->postJson('/api/v1/bookings', $this->payload)->assertCreated()->json();
    $booking = Booking::where('code', $result['code'])->firstOrFail();

    expect($booking->code)->toMatch('/^LS-[A-Z0-9]{6}$/')
        ->and($booking->source)->toBe('website')
        ->and($booking->customer_phone)->toBe('081234567890')
        ->and($booking->total)->toBe(260000)
        ->and($booking->minimum_dp)->toBe(130000)
        ->and($booking->expires_at->setTimezone('Asia/Jakarta')->format('H:i'))->toBe('10:30');

    $this->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 14, 'customer_phone' => ''])->assertUnprocessable()->assertJsonValidationErrors('customer_phone');
    $this->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 14, 'customer_phone' => '12345'])->assertUnprocessable();
    $this->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 14, 'amount' => 1000, 'method' => 'cash'])->assertUnprocessable();
});

it('opens a booking only with its token, or after checking code and WhatsApp', function () {
    $guest = guestBooking($this);
    $this->getJson("/api/v1/bookings/{$guest['code']}")->assertForbidden();
    $this->withHeader('X-Booking-Token', 'salah')->getJson("/api/v1/bookings/{$guest['code']}")->assertForbidden();

    $this->postJson('/api/v1/bookings/lookup', ['code' => strtolower($guest['code']), 'customer_phone' => '0899999999'])->assertUnprocessable();
    $token = $this->postJson('/api/v1/bookings/lookup', ['code' => strtolower($guest['code']), 'customer_phone' => '+62 812 3456 7890'])->assertOk()->json('access_token');
    expect($token)->toBe($guest['token']);

    asGuest($this, $token)->getJson("/api/v1/bookings/{$guest['code']}")->assertOk()->assertJsonPath('code', $guest['code'])->assertJsonStructure(['server_now', 'expires_at']);
    $this->getJson('/api/v1/bookings')->assertUnauthorized();
});

it('follows opening hours 07.00–01.00 with 00.00 on the operational date, and 30 days ahead', function () {
    guestBooking($this, ['hour' => 24, 'duration' => 1]);
    $late = Booking::latest('id')->firstOrFail();
    expect($late->play_date->format('Y-m-d'))->toBe('2026-11-12')
        ->and($late->starts_at->setTimezone('Asia/Jakarta')->format('Y-m-d H:i'))->toBe('2026-11-13 00:00');

    foreach ([['hour' => 6], ['hour' => 24, 'duration' => 2], ['hour' => 9, 'date' => '2026-11-10'], ['date' => '2026-12-11']] as $invalid) {
        $this->postJson('/api/v1/bookings', [...$this->payload, ...$invalid])->assertUnprocessable();
    }
    guestBooking($this, ['date' => '2026-12-10']);

    $slots = collect($this->getJson('/api/v1/courts?date=2026-11-12')->assertOk()->json('courts.0.slots'));
    expect($slots->pluck('hour')->all())->toBe(range(7, 24))
        ->and($slots->firstWhere('hour', 24)['status'])->toBe('booked');
});

it('treats 00.30 as part of the previous operational day', function () {
    $this->travelTo(CarbonImmutable::parse('2026-11-11 00:30', 'Asia/Jakarta'));
    expect($this->getJson('/api/v1/courts')->assertOk()->json('date'))->toBe('2026-11-10');
});

it('rejects overlap but allows adjacent slots, also at database level', function () {
    guestBooking($this);
    $this->postJson('/api/v1/bookings', $this->payload)->assertConflict();
    guestBooking($this, ['hour' => 12]);
    $original = Booking::firstOrFail();
    expect(fn () => DB::transaction(fn () => $original->replicate()->fill(['code' => 'LS-COPY01'])->save()))->toThrow(QueryException::class);
});

it('expires an unpaid hold after 30 minutes and keeps a timely proof in review', function () {
    $first = guestBooking($this);
    $this->travel(31)->minutes();
    $this->getJson('/api/v1/courts?date=2026-11-12')->assertOk();
    expect(Booking::where('code', $first['code'])->value('status'))->toBe('expired');

    $next = guestBooking($this);
    asGuest($this, $next['token'])->postJson("/api/v1/bookings/{$next['code']}/payments", ['amount' => 130000, 'method' => 'qris', 'proof' => proof()])->assertCreated();
    $this->travel(31)->minutes();
    $this->getJson('/api/v1/courts?date=2026-11-12');
    expect(Booking::where('code', $next['code'])->value('status'))->toBe('review');
});

it('accepts only QRIS with proof from guests and validates the file', function () {
    $guest = guestBooking($this);
    $url = "/api/v1/bookings/{$guest['code']}/payments";
    asGuest($this, $guest['token'])->postJson($url, ['method' => 'cash', 'amount' => 130000])->assertForbidden();
    $this->postJson($url, ['method' => 'qris', 'amount' => 130000])->assertUnprocessable();
    $this->postJson($url, ['method' => 'qris', 'amount' => 130000, 'proof' => UploadedFile::fake()->create('evil.html', 1, 'text/html')])->assertUnprocessable();
    $this->postJson($url, ['method' => 'qris', 'amount' => 129999, 'proof' => proof()])->assertUnprocessable();
    $this->flushHeaders()->postJson($url, ['method' => 'qris', 'amount' => 130000, 'proof' => proof()])->assertForbidden();
});

it('verifies DP then settlement, and keeps the booking when a settlement proof is rejected', function () {
    $guest = guestBooking($this);
    $url = "/api/v1/bookings/{$guest['code']}/payments";
    $dp = asGuest($this, $guest['token'])->postJson($url, ['amount' => 130000, 'method' => 'qris', 'proof' => proof()])->assertCreated()->json('id');
    $this->postJson($url, ['amount' => 130000, 'method' => 'qris', 'proof' => proof()])->assertConflict();
    expect(Booking::where('code', $guest['code'])->firstOrFail()->paid_amount)->toBe(0);
    $this->getJson("/api/v1/payments/$dp/proof")->assertOk();

    $this->flushHeaders()->actingAs($this->staff)->postJson("/api/v1/payments/$dp/review", ['decision' => 'approved'])->assertOk();
    $this->postJson("/api/v1/payments/$dp/review", ['decision' => 'approved'])->assertConflict();

    auth()->forgetGuards();
    $settle = asGuest($this, $guest['token'])->postJson($url, ['amount' => 130000, 'method' => 'qris', 'proof' => proof()])->assertCreated()->json('id');
    $this->flushHeaders()->actingAs($this->staff)->postJson("/api/v1/payments/$settle/review", ['decision' => 'rejected', 'reason' => 'Uang belum masuk'])->assertOk();
    expect(Booking::where('code', $guest['code'])->value('status'))->toBe('confirmed');
});

it('cancels the booking and frees the slot when the first DP proof is rejected', function () {
    $guest = guestBooking($this);
    $pid = asGuest($this, $guest['token'])->postJson("/api/v1/bookings/{$guest['code']}/payments", ['amount' => 130000, 'method' => 'qris', 'proof' => proof()])->json('id');
    $this->flushHeaders()->actingAs($this->staff)->postJson("/api/v1/payments/$pid/review", ['decision' => 'rejected'])->assertUnprocessable();
    $this->postJson("/api/v1/payments/$pid/review", ['decision' => 'rejected', 'reason' => 'Nominal tidak ada di mutasi'])->assertOk();

    expect(Booking::where('code', $guest['code'])->value('status'))->toBe('cancelled')
        ->and(Payment::find($pid)->rejection_reason)->toBe('Nominal tidak ada di mutasi');
    auth()->forgetGuards();
    guestBooking($this);
});

it('lets a guest cancel only before paying; staff can cancel later and the DP is kept', function () {
    $guest = guestBooking($this);
    asGuest($this, $guest['token'])->postJson("/api/v1/bookings/{$guest['code']}/cancel")->assertOk()->assertJsonPath('status', 'cancelled');

    $paid = guestBooking($this);
    $pid = asGuest($this, $paid['token'])->postJson("/api/v1/bookings/{$paid['code']}/payments", ['amount' => 130000, 'method' => 'qris', 'proof' => proof()])->json('id');
    $this->postJson("/api/v1/bookings/{$paid['code']}/cancel")->assertConflict();
    $this->flushHeaders()->actingAs($this->staff)->postJson("/api/v1/payments/$pid/review", ['decision' => 'approved']);
    $this->postJson("/api/v1/bookings/{$paid['code']}/cancel")->assertOk();

    $report = $this->actingAs($this->owner)->getJson('/api/v1/reports?from=2026-11-10&to=2026-11-10')->assertOk();
    $report->assertJsonPath('total', 130000)->assertJsonPath('forfeited', 130000)->assertJsonPath('totals_by_method.qris', 130000);
});

it('records a walk-in with at least the DP, cash or QRIS at the counter, with no deadline', function () {
    $this->actingAs($this->staff);
    $walkin = [...$this->payload, 'customer_phone' => null, 'customer_name' => 'Tim Senja'];
    $this->postJson('/api/v1/bookings', $walkin)->assertUnprocessable();
    $this->postJson('/api/v1/bookings', [...$walkin, 'amount' => 129999, 'method' => 'cash'])->assertUnprocessable();
    $booking = $this->postJson('/api/v1/bookings', [...$walkin, 'amount' => 130000, 'method' => 'qris'])->assertCreated()->json();

    expect($booking['source'])->toBe('walkin')->and($booking['status'])->toBe('confirmed')->and($booking['expires_at'])->toBeNull()->and($booking['paid_amount'])->toBe(130000);
    $this->postJson("/api/v1/bookings/{$booking['code']}/payments", ['amount' => 130001, 'method' => 'cash'])->assertUnprocessable();
    $this->postJson("/api/v1/bookings/{$booking['code']}/payments", ['amount' => 130000, 'method' => 'cash'])->assertCreated();
    expect(Booking::where('code', $booking['code'])->firstOrFail()->payment_status)->toBe('paid');
    $this->actingAs($this->owner)->postJson('/api/v1/bookings', [...$walkin, 'hour' => 14, 'amount' => 130000, 'method' => 'cash'])->assertForbidden();
});

it('marks present only when fully paid and from 60 minutes before, and no-show only after start', function () {
    $this->actingAs($this->staff);
    $code = $this->postJson('/api/v1/bookings', [...$this->payload, 'date' => '2026-11-10', 'hour' => 12, 'amount' => 130000, 'method' => 'cash'])->json('code');
    $this->postJson("/api/v1/bookings/$code/check-in")->assertConflict();
    $this->postJson("/api/v1/bookings/$code/no-show")->assertConflict();
    $this->postJson("/api/v1/bookings/$code/payments", ['amount' => 130000, 'method' => 'cash'])->assertCreated();
    $this->postJson("/api/v1/bookings/$code/check-in")->assertConflict();
    $this->travelTo(CarbonImmutable::parse('2026-11-10 11:00', 'Asia/Jakarta'));
    $this->postJson("/api/v1/bookings/$code/check-in")->assertOk()->assertJsonPath('status', 'checked_in');
    $this->postJson("/api/v1/bookings/$code/cancel")->assertConflict();

    $other = $this->postJson('/api/v1/bookings', [...$this->payload, 'date' => '2026-11-10', 'hour' => 15, 'duration' => 1, 'amount' => 65000, 'method' => 'cash'])->json('code');
    $this->postJson("/api/v1/bookings/$other/no-show")->assertConflict();
    $this->travelTo(CarbonImmutable::parse('2026-11-10 15:00', 'Asia/Jakarta'));
    $this->postJson("/api/v1/bookings/$other/no-show")->assertOk()->assertJsonPath('status', 'no_show');
    expect(AuditEvent::where('action', 'no_show')->count())->toBe(1);
});

it('lets staff close and reopen a slot', function () {
    $this->actingAs($this->staff);
    $block = $this->postJson('/api/v1/staff/blocks', [...$this->payload, 'hour' => 14, 'reason' => 'Perbaikan lampu'])->assertCreated()->json('code');
    auth()->forgetGuards();
    $this->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 14])->assertConflict();
    $this->actingAs($this->staff)->postJson("/api/v1/bookings/$block/cancel")->assertOk();
    auth()->forgetGuards();
    guestBooking($this, ['hour' => 14]);
});

it('gives price, DP and hold settings to the owner only', function () {
    $guest = guestBooking($this);
    $this->actingAs($this->staff)->getJson('/api/v1/owner/settings')->assertForbidden();
    $this->patchJson("/api/v1/owner/courts/{$this->court->id}", ['hourly_rate' => 140000])->assertForbidden();

    $this->actingAs($this->owner)->getJson('/api/v1/owner/settings')->assertOk()->assertJsonPath('hold_minutes', 30);
    $this->putJson('/api/v1/owner/settings', ['dp_percent' => 40, 'hold_minutes' => 3])->assertUnprocessable();
    $this->putJson('/api/v1/owner/settings', ['dp_percent' => 40, 'hold_minutes' => 20])->assertOk();
    $this->patchJson("/api/v1/owner/courts/{$this->court->id}", ['hourly_rate' => 140000])->assertOk();
    $this->patchJson("/api/v1/owner/courts/{$this->court->id}", ['active' => false])->assertConflict();
    $this->postJson('/api/v1/owner/courts', ['name' => 'Badminton 3', 'sport' => 'badminton', 'hourly_rate' => 35000])->assertCreated();

    expect(Booking::where('code', $guest['code'])->value('total'))->toBe(260000);
    auth()->forgetGuards();
    $next = Booking::where('code', guestBooking($this, ['hour' => 15, 'duration' => 1])['code'])->firstOrFail();
    expect($next->total)->toBe(140000)->and($next->minimum_dp)->toBe(56000)
        ->and($next->expires_at->setTimezone('Asia/Jakarta')->format('H:i'))->toBe('10:20');
});

it('reports receipts by approval date with kinds and methods', function () {
    $this->actingAs($this->staff);
    $code = $this->postJson('/api/v1/bookings', [...$this->payload, 'amount' => 130000, 'method' => 'cash'])->json('code');
    $this->postJson("/api/v1/bookings/$code/payments", ['method' => 'qris', 'amount' => 130000])->assertCreated();
    $payments = Payment::orderBy('id')->get();
    $payments[0]->update(['reviewed_at' => '2026-10-31 16:59:59+00']);
    $payments[1]->update(['reviewed_at' => '2026-10-31 17:00:00+00']);

    $report = $this->actingAs($this->owner)->getJson('/api/v1/reports?from=2026-11-01&to=2026-11-01')->assertOk();
    $report->assertJsonPath('total', 130000)->assertJsonPath('totals_by_kind.settlement', 130000)->assertJsonPath('totals_by_method', ['cash' => 0, 'qris' => 130000]);
    $this->getJson('/api/v1/reports?from=2026-11-02&to=2026-11-01')->assertUnprocessable();
    $this->actingAs($this->staff)->getJson('/api/v1/reports')->assertForbidden();
});

it('hides customer identity from the public schedule', function () {
    guestBooking($this);
    $result = $this->getJson('/api/v1/courts?date=2026-11-12')->assertOk()->json();
    expect(json_encode($result))->not->toContain('Raka', '0812', 'LS-');
});
