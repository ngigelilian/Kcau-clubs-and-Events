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
        Schema::table('clubs', function (Blueprint $table) {
            $table->string('membership_type')->default('free')->after('max_members');
            $table->integer('membership_fee')->nullable()->after('membership_type');
            $table->unsignedTinyInteger('membership_discount_percent')->nullable()->after('membership_fee');
            $table->string('hybrid_free_faculty')->nullable()->after('membership_discount_percent');

            $table->index('membership_type');
        });

        Schema::table('club_memberships', function (Blueprint $table) {
            $table->integer('membership_fee_due')->default(0)->after('status');
            $table->boolean('membership_fee_waived')->default(false)->after('membership_fee_due');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('club_memberships', function (Blueprint $table) {
            $table->dropColumn(['membership_fee_due', 'membership_fee_waived']);
        });

        Schema::table('clubs', function (Blueprint $table) {
            $table->dropIndex(['membership_type']);
            $table->dropColumn([
                'membership_type',
                'membership_fee',
                'membership_discount_percent',
                'hybrid_free_faculty',
            ]);
        });
    }
};
