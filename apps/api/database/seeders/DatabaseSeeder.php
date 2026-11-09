<?php

namespace Database\Seeders;

use App\Models\Court;
use App\Models\Setting;
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
        // Pelanggan tidak punya akun. Akun hanya untuk penjaga dan pemilik.
        foreach (['staff' => ['pegawai', 'Dina Demo'], 'owner' => ['pemilik', 'Bima Demo']] as $role => [$email, $name]) {
            $user = User::firstOrNew(['email' => $email.'@lola.test']);
            if (! $user->exists) {
                $user->name = $name;
                $user->password = 'DemoLola2026!';
                $user->role = $role;
                $user->save();
            }
        }
        // Harga dari wawancara pemilik.
        $courts = [['Futsal Sintetis', 'futsal', 130000], ['Futsal Vinil', 'futsal', 160000], ['Badminton 1', 'badminton', 35000], ['Badminton 2', 'badminton', 35000]];
        foreach ($courts as [$name, $sport, $rate]) {
            Court::firstOrCreate(['name' => $name], ['sport' => $sport, 'hourly_rate' => $rate, 'active' => true]);
        }
        Setting::current();
    }
}
