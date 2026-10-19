<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('households', function (Blueprint $table) {
            $table->string('purok', 100)->nullable()->change();
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->string('barangay_code', 10)->nullable()->index();
            $table->string('barangay_name', 150)->nullable();
        });

        Schema::table('area_alerts', function (Blueprint $table) {
            $table->string('purok', 100)->nullable()->change();
            $table->string('barangay_code', 10)->nullable()->index();
            $table->string('barangay_name', 150)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('area_alerts', function (Blueprint $table) {
            DB::table('area_alerts')->whereNull('purok')->update(['purok' => 'Barangay']);
            $table->dropColumn(['barangay_code', 'barangay_name']);
            $table->string('purok', 100)->nullable(false)->change();
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['barangay_code', 'barangay_name']);
        });

        Schema::table('households', function (Blueprint $table) {
            $table->string('purok', 100)->nullable(false)->change();
        });
    }
};
