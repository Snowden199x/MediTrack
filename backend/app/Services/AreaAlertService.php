<?php

namespace App\Services;

use App\Models\AreaAlert;
use App\Models\AreaAlertRule;
use App\Models\SymptomReport;
use Illuminate\Support\Facades\DB;

class AreaAlertService
{
    public function consider(SymptomReport $report): void
    {
        if (! config('meditrack.area_alerts_enabled')) {
            return;
        }

        DB::transaction(function () use ($report): void {
            $rule = AreaAlertRule::where('category', $report->category)->lockForUpdate()->first();

            if (! $rule || ! $rule->enabled) {
                return;
            }

            $household = $report->resident->household;
            $barangayCode = $household->barangay_code;
            if (! $barangayCode) {
                return;
            }

            $windowStartedAt = now()->subDays($rule->window_days);
            $reportCount = SymptomReport::query()
                ->where('category', $report->category)
                ->where('created_at', '>=', $windowStartedAt)
                ->whereHas('resident.household', fn ($query) => $query->where('barangay_code', $barangayCode))
                ->distinct('resident_id')->count('resident_id');

            if ($reportCount < $rule->minimum_reports) {
                return;
            }

            $existing = AreaAlert::query()
                ->where('rule_id', $rule->id)
                ->where('barangay_code', $barangayCode)
                ->where('window_ends_at', '>=', now())
                ->latest('id')
                ->first();

            if ($existing) {
                $existing->update(['report_count' => $reportCount]);

                return;
            }

            AreaAlert::create([
                'rule_id' => $rule->id,
                'barangay_code' => $barangayCode,
                'barangay_name' => $household->barangay_name,
                'category' => $report->category,
                'report_count' => $reportCount,
                'window_started_at' => $windowStartedAt,
                'window_ends_at' => now()->addDays($rule->window_days),
                'status' => 'new',
            ]);
        });
    }
}
