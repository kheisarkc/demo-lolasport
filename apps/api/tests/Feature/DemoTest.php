<?php

use App\Models\AuditEvent;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed();
    $this->customer = User::where('role', 'customer')->firstOrFail();
    $this->staff = User::where('role', 'staff')->firstOrFail();
    $this->owner = User::where('role', 'owner')->firstOrFail();
    $this->court = Court::firstOrFail();
    $this->payload = ['court_id' => $this->court->id, 'date' => now('Asia/Jakarta')->addDays(2)->format('Y-m-d'), 'hour' => 10, 'duration' => 2];
    Storage::fake('local');
});

function reserveDemo($test): int
{
    return $test->actingAs($test->customer)->postJson('/api/v1/bookings', $test->payload)->assertCreated()->json('id');
}

it('enforces role and ownership boundaries including proof files', function () {
    $this->getJson('/api/v1/bookings')->assertUnauthorized();
    $id = reserveDemo($this);
    $payment = $this->postJson("/api/v1/bookings/$id/payments", ['amount' => 150000, 'method' => 'transfer', 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')])->assertCreated()->json('id');
    $other = User::factory()->create();
    $this->actingAs($other)->getJson("/api/v1/bookings/$id")->assertForbidden();
    $this->postJson("/api/v1/bookings/$id/cancel")->assertForbidden();
    $this->getJson("/api/v1/payments/$payment/proof")->assertForbidden();
    $this->getJson('/api/v1/reports')->assertForbidden();
    $this->postJson('/api/v1/staff/courts', [])->assertForbidden();
    $this->postJson("/api/v1/payments/$payment/review", ['decision' => 'approved'])->assertForbidden();
    $this->actingAs($this->owner)->getJson('/api/v1/bookings')->assertForbidden();
    $this->actingAs($this->staff)->getJson('/api/v1/reports')->assertForbidden();
    $this->getJson("/api/v1/payments/$payment/proof")->assertOk();
});

it('rejects overlap and invalid hours and preserves adjacent slots', function () {
    reserveDemo($this);
    $this->postJson('/api/v1/bookings', $this->payload)->assertConflict();
    $this->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 12])->assertCreated();
    foreach ([['hour' => 7], ['hour' => 21], ['duration' => 0], ['hour' => 10.5], ['date' => '2020-01-01']] as $invalid) {
        $this->postJson('/api/v1/bookings', [...$this->payload, ...$invalid])->assertUnprocessable();
    }
});

it('expires unsubmitted holds and keeps timely proof in review', function () {
    $id = reserveDemo($this);
    $this->travel(31)->minutes();
    $this->getJson('/api/v1/courts?date='.$this->payload['date'])->assertOk();
    expect(Booking::find($id)->status)->toBe('expired');
    $next = reserveDemo($this);
    $this->postJson("/api/v1/bookings/$next/payments", ['amount' => 150000, 'method' => 'qris', 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')])->assertCreated();
    $this->travel(31)->minutes();
    $this->getJson('/api/v1/courts?date='.$this->payload['date']);
    expect(Booking::find($next)->status)->toBe('review');
    $this->postJson('/api/v1/bookings', $this->payload)->assertConflict();
});

it('verifies DP and settlement once and reconciles receipts after cancellation', function () {
    $id = reserveDemo($this);
    $data = ['amount' => 150000, 'method' => 'transfer', 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')];
    $this->postJson("/api/v1/bookings/$id/payments", [...$data, 'amount' => 1])->assertUnprocessable();
    $pid = $this->postJson("/api/v1/bookings/$id/payments", $data)->assertCreated()->json('id');
    $this->postJson("/api/v1/bookings/$id/payments", $data)->assertConflict();
    expect(Booking::find($id)->paid_amount)->toBe(0);
    $this->actingAs($this->staff)->postJson("/api/v1/payments/$pid/review", ['decision' => 'approved'])->assertOk();
    $this->postJson("/api/v1/payments/$pid/review", ['decision' => 'approved'])->assertConflict();
    $this->postJson("/api/v1/bookings/$id/payments", ['amount' => 150001, 'method' => 'cash'])->assertUnprocessable();
    $this->postJson("/api/v1/bookings/$id/payments", ['amount' => 150000, 'method' => 'cash'])->assertCreated();
    expect(Booking::find($id)->payment_status)->toBe('paid');
    $this->actingAs($this->customer)->postJson("/api/v1/bookings/$id/cancel")->assertOk();
    $day = now('Asia/Jakarta')->format('Y-m-d');
    $report = $this->actingAs($this->owner)->getJson("/api/v1/reports?from=$day&to=$day")->assertOk()->json();
    expect($report['total'])->toBe(300000)->and($report['count'])->toBe(2);
    expect(array_sum(array_column($report['transactions'], 'amount')))->toBe($report['total']);
    expect(AuditEvent::where('booking_id', $id)->count())->toBeGreaterThanOrEqual(5);
});

it('requires rejection reason and releases initial rejection but keeps confirmed settlement rejection', function () {
    $id = reserveDemo($this);
    $pid = $this->postJson("/api/v1/bookings/$id/payments", ['amount' => 150000, 'method' => 'transfer', 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')])->json('id');
    $this->actingAs($this->staff)->postJson("/api/v1/payments/$pid/review", ['decision' => 'rejected'])->assertUnprocessable();
    $this->postJson("/api/v1/payments/$pid/review", ['decision' => 'rejected', 'reason' => 'Bukti simulasi tidak sesuai'])->assertOk();
    expect(Booking::find($id)->status)->toBe('cancelled');
    $next = reserveDemo($this);
    $this->actingAs($this->staff)->postJson("/api/v1/bookings/$next/payments", ['method' => 'cash', 'amount' => 150000])->assertCreated();
    $pid = $this->actingAs($this->customer)->postJson("/api/v1/bookings/$next/payments", ['amount' => 150000, 'method' => 'qris', 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')])->json('id');
    $this->actingAs($this->staff)->postJson("/api/v1/payments/$pid/review", ['decision' => 'rejected', 'reason' => 'Bukti pelunasan tidak sesuai'])->assertOk();
    expect(Booking::find($next)->status)->toBe('confirmed');
});

it('protects master changes and blocks without changing transaction prices', function () {
    $id = reserveDemo($this);
    $url = '/api/v1/staff/courts/'.$this->court->id;
    $this->actingAs($this->staff)->patchJson($url, ['active' => false])->assertConflict();
    $this->patchJson($url, ['open_hour' => 11])->assertConflict();
    $this->patchJson($url, ['hourly_rate' => 200000])->assertOk();
    expect(Booking::find($id)->total)->toBe(300000);
    $this->postJson('/api/v1/staff/blocks', [...$this->payload, 'reason' => 'Pemeliharaan'])->assertConflict();
    $block = $this->postJson('/api/v1/staff/blocks', [...$this->payload, 'hour' => 14, 'reason' => 'Pemeliharaan'])->assertCreated()->json('id');
    $this->actingAs($this->customer)->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 14])->assertConflict();
    $this->actingAs($this->staff)->postJson("/api/v1/bookings/$block/cancel")->assertOk();
    $this->actingAs($this->customer)->postJson('/api/v1/bookings', [...$this->payload, 'hour' => 14])->assertCreated();
});

it('validates proof and rejects cash from customers and payments after cancellation', function () {
    $id = reserveDemo($this);
    $url = "/api/v1/bookings/$id/payments";
    $this->postJson($url, ['method' => 'cash', 'amount' => 150000])->assertForbidden();
    $this->postJson($url, ['method' => 'transfer', 'amount' => 150000, 'proof' => UploadedFile::fake()->create('evil.html', 1, 'text/html')])->assertUnprocessable();
    $this->postJson($url, ['method' => 'transfer', 'amount' => 150000, 'proof' => UploadedFile::fake()->create('large.pdf', 2100, 'application/pdf')])->assertUnprocessable();
    $pid = $this->postJson($url, ['method' => 'qris', 'amount' => 150000, 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')])->json('id');
    $this->postJson("/api/v1/bookings/$id/cancel")->assertOk();
    $this->actingAs($this->staff)->postJson("/api/v1/payments/$pid/review", ['decision' => 'approved'])->assertConflict();
    $this->postJson($url, ['method' => 'cash', 'amount' => 150000])->assertConflict();
});

it('uses approval time Jakarta boundaries for daily and monthly reports', function () {
    $id = reserveDemo($this);
    $this->actingAs($this->staff)->postJson("/api/v1/bookings/$id/payments", ['method' => 'cash', 'amount' => 150000])->assertCreated();
    $this->postJson("/api/v1/bookings/$id/payments", ['method' => 'cash', 'amount' => 150000])->assertCreated();
    $payments = Payment::where('booking_id', $id)->orderBy('id')->get();
    $payments[0]->update(['reviewed_at' => '2026-10-31 16:59:59+00']);
    $payments[1]->update(['reviewed_at' => '2026-10-31 17:00:00+00']);
    $report = $this->actingAs($this->owner)->getJson('/api/v1/reports?from=2026-11-01&to=2026-11-01')->assertOk();
    $report->assertJsonPath('total', 150000)->assertJsonPath('monthly.0.period', '2026-11');
    $this->getJson('/api/v1/reports?from=2026-11-02&to=2026-11-01')->assertUnprocessable();
});

it('has a PostgreSQL exclusion constraint independent of application checks', function () {
    $id = reserveDemo($this);
    $original = Booking::find($id);
    expect(fn () => DB::transaction(fn () => $original->replicate()->save()))->toThrow(QueryException::class);
});

it('registers only customers and normalizes email before uniqueness validation', function () {
    $data = ['name' => 'Akun Fiktif', 'email' => 'BARU@example.test', 'password' => 'DemoLola2026!', 'password_confirmation' => 'DemoLola2026!', 'role' => 'owner'];
    $this->postJson('/api/v1/register', $data)->assertCreated()->assertJsonPath('role', 'customer')->assertJsonPath('email', 'baru@example.test');
    $this->postJson('/api/v1/register', $data)->assertUnprocessable();
});

it('rounds DP upward in integer rupiah and expires at the exact deadline', function () {
    $this->court->update(['hourly_rate' => 150001]);
    $this->payload['duration'] = 1;
    $id = reserveDemo($this);
    expect(Booking::find($id)->minimum_dp)->toBe(75001);
    $this->travelTo(Booking::find($id)->expires_at);
    $this->postJson("/api/v1/bookings/$id/payments", ['method' => 'transfer', 'amount' => 75001, 'proof' => UploadedFile::fake()->create('demo.pdf', 10, 'application/pdf')])->assertConflict();
    expect(Booking::find($id)->status)->toBe('expired');
    $this->postJson('/api/v1/bookings', $this->payload)->assertCreated();
});

it('refuses cancellation at or after the confirmed start time', function () {
    $id = reserveDemo($this);
    $this->actingAs($this->staff)->postJson("/api/v1/bookings/$id/payments", ['method' => 'cash', 'amount' => 150000])->assertCreated();
    $this->travelTo(Booking::find($id)->starts_at);
    $this->actingAs($this->customer)->postJson("/api/v1/bookings/$id/cancel")->assertConflict();
    expect(Booking::find($id)->status)->toBe('confirmed');
});
