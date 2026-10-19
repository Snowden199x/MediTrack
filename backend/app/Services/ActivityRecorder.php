<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityRecorder
{
    public function record(?User $actor, string $action, Model $subject): void
    {
        ActivityLog::create([
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => class_basename($subject),
            'subject_id' => $subject->getKey(),
        ]);
    }
}
