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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->morphs('orderable'); // orderable_type + orderable_id (Event or Merchandise)
            $table->integer('quantity')->default(1);
            $table->integer('unit_price')->comment('Price in cents (KES)');
            $table->integer('total_amount')->comment('Total in cents (KES)');
            $table->string('status')->default('pending');
            $table->string('mpesa_reference')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
