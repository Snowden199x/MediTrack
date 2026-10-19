<?php

namespace App\Http\Controllers;

use App\Models\AreaAlert;
use App\Models\AreaAlertRule;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AreaAlertController extends Controller
{
    public function rules(): JsonResponse
    {
        return response()->json([
            'processing_enabled' => (bool) config('meditrack.area_alerts_enabled'),
            'rules' => AreaAlertRule::orderBy('category')->get(),
        ]);
    }

    public function saveRule(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        $data = $request->validate([
            'category' => ['required', Rule::in(array_keys(config('meditrack.symptom_categories')))],
            'window_days' => ['required', 'integer', 'between:1,30'],
            'minimum_reports' => ['required', 'integer', 'between:5,500'],
            'enabled' => ['required', 'boolean'],
        ]);

        $rule = AreaAlertRule::updateOrCreate(
            ['category' => $data['category']],
            [
                'window_days' => $data['window_days'],
                'minimum_reports' => $data['minimum_reports'],
                'enabled' => $data['enabled'],
                'updated_by' => $request->user()->id,
            ]
        );
        $activityRecorder->record($request->user(), 'area_alert_rule.saved', $rule);

        return response()->json($rule);
    }

    public function trends(): JsonResponse
    {
        $minimum = (int) config('meditrack.minimum_display_count');
        $trends = DB::table('symptom_reports')
            ->join('residents', 'residents.id', '=', 'symptom_reports.resident_id')
            ->join('households', 'households.id', '=', 'residents.household_id')
            ->where('symptom_reports.created_at', '>=', now()->subDays(7))
            ->select('households.barangay_code', 'households.barangay_name', 'symptom_reports.category')
            ->selectRaw('COUNT(DISTINCT symptom_reports.resident_id) AS resident_count')
            ->whereNotNull('households.barangay_code')
            ->groupBy('households.barangay_code', 'households.barangay_name', 'symptom_reports.category')
            ->havingRaw('COUNT(DISTINCT symptom_reports.resident_id) >= ?', [$minimum])
            ->orderByDesc('resident_count')
            ->limit(100)
            ->get();

        return response()->json(['window_days' => 7, 'minimum_display_count' => $minimum, 'trends' => $trends]);
    }

    public function index(): JsonResponse
    {
        return response()->json(AreaAlert::query()->latest('id')->paginate(20));
    }

    public function review(Request $request, AreaAlert $areaAlert, ActivityRecorder $activityRecorder): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['monitoring', 'dismissed', 'escalated'])],
            'review_note' => ['required', 'string', 'max:3000'],
        ]);

        $areaAlert->update($data + [
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        $activityRecorder->record($request->user(), 'area_alert.reviewed', $areaAlert);

        return response()->json($areaAlert);
    }
}
