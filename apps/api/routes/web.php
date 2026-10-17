<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'application' => 'Lola Sport API',
    'health' => '/api/v1/health',
]));
