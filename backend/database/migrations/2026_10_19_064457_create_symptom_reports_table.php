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
        Schema::create('symptom_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resident_id')->constrained()->restrictOnDelete();
            $table->string('category', 40);
            $table->date('onset_date')->nullable();
            $table->string('severity', 20)->nullable();
            $table->json('answers');
            $table->text('details')->nullable();
            $table->string('questionnaire_version', 20);
            $table->string('status', 30)->default('pending');
            $table->text('review_note')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['category', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('symptom_reports');
    }
};
