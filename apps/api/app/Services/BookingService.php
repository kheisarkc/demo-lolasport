<?php

namespace App\Services;

use App\Models\AuditEvent;
use App\Models\Booking;
use App\Models\Court;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Aturan pemesanan demo, disamakan dengan lola-sport-v1 (10 Nov 2026).
 * Pelanggan = tamu tanpa akun ($actor null). Penjaga = 'staff'.
 */
class BookingService
{
    public function audit(?Booking $booking, ?User $actor, string $action, array $metadata = []): void
    {
        $actorName = $actor === null ? ($booking && $booking->source === 'website' ? 'Pelanggan' : 'Sistem') : $actor->name;
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

    /** Tanggal operasional hari ini. Pukul 00.00–00.59 masih milik hari sebelumnya. */
    public static function today(): CarbonImmutable
    {
        return CarbonImmutable::now(config('demo.timezone'))->subHour()->startOfDay();
    }

    /** Jam mulai slot: 7..24 (24 = 00.00 hari berikutnya). */
    public static function slotStart(string $date, int $hour): CarbonImmutable
    {
        return CarbonImmutable::parse($date, config('demo.timezone'))->startOfDay()->addHours($hour);
    }

    /**
     * Pelanggan (tamu) atau penjaga (walk-in) membuat pesanan, atau penjaga menutup jam ($block).
     * Walk-in langsung dibayar minimal DP dan tidak punya batas waktu.
     */
    public function create(?User $actor, array $data, bool $block = false): Booking
    {
        $staff = $actor?->role === 'staff';

        return $this->locked((int) $data['court_id'], function (Court $court) use ($actor, $data, $block, $staff) {
            abort_unless($court->active, 409, 'Lapangan sedang nonaktif.');
            $hour = (int) $data['hour'];
            $duration = (int) $data['duration'];
            $start = self::slotStart($data['date'], $hour);
            $end = $start->addHours($duration);
            $playDate = CarbonImmutable::parse($data['date'], config('demo.timezone'))->startOfDay();
            if ($hour < config('demo.open_hour') || $hour + $duration > config('demo.close_hour') || $start->isPast()) {
                throw ValidationException::withMessages(['hour' => 'Pilih jam yang belum lewat, dalam jam buka 07.00–01.00.']);
            }
            if ($playDate->gt(self::today()->addDays(config('demo.max_days_ahead')))) {
                throw ValidationException::withMessages(['date' => 'Pemesanan paling jauh '.config('demo.max_days_ahead').' hari ke depan.']);
            }
            abort_if(Booking::where('court_id', $court->id)->whereIn('status', Booking::HOLDING)->where('starts_at', '<', $end->utc())->where('ends_at', '>', $start->utc())->exists(), 409, 'Jadwal sudah terisi atau ditutup.');

            $setting = Setting::current();
            $total = $block ? 0 : $court->hourly_rate * $duration;
            $minimumDp = intdiv($total * $setting->dp_percent + 99, 100);
            $walkin = ! $block && $staff;
            if ($walkin) {
                $amount = (int) $data['amount'];
                if ($amount < $minimumDp || $amount > $total) {
                    throw ValidationException::withMessages(['amount' => 'Walk-in dibayar minimal DP '.number_format($minimumDp, 0, ',', '.').' dan tidak melebihi total.']);
                }
            }
            $booking = Booking::create([
                'code' => $this->newCode(),
                'court_id' => $court->id,
                'customer_name' => $block ? 'Tutup lapangan' : $data['customer_name'],
                'customer_phone' => $block ? null : ($data['customer_phone'] ?? null),
                'source' => $block ? 'block' : ($walkin ? 'walkin' : 'website'),
                'play_date' => $playDate->format('Y-m-d'),
                'starts_at' => $start->utc(), 'ends_at' => $end->utc(), 'hourly_rate' => $court->hourly_rate, 'total' => $total,
                'minimum_dp' => $minimumDp,
                'status' => $block || $walkin ? 'confirmed' : 'pending',
                'expires_at' => $block || $walkin ? null : now()->addMinutes($setting->hold_minutes)->min($start),
                'reason' => $block ? $data['reason'] : null,
            ]);
            $this->audit($booking, $actor, $block ? 'blocked' : 'created');
            if ($walkin) {
                $payment = $booking->payments()->create(['amount' => (int) $data['amount'], 'method' => $data['method'], 'status' => 'approved',
                    'submitted_by' => $actor->id, 'reviewed_by' => $actor->id, 'reviewed_at' => now()]);
                $this->audit($booking, $actor, $data['method'] === 'cash' ? 'cash_approved' : 'counter_qris_approved', ['payment_id' => $payment->id, 'amount' => $payment->amount]);
            }

            return $booking->load('court', 'payments', 'events');
        });
    }

    /**
     * Pelanggan hanya bisa membatalkan sebelum membayar apa pun.
     * Penjaga bisa membatalkan sebelum jam main; uang yang sudah masuk tidak dikembalikan.
     */
    public function cancel(Booking $booking, ?User $actor): Booking
    {
        return $this->locked($booking->court_id, function () use ($booking, $actor) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            abort_unless(in_array($current->status, Booking::ACTIVE, true) && $current->starts_at->isFuture(), 409, 'Reservasi hanya dapat dibatalkan sebelum mulai dan saat masih aktif.');
            if ($actor?->role !== 'staff') {
                abort_unless($current->status === 'pending' && $current->payments()->doesntExist(), 409, 'Pesanan yang sudah dibayar dibatalkan lewat penjaga. Hubungi WhatsApp Lola Sport.');
            }
            $current->payments()->where('status', 'pending')->update(['status' => 'rejected', 'rejection_reason' => 'Reservasi dibatalkan sebelum verifikasi.', 'reviewed_by' => $actor?->id, 'reviewed_at' => now()]);
            $current->update(['status' => 'cancelled']);
            $this->audit($current, $actor, 'cancelled', ['refund' => false]);

            return $current->load('court', 'payments', 'events');
        });
    }

    /**
     * Pelanggan: QRIS dengan bukti, diperiksa penjaga.
     * Penjaga: tunai atau QRIS di tempat, langsung tercatat diterima.
     */
    public function submit(Booking $booking, ?User $actor, array $data, ?UploadedFile $proof): Payment
    {
        $staff = $actor?->role === 'staff';

        return $this->locked($booking->court_id, function () use ($booking, $actor, $data, $proof, $staff) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            abort_unless(in_array($current->status, Booking::ACTIVE, true) && $current->source !== 'block', 409, 'Reservasi tidak menerima pembayaran.');
            abort_if($current->payments()->where('status', 'pending')->exists(), 409, 'Masih ada bukti yang menunggu verifikasi.');
            $paid = (int) $current->payments()->where('status', 'approved')->sum('amount');
            $amount = (int) $data['amount'];
            $remaining = $current->total - $paid;
            if ($amount > $remaining || ($paid === 0 && $amount < $current->minimum_dp) || ($paid > 0 && $amount !== $remaining)) {
                throw ValidationException::withMessages(['amount' => 'Nominal harus memenuhi DP minimal atau tepat sisa pelunasan, dan tidak melebihi tagihan.']);
            }
            abort_if(! $staff && $data['method'] !== 'qris', 403, 'Tunai dicatat penjaga di tempat.');
            $path = $staff ? null : $proof?->store('proofs', 'local');
            abort_if(! $staff && ! $path, 500, 'Bukti gagal disimpan. Silakan coba kembali.');
            $payment = $current->payments()->create(['amount' => $amount, 'method' => $data['method'], 'status' => $staff ? 'approved' : 'pending', 'proof_path' => $path,
                'submitted_by' => $actor?->id, 'reviewed_by' => $staff ? $actor->id : null, 'reviewed_at' => $staff ? now() : null]);
            $current->update(['status' => $staff || $paid > 0 ? 'confirmed' : 'review', 'expires_at' => $staff ? null : $current->expires_at]);
            $action = ! $staff ? 'proof_submitted' : ($data['method'] === 'cash' ? 'cash_approved' : 'counter_qris_approved');
            $this->audit($current, $actor, $action, ['payment_id' => $payment->id, 'amount' => $amount]);

            return $payment;
        });
    }

    /** Bukti DP pertama ditolak = pesanan batal dan jam dibuka lagi. Bukti pelunasan ditolak = pesanan tetap terkonfirmasi. */
    public function review(Payment $payment, User $actor, string $decision, ?string $reason): Payment
    {
        $booking = $payment->booking;

        return $this->locked($booking->court_id, function () use ($booking, $payment, $actor, $decision, $reason) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            $pending = Payment::lockForUpdate()->findOrFail($payment->id);
            abort_unless($pending->status === 'pending' && in_array($current->status, Booking::ACTIVE, true), 409, 'Pengajuan sudah diputuskan atau reservasi tidak aktif.');
            $paid = (int) $current->payments()->where('status', 'approved')->sum('amount');
            abort_if($decision === 'approved' && $paid + $pending->amount > $current->total, 409, 'Pembayaran melebihi tagihan.');
            $pending->update(['status' => $decision, 'reviewed_by' => $actor->id, 'reviewed_at' => now(), 'rejection_reason' => $decision === 'rejected' ? $reason : null]);
            $current->update(['status' => $decision === 'approved' || $paid > 0 ? 'confirmed' : 'cancelled', 'expires_at' => null]);
            $this->audit($current, $actor, 'payment_'.$decision, ['payment_id' => $pending->id, 'reason' => $reason, 'amount' => $pending->amount]);

            return $pending;
        });
    }

    /** Hadir: harus lunas, paling cepat 60 menit sebelum mulai. Jam selesai tetap. */
    public function checkIn(Booking $booking, User $actor): Booking
    {
        return $this->locked($booking->court_id, function () use ($booking, $actor) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            abort_unless($current->status === 'confirmed' && $current->source !== 'block', 409, 'Hanya pesanan terkonfirmasi yang bisa ditandai hadir.');
            abort_unless($current->paid_amount >= $current->total, 409, 'Lunasi dulu sisa tagihan sebelum menandai hadir.');
            abort_if(now()->lt($current->starts_at->subMinutes(config('demo.checkin_early_minutes'))), 409, 'Hadir paling cepat '.config('demo.checkin_early_minutes').' menit sebelum jam main.');
            abort_unless(now()->lt($current->ends_at), 409, 'Jam main sudah selesai.');
            $current->update(['status' => 'checked_in', 'checked_in_at' => now()]);
            $this->audit($current, $actor, 'checked_in');

            return $current->load('court', 'payments', 'events');
        });
    }

    /** Tidak datang: setelah jam mulai. DP yang sudah masuk hangus. */
    public function noShow(Booking $booking, User $actor): Booking
    {
        return $this->locked($booking->court_id, function () use ($booking, $actor) {
            $current = Booking::lockForUpdate()->findOrFail($booking->id);
            abort_unless($current->status === 'confirmed' && $current->source !== 'block', 409, 'Hanya pesanan terkonfirmasi yang bisa ditandai tidak datang.');
            abort_unless(now()->gte($current->starts_at), 409, 'Tandai tidak datang setelah jam mulai.');
            $current->update(['status' => 'no_show']);
            $this->audit($current, $actor, 'no_show', ['forfeited' => $current->paid_amount]);

            return $current->load('court', 'payments', 'events');
        });
    }

    private function newCode(): string
    {
        do {
            $code = 'LS-'.Str::upper(Str::random(6));
        } while (! preg_match('/^LS-[A-Z0-9]{6}$/', $code) || Booking::where('code', $code)->exists());

        return $code;
    }
}
