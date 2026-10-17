<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Services\BookingService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->loadEnvironmentFrom('.env.testing');
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.connections.pgsql.database') !== 'lola_demo_test'
    || config('database.connections.pgsql.host') !== '127.0.0.1' || (string) config('database.connections.pgsql.port') !== '55433'
    || DB::selectOne('select current_database() as name')->name !== 'lola_demo_test') {
    throw new RuntimeException('Concurrency worker requires isolated lola_demo_test.');
}
$input = json_decode($argv[1], true, flags: JSON_THROW_ON_ERROR);
while (microtime(true) < $input['start']) {
    usleep(1000);
}
$began = microtime(true);
try {
    $service = app(BookingService::class);
    $user = User::findOrFail($input['user']);
    $result = match ($input['action']) {
        'create' => $service->create($user, $input['data']),
        'review' => $service->review(Payment::findOrFail($input['payment']), $user, 'approved', null),
        'cash' => $service->submit(Booking::findOrFail($input['booking']), $user, ['method' => 'cash', 'amount' => $input['amount']], null),
        'cancel' => $service->cancel(Booking::findOrFail($input['booking']), $user),
    };
    echo json_encode(['ok' => true, 'id' => $result->id, 'began' => $began, 'ended' => microtime(true)]);
} catch (Throwable $exception) {
    echo json_encode(['ok' => false, 'class' => get_class($exception), 'message' => $exception->getMessage(), 'began' => $began, 'ended' => microtime(true)]);
}
