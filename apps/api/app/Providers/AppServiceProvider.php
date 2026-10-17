<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::define('staff', fn ($user) => $user->role === 'staff');
        Gate::define('owner', fn ($user) => $user->role === 'owner');
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(15)->by(strtolower((string) $request->input('email')).'|'.$request->ip()));
        $command = $_SERVER['argv'][1] ?? '';
        if ($this->app->runningInConsole() && (str_starts_with($command, 'migrate') || $command === 'db:seed')) {
            $expected = $this->app->environment('testing') ? 'lola_demo_test' : 'lola_demo';
            if (config('database.default') !== 'pgsql' || config('database.connections.pgsql.database') !== $expected
                || config('database.connections.pgsql.host') !== '127.0.0.1'
                || (string) config('database.connections.pgsql.port') !== '55433'
                || DB::selectOne('select current_database() as name')->name !== $expected) {
                throw new RuntimeException('Operasi database hanya diizinkan pada PostgreSQL demo 127.0.0.1:55433 yang terverifikasi.');
            }
        }
    }
}
