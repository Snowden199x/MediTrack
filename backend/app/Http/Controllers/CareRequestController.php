<?php

namespace App\Http\Controllers;

use App\Models\CareRequest;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CareRequestController extends Controller
{
    public function store(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        $resident = $request->user()->resident;
        abort_unless($resident, 409, 'Complete your resident profile first.');
        $data = $request->validate([
            'type' => ['required', Rule::in(['symptom_update', 'assistance', 'appointment'])],
            'details' => ['required', 'string', 'max:3000'],
        ]);

        $careRequest = $resident->careRequests()->create($data + ['status' => 'pending']);
        $activityRecorder->record($request->user(), 'care_request.created', $careRequest);

        return response()->json($careRequest, 201);
    }

    public function index(Request $request): JsonResponse
    {
        $requests = CareRequest::query()
            ->whereHas('resident.household', function ($query) use ($request): void {
                if ($request->user()->role === User::ROLE_BHW) {
                    $query->where('barangay_code', $request->user()->barangay_code);
                }
            })
            ->with('resident:id,household_id,name')
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest('id')->paginate(20);

        return response()->json($requests);
    }

    public function respond(Request $request, CareRequest $careRequest, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless($request->user()->canAccessArea($careRequest->resident->household->barangay_code), 403);
        abort_unless($careRequest->status === 'pending', 409, 'This request has already been answered.');
        $data = $request->validate(['response' => ['required', 'string', 'max:3000']]);
        $careRequest->update([
            'response' => $data['response'],
            'status' => 'answered',
            'responded_by' => $request->user()->id,
            'responded_at' => now(),
        ]);
        $activityRecorder->record($request->user(), 'care_request.answered', $careRequest);

        return response()->json($careRequest);
    }
}
