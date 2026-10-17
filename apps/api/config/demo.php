<?php

return [
    'timezone' => 'Asia/Jakarta',
    'dp_percent' => max(1, min(100, (int) env('DEMO_DP_PERCENT', 50))),
    'hold_minutes' => max(1, (int) env('DEMO_HOLD_MINUTES', 30)),
];
