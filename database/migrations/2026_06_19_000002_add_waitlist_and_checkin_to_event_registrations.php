<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('event_registrations', function (Blueprint $table) {
            $table->uuid('check_in_token')->nullable()->unique()->after('cancelled_at');
            $table->boolean('is_waitlisted')->default(false)->after('check_in_token');
            $table->unsignedInteger('waitlist_position')->nullable()->after('is_waitlisted');
            $table->timestamp('checked_in_at')->nullable()->after('waitlist_position');
        });
    }

    public function down(): void {
        Schema::table('event_registrations', function (Blueprint $table) {
            $table->dropColumn(['check_in_token', 'is_waitlisted', 'waitlist_position', 'checked_in_at']);
        });
    }
};
