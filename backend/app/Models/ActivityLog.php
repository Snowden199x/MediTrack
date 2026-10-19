<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['actor_id', 'action', 'subject_type', 'subject_id'])]
class ActivityLog extends Model {}
