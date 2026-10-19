<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['category', 'window_days', 'minimum_reports', 'enabled', 'updated_by'])]
class AreaAlertRule extends Model
{
    protected function casts(): array
    {
        return ['enabled' => 'boolean'];
    }
}
