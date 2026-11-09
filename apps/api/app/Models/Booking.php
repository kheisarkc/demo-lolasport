<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $code
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable $ends_at
 * @property CarbonImmutable|null $expires_at
 */
class Booking extends Model
{
    /** Status yang memakai jam lapangan. */
    public const HOLDING = ['pending', 'review', 'confirmed', 'checked_in'];

    /** Status yang masih bisa dibayar atau dibatalkan. */
    public const ACTIVE = ['pending', 'review', 'confirmed'];

    protected $guarded = ['id'];

    protected $appends = ['paid_amount', 'payment_status'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'expires_at' => 'immutable_datetime',
            'checked_in_at' => 'immutable_datetime',
            'play_date' => 'date:Y-m-d',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'code';
    }

    /** Token akses pelanggan tanpa akun. Diberikan saat memesan atau saat cek pesanan dengan kode + WhatsApp. */
    public function accessToken(): string
    {
        return substr(hash_hmac('sha256', 'booking:'.$this->code, (string) config('app.key')), 0, 32);
    }

    /** @return BelongsTo<Court, $this> */
    public function court(): BelongsTo
    {
        return $this->belongsTo(Court::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('id');
    }

    /** @return HasMany<AuditEvent, $this> */
    public function events(): HasMany
    {
        return $this->hasMany(AuditEvent::class)->orderBy('id');
    }

    public function getPaidAmountAttribute(): int
    {
        return (int) $this->payments->where('status', 'approved')->sum('amount');
    }

    public function getPaymentStatusAttribute(): string
    {
        return $this->paid_amount === 0 ? 'unpaid' : ($this->paid_amount >= $this->total ? 'paid' : 'partial');
    }
}
