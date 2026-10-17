<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        // Fail before RefreshDatabase can run any migration against the wrong database.
        if (! $app->environment('testing')
            || config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'lola_demo_test'
            || config('database.connections.pgsql.host') !== '127.0.0.1'
            || (string) config('database.connections.pgsql.port') !== '55433'
            || DB::selectOne('select current_database() as name')->name !== 'lola_demo_test') {
            throw new RuntimeException('Tests require the isolated lola_demo_test PostgreSQL database.');
        }

        return $app;
    }
}
