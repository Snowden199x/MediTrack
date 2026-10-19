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
        Schema::create('area_alert_rules', function (Blueprint $table) {
            $table->id();
            $table->string('category', 40)->unique();
            $table->unsignedSmallInteger('window_days');
            $table->unsignedSmallInteger('minimum_reports');
            $table->boolean('enabled')->default(false);
            $table->foreignId('updated_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('area_alert_rules');
    }
};
