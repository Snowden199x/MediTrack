<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['resident_id', 'category', 'onset_date', 'severity', 'answers', 'details', 'questionnaire_version', 'status', 'review_note', 'reviewed_by', 'reviewed_at'])]
class SymptomReport extends Model
{
    public function resident(): BelongsTo
    {
        return $this->belongsTo(Resident::class);
    }

    protected function casts(): array
    {
        return ['onset_date' => 'date', 'answers' => 'array', 'reviewed_at' => 'datetime'];
    }
}
