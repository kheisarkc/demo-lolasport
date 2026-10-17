<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('customer');
        });
        Schema::create('courts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('sport');
            $table->integer('hourly_rate');
            $table->integer('open_hour')->default(8);
            $table->integer('close_hour')->default(22);
            $table->boolean('active')->default(true);
            $table->timestampsTz();
        });
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('court_id')->constrained();
            $table->foreignId('customer_id')->nullable()->constrained('users');
            $table->string('customer_name');
            $table->string('source');
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->integer('hourly_rate');
            $table->integer('total');
            $table->integer('minimum_dp');
            $table->string('status')->default('pending');
            $table->timestampTz('expires_at')->nullable();
            $table->string('reason')->nullable();
            $table->timestampsTz();
            $table->index(['customer_id', 'starts_at']);
        });
        DB::statement('ALTER TABLE bookings ADD CONSTRAINT valid_booking CHECK (ends_at > starts_at AND total >= 0 AND minimum_dp >= 0 AND minimum_dp <= total)');
        DB::statement("ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (court_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status IN ('pending', 'review', 'confirmed'))");
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained();
            $table->integer('amount');
            $table->string('method');
            $table->string('status');
            $table->string('proof_path')->nullable();
            $table->foreignId('submitted_by')->constrained('users');
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
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('role'));
    }
};
