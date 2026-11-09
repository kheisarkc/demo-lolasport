<?php

/*
 * Aturan tetap demo, sama dengan lola-sport-v1. DP dan batas bayar disimpan di tabel
 * settings dan diubah pemilik. Nilai default_* hanya dipakai saat baris pertama dibuat.
 */
return [
    'timezone' => 'Asia/Jakarta',
    'open_hour' => 7,
    'close_hour' => 25,
    'max_days_ahead' => 30,
    'checkin_early_minutes' => 60,
    'default_dp_percent' => 50,
    'default_hold_minutes' => 30,
];
