<?php

use Illuminate\Support\Facades\DB;

it('reports a live PostgreSQL connection', function (): void {
    $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertExactJson(['status' => 'ok', 'database' => 'connected']);

    expect(DB::connection()->getDriverName())->toBe('pgsql');
    expect(DB::selectOne('select current_database() as name')->name)->toBe('lola_demo_test');
});

it('reports database failures without exposing exception details', function (): void {
    DB::shouldReceive('select')->once()->with('select 1')
        ->andThrow(new RuntimeException('private-database-detail'));

    $this->getJson('/api/v1/health')
        ->assertStatus(503)
        ->assertExactJson(['status' => 'unavailable', 'database' => 'unavailable'])
        ->assertDontSee('private-database-detail');
});
