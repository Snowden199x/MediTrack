<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['rule_id', 'barangay_code', 'barangay_name', 'category', 'report_count', 'window_started_at', 'window_ends_at', 'status', 'review_note', 'reviewed_by', 'reviewed_at'])]
class AreaAlert extends Model
{
    protected function casts(): array
    {
        return ['window_started_at' => 'datetime', 'window_ends_at' => 'datetime', 'reviewed_at' => 'datetime'];
    }
}
