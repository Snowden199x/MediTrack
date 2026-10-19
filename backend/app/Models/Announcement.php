<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'body', 'barangay_code', 'barangay_name', 'published_at', 'expires_at', 'created_by'])]
class Announcement extends Model
{
    protected function casts(): array
    {
        return ['published_at' => 'datetime', 'expires_at' => 'datetime'];
    }
}
