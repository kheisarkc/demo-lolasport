<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Court extends Model
{
    protected $fillable = ['name', 'sport', 'hourly_rate', 'open_hour', 'close_hour', 'active'];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'hourly_rate' => 'integer', 'open_hour' => 'integer', 'close_hour' => 'integer'];
    }
}
