<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(function (): void {
        if (config('database.default') !== 'pgsql'
            || config('database.connections.pgsql.database') !== 'lola_demo_test') {
            throw new RuntimeException('Tests must use the isolated lola_demo_test PostgreSQL database.');
        }
    })
    ->in('Feature');
