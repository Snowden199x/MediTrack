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
        Schema::table('users', function (Blueprint $table) {
            $table->string('address', 255)->nullable();
            $table->string('region_code', 10)->nullable();
            $table->string('region_name', 120)->nullable();
            $table->string('province_code', 10)->nullable();
            $table->string('province_name', 150)->nullable();
            $table->string('city_municipality_code', 10)->nullable();
            $table->string('city_municipality_name', 150)->nullable();
            $table->string('barangay_code', 10)->nullable();
            $table->string('barangay_name', 150)->nullable();
        });

        Schema::table('households', function (Blueprint $table) {
            $table->string('region_code', 10)->nullable();
            $table->string('region_name', 120)->nullable();
            $table->string('province_code', 10)->nullable();
            $table->string('province_name', 150)->nullable();
            $table->string('city_municipality_code', 10)->nullable();
            $table->string('city_municipality_name', 150)->nullable();
            $table->string('barangay_code', 10)->nullable();
            $table->string('barangay_name', 150)->nullable();
        });

        Schema::table('residents', function (Blueprint $table) {
            $table->string('first_name', 100)->nullable();
            $table->string('middle_initial', 10)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->unsignedTinyInteger('age')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('residents', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'middle_initial', 'last_name', 'age']);
        });

        Schema::table('households', function (Blueprint $table) {
            $table->dropColumn([
                'region_code', 'region_name', 'province_code', 'province_name',
                'city_municipality_code', 'city_municipality_name', 'barangay_code', 'barangay_name',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'address', 'region_code', 'region_name', 'province_code', 'province_name',
                'city_municipality_code', 'city_municipality_name', 'barangay_code', 'barangay_name',
            ]);
        });
    }
};
