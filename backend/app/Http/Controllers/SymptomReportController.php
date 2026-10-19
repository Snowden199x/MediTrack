<?php

namespace App\Http\Controllers;

use App\Models\SymptomReport;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\AreaAlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SymptomReportController extends Controller
{
    public function questions(): JsonResponse
    {
        return response()->json([
            'version' => config('meditrack.questionnaire_version'),
            'categories' => config('meditrack.symptom_categories'),
            'next_step' => config('meditrack.next_step'),
        ]);
    }

    public function store(Request $request, AreaAlertService $areaAlertService, ActivityRecorder $activityRecorder): JsonResponse
    {
        $resident = $request->user()->resident;
        abort_unless($resident, 409, 'Complete your resident profile first.');

        $categories = config('meditrack.symptom_categories');
        $data = $request->validate([
            'category' => ['required', Rule::in(array_keys($categories))],
            'onset_date' => ['nullable', 'date', 'before_or_equal:today'],
            'severity' => ['nullable', Rule::in(['mild', 'moderate', 'severe', 'unsure'])],
            'answers' => ['required', 'array', 'min:1'],
            'details' => ['nullable', 'string', 'max:3000'],
        ]);

        $questions = collect($categories[$data['category']]['questions'])->keyBy('key');
        $firstQuestionKey = $categories[$data['category']]['questions'][0]['key'];

        if (! isset($data['answers'][$firstQuestionKey]) || ! is_string($data['answers'][$firstQuestionKey]) || trim($data['answers'][$firstQuestionKey]) === '') {
            throw ValidationException::withMessages(['answers' => ['Answer the first follow-up question.']]);
        }

        foreach ($data['answers'] as $key => $answer) {
            $question = $questions->get($key);

            if (! $question || ! is_string($answer) || trim($answer) === '' || mb_strlen($answer) > 500 ||
                ($question['type'] === 'choice' && ! in_array($answer, $question['options'], true))) {
                throw ValidationException::withMessages(['answers' => ['One or more answers are invalid.']]);
            }
        }

        $report = $resident->symptomReports()->create([
            'category' => $data['category'],
            'onset_date' => $data['onset_date'] ?? null,
            'severity' => $data['severity'] ?? null,
            'answers' => $data['answers'],
            'details' => $data['details'] ?? null,
            'questionnaire_version' => config('meditrack.questionnaire_version'),
            'status' => 'pending',
        ]);

        $activityRecorder->record($request->user(), 'symptom_report.created', $report);
        $areaAlertService->consider($report->load('resident.household'));

        return response()->json(['report' => $report, 'next_step' => config('meditrack.next_step')], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $reports = SymptomReport::query()
            ->whereHas('resident.household', function ($query) use ($request): void {
                if ($request->user()->role === User::ROLE_BHW) {
                    $query->where('barangay_code', $request->user()->barangay_code);
                }
            })
            ->with('resident:id,household_id,name')
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest('id')->paginate(20);

        return response()->json($reports);
    }

    public function review(Request $request, SymptomReport $symptomReport, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless($request->user()->canAccessArea($symptomReport->resident->household->barangay_code), 403);
        abort_unless($symptomReport->status === 'pending', 409, 'This report has already been reviewed.');
        $data = $request->validate(['review_note' => ['required', 'string', 'max:3000']]);
        $symptomReport->update([
            'status' => 'reviewed',
            'review_note' => $data['review_note'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
        $activityRecorder->record($request->user(), 'symptom_report.reviewed', $symptomReport);

        return response()->json($symptomReport);
    }
}
