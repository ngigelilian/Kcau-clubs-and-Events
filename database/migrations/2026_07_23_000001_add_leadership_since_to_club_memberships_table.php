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
        Schema::table('club_memberships', function (Blueprint $table) {
            // When this member most recently took on a leadership position
            // (Chairperson/Secretary/Treasurer/Co-Chair). Used to determine
            // the "most senior remaining leader" when a Chairperson is
            // removed by an admin and the club needs an automatic successor.
            $table->timestamp('leadership_since')->nullable()->after('joined_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('club_memberships', function (Blueprint $table) {
            $table->dropColumn('leadership_since');
        });
    }
};
