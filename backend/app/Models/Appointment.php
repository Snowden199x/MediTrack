<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['resident_id', 'type', 'scheduled_for', 'status', 'notes', 'created_by'])]
class Appointment extends Model
{
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    protected function casts(): array
    {
        return ['scheduled_for' => 'datetime'];
    }
}
