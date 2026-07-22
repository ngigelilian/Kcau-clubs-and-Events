<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (! Schema::hasColumn('events', 'campus')) {
                $table->string('campus')->nullable()->after('venue');
            }

            if (! Schema::hasColumn('events', 'qr_token')) {
                $table->string('qr_token')->nullable()->after('campus');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            if (Schema::hasColumn('events', 'qr_token')) {
                $table->dropColumn('qr_token');
            }
            if (Schema::hasColumn('events', 'campus')) {
                $table->dropColumn('campus');
            }
        });
    }
};
