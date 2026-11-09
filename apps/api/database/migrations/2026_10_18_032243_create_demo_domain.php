<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Skema demo setelah aturan v1 diterapkan (10 Nov 2026):
 * pelanggan tanpa akun (kode booking + WhatsApp), jam 07.00–01.00 dengan tanggal operasional,
 * status hadir/tidak datang, dan pengaturan DP/batas bayar milik pemilik.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff');
        });
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->integer('dp_percent');
            $table->integer('hold_minutes');
            $table->timestampsTz();
        });
        DB::statement('ALTER TABLE settings ADD CONSTRAINT valid_settings CHECK (dp_percent BETWEEN 1 AND 100 AND hold_minutes BETWEEN 5 AND 120)');
        Schema::create('courts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('sport');
            $table->integer('hourly_rate');
            // Jam 24 = 00.00 dan jam 25 = 01.00 hari berikutnya, tetap milik tanggal operasional yang sama.
            $table->integer('open_hour')->default(7);
            $table->integer('close_hour')->default(25);
            $table->boolean('active')->default(true);
            $table->timestampsTz();
        });
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 12)->unique();
            $table->foreignId('court_id')->constrained();
            $table->string('customer_name');
            $table->string('customer_phone', 20)->nullable();
            $table->string('source');
            $table->date('play_date');
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->integer('hourly_rate');
            $table->integer('total');
            $table->integer('minimum_dp');
            $table->string('status')->default('pending');
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('checked_in_at')->nullable();
            $table->string('reason')->nullable();
            $table->timestampsTz();
            $table->index(['play_date', 'status']);
        });
        DB::statement('ALTER TABLE bookings ADD CONSTRAINT valid_booking CHECK (ends_at > starts_at AND total >= 0 AND minimum_dp >= 0 AND minimum_dp <= total)');
        DB::statement("ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (court_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status IN ('pending', 'review', 'confirmed', 'checked_in'))");
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained();
            $table->integer('amount');
            $table->string('method');
            $table->string('status');
            $table->string('proof_path')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestampTz('reviewed_at')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->timestampsTz();
            $table->index(['status', 'reviewed_at']);
        });
        DB::statement('ALTER TABLE payments ADD CONSTRAINT positive_payment CHECK (amount > 0)');
        DB::statement("CREATE UNIQUE INDEX one_pending_payment ON payments (booking_id) WHERE status = 'pending'");
        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->nullable()->constrained();
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('action');
            $table->jsonb('metadata')->nullable();
            $table->timestampTz('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_events');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('courts');
        Schema::dropIfExists('settings');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('role'));
    }
};
