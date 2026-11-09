<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu baris aturan pemesanan. DP 50% dari pemilik (8 Nov 2026), batas bayar 30 menit (keputusan tim 10 Nov 2026).
 *
 * @property int $dp_percent
 * @property int $hold_minutes
 */
class Setting extends Model
{
    protected $fillable = ['dp_percent', 'hold_minutes'];

    protected function casts(): array
    {
        return ['dp_percent' => 'integer', 'hold_minutes' => 'integer'];
    }

    public static function current(): self
    {
        return self::query()->orderBy('id')->firstOrCreate([], [
            'dp_percent' => config('demo.default_dp_percent'),
            'hold_minutes' => config('demo.default_hold_minutes'),
        ]);
    }
}
