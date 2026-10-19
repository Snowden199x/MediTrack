<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['resident_id', 'recorded_by', 'visited_at', 'outcome', 'systolic', 'diastolic', 'temperature_c', 'notes', 'next_visit_at'])]
class Visit extends Model
{
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    protected function casts(): array
    {
        return ['visited_at' => 'datetime', 'next_visit_at' => 'datetime', 'temperature_c' => 'decimal:1'];
    }
}
