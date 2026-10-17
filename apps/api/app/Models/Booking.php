<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property CarbonImmutable $starts_at
 * @property CarbonImmutable $ends_at
 * @property CarbonImmutable|null $expires_at
 */
class Booking extends Model
{
    public const HOLDING = ['pending', 'review', 'confirmed'];

    protected $guarded = ['id'];

    protected $appends = ['paid_amount', 'payment_status'];

    protected function casts(): array
    {
        return ['starts_at' => 'immutable_datetime', 'ends_at' => 'immutable_datetime', 'expires_at' => 'immutable_datetime'];
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
