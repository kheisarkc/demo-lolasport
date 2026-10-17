<?php

namespace App\Services;

use App\Models\AuditEvent;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BookingService
{
    public function audit(?Booking $booking, ?User $actor, string $action, array $metadata = []): void
    {
        $actorName = $actor === null ? 'Sistem' : $actor->name;
        AuditEvent::create(['booking_id' => $booking?->id, 'actor_id' => $actor?->id, 'action' => $action,
            'metadata' => [...$metadata, 'actor' => $actorName], 'created_at' => now()]);
    }

    public function locked(int $courtId, Closure $operation): mixed
    {
        try {
            $result = DB::transaction(function () use ($courtId, $operation) {
                $court = Court::lockForUpdate()->findOrFail($courtId);
                foreach (Booking::where('court_id', $courtId)->where('status', 'pending')->where('expires_at', '<=', now())->lockForUpdate()->get() as $booking) {
                    $booking->update(['status' => 'expired']);
                    $this->audit($booking, null, 'expired');
                }
                // Expected validation failures must not roll back expired holds.
                // Each operation validates fully before it writes its own changes.
                try {
                    return $operation($court);
                } catch (HttpException|ValidationException $exception) {
                    return $exception;
                }
            }, 3);
        } catch (QueryException $exception) {
            if ($exception->getCode() === '23P01') {
                abort(409, 'Jadwal baru saja terisi. Pilih jam lain.');
            }
            throw $exception;
        }
        if ($result instanceof HttpException || $result instanceof ValidationException) {
            throw $result;
        }

        return $result;
    }

    public function expire(): void
    {
        foreach (Booking::where('status', 'pending')->where('expires_at', '<=', now())->distinct()->pluck('court_id') as $courtId) {
            $this->locked($courtId, fn () => null);
        }
    }

    public function create(User $actor, array $data, bool $block = false): Booking
    {
        return $this->locked((int) $data['court_id'], function (Court $court) use ($actor, $data, $block) {
            abort_unless($court->active, 409, 'Lapangan sedang nonaktif.');
            $start = CarbonImmutable::parse($data['date'].' '.sprintf('%02d:00', $data['hour']), 'Asia/Jakarta');
            $end = $start->addHours((int) $data['duration']);
            if ($start->isPast() || $start->gt(now('Asia/Jakarta')->addDays(90)) || $start->hour < $court->open_hour || $end->hour > $court->close_hour || ! $start->isSameDay($end)) {
                throw ValidationException::withMessages(['hour' => 'Pilih jam mendatang dalam jam buka, maksimal 90 hari, tanpa melewati tanggal.']);
            }
            $start = $start->utc();
            $end = $end->utc();
            abort_if(Booking::where('court_id', $court->id)->whereIn('status', Booking::HOLDING)->where('starts_at', '<', $end)->where('ends_at', '>', $start)->exists(), 409, 'Jadwal sudah terisi atau diblokir.');
            $total = $block ? 0 : $court->hourly_rate * (int) $data['duration'];
            $booking = Booking::create([
                'court_id' => $court->id, 'customer_id' => $actor->role === 'customer' ? $actor->id : null,
                'customer_name' => $block ? 'Blok pemeliharaan' : ($actor->role === 'customer' ? $actor->name : $data['customer_name']),
                'source' => $block ? 'block' : ($actor->role === 'customer' ? 'website' : 'walkin'),
                'starts_at' => $start, 'ends_at' => $end, 'hourly_rate' => $court->hourly_rate, 'total' => $total,
                'minimum_dp' => intdiv($total * config('demo.dp_percent') + 99, 100),
                'status' => $block ? 'confirmed' : 'pending',
                'expires_at' => $block ? null : now()->addMinutes(config('demo.hold_minutes'))->min($start),
                'reason' => $block ? $data['reason'] : null,
            ]);
            $this->audit($booking, $actor, $block ? 'blocked' : 'created');

            return $booking->load('court', 'payments', 'events');
        });
    }

    public function cancel(Booking $booking, User $actor): Booking
    {
        return $this->locked($booking->court_id, function () use ($booking, $actor) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            abort_unless(in_array($current->status, Booking::HOLDING, true) && $current->starts_at->isFuture(), 409, 'Reservasi hanya dapat dibatalkan sebelum mulai dan saat masih aktif.');
            $current->payments()->where('status', 'pending')->update(['status' => 'rejected', 'rejection_reason' => 'Reservasi dibatalkan sebelum verifikasi.', 'reviewed_by' => $actor->id, 'reviewed_at' => now()]);
            $current->update(['status' => 'cancelled']);
            $this->audit($current, $actor, 'cancelled', ['refund' => false]);

            return $current->load('court', 'payments', 'events');
        });
    }

    public function submit(Booking $booking, User $actor, array $data, ?UploadedFile $proof): Payment
    {
        return $this->locked($booking->court_id, function () use ($booking, $actor, $data, $proof) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            abort_unless(in_array($current->status, Booking::HOLDING, true) && $current->source !== 'block', 409, 'Reservasi tidak menerima pembayaran.');
            abort_if($current->payments()->where('status', 'pending')->exists(), 409, 'Masih ada bukti yang menunggu verifikasi.');
            $paid = (int) $current->payments()->where('status', 'approved')->sum('amount');
            $amount = (int) $data['amount'];
            $remaining = $current->total - $paid;
            if ($amount > $remaining || ($paid === 0 && $amount < $current->minimum_dp) || ($paid > 0 && $amount !== $remaining)) {
                throw ValidationException::withMessages(['amount' => 'Nominal harus memenuhi DP minimal atau tepat sisa pelunasan, dan tidak melebihi tagihan.']);
            }
            $cash = $data['method'] === 'cash';
            abort_if($cash && $actor->role !== 'staff', 403, 'Tunai hanya dicatat pegawai.');
            $path = $proof?->store('proofs', 'local');
            abort_if($proof && ! $path, 500, 'Bukti gagal disimpan. Silakan coba kembali.');
            $payment = $current->payments()->create(['amount' => $amount, 'method' => $data['method'], 'status' => $cash ? 'approved' : 'pending', 'proof_path' => $path,
                'submitted_by' => $actor->id, 'reviewed_by' => $cash ? $actor->id : null, 'reviewed_at' => $cash ? now() : null]);
            $current->update(['status' => $cash || $paid > 0 ? 'confirmed' : 'review']);
            $this->audit($current, $actor, $cash ? 'cash_approved' : 'proof_submitted', ['payment_id' => $payment->id, 'amount' => $amount]);

            return $payment;
        });
    }

    public function review(Payment $payment, User $actor, string $decision, ?string $reason): Payment
    {
        $booking = $payment->booking;

        return $this->locked($booking->court_id, function () use ($booking, $payment, $actor, $decision, $reason) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            $pending = Payment::lockForUpdate()->findOrFail($payment->id);
            abort_unless($pending->status === 'pending' && in_array($current->status, Booking::HOLDING, true), 409, 'Pengajuan sudah diputuskan atau reservasi tidak aktif.');
            $paid = (int) $current->payments()->where('status', 'approved')->sum('amount');
            abort_if($decision === 'approved' && $paid + $pending->amount > $current->total, 409, 'Pembayaran melebihi tagihan.');
            $pending->update(['status' => $decision, 'reviewed_by' => $actor->id, 'reviewed_at' => now(), 'rejection_reason' => $decision === 'rejected' ? $reason : null]);
            $current->update(['status' => $decision === 'approved' || $paid > 0 ? 'confirmed' : 'cancelled']);
            $this->audit($current, $actor, 'payment_'.$decision, ['payment_id' => $pending->id, 'reason' => $reason, 'amount' => $pending->amount]);

            return $pending;
        });
    }
}
