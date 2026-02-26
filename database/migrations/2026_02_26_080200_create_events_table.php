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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->foreignId('club_id')->nullable()->constrained('clubs')->nullOnDelete();
            $table->string('type');
            $table->string('venue');
            $table->timestamp('start_datetime');
            $table->timestamp('end_datetime');
            $table->integer('capacity')->nullable();
            $table->timestamp('registration_deadline')->nullable();
            $table->boolean('is_paid')->default(false);
            $table->integer('fee_amount')->default(0)->comment('Amount in cents (KES)');
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('type');
            $table->index('start_datetime');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
