<?php

namespace Database\Seeders;

use App\Models\Court;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! in_array(config('database.connections.pgsql.database'), ['lola_demo', 'lola_demo_test'], true)) {
            throw new RuntimeException('Seed hanya untuk database demo.');
        }
        foreach (['customer' => ['pelanggan', 'Raka Demo'], 'staff' => ['pegawai', 'Dina Demo'], 'owner' => ['pemilik', 'Bima Demo']] as $role => [$email, $name]) {
            $user = User::firstOrNew(['email' => $email.'@lola.test']);
            if (! $user->exists) {
                $user->name = $name;
                $user->password = 'DemoLola2026!';
                $user->role = $role;
                $user->save();
            }
        }
        foreach ([['Futsal Arena', 'futsal', 150000], ['Badminton 1', 'badminton', 50000], ['Badminton 2', 'badminton', 50000]] as [$name, $sport, $rate]) {
            Court::firstOrCreate(['name' => $name], ['sport' => $sport, 'hourly_rate' => $rate, 'open_hour' => 8, 'close_hour' => 22, 'active' => true]);
        }
    }
}
