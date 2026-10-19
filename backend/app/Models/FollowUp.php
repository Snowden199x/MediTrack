<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['resident_id', 'reason', 'status', 'action_note', 'created_by', 'closed_by', 'closed_at'])]
class FollowUp extends Model
{
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    protected function casts(): array
    {
        return ['closed_at' => 'datetime'];
    }
}
