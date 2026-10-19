<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminRegistrationController extends Controller
{
    public function index(): JsonResponse
    {
        $registrations = User::query()
            ->where('role', User::ROLE_RESIDENT)
            ->where('status', 'pending')
            ->select(['id', 'name', 'email', 'created_at'])
            ->with([
                'resident' => fn ($query) => $query->select([
                    'id', 'user_id', 'household_id', 'first_name', 'middle_initial', 'last_name', 'age', 'sex',
                ]),
                'resident.household:id,address,region_name,province_name,city_municipality_name,barangay_name',
            ])
            ->oldest('created_at')
            ->paginate(20);

        return response()->json($registrations);
    }

    public function update(Request $request, User $user, ActivityRecorder $activityRecorder): JsonResponse
    {
        $data = $request->validate([
            'decision' => ['required', Rule::in(['approve', 'reject'])],
            'rejection_reason' => ['required_if:decision,reject', 'nullable', 'string', 'max:1000'],
        ]);

        $reviewedUser = DB::transaction(function () use ($user, $data, $request, $activityRecorder): User {
            $registration = User::query()->lockForUpdate()->findOrFail($user->id);
            abort_unless($registration->role === User::ROLE_RESIDENT && $registration->status === 'pending', 409, 'This registration is no longer pending.');

            if ($data['decision'] === 'approve') {
                $registration->update([
                    'status' => 'active',
                    'approved_by' => $request->user()->id,
                    'approved_at' => now(),
                    'rejected_by' => null,
                    'rejected_at' => null,
                    'rejection_reason' => null,
                ]);
                $activityRecorder->record($request->user(), 'resident.registration_approved', $registration);
            } else {
                $registration->update([
                    'status' => 'rejected',
                    'rejected_by' => $request->user()->id,
                    'rejected_at' => now(),
                    'rejection_reason' => $data['rejection_reason'],
                ]);
                $registration->tokens()->delete();
                $activityRecorder->record($request->user(), 'resident.registration_rejected', $registration);
            }

            return $registration;
        });

        return response()->json([
            'id' => $reviewedUser->id,
            'status' => $reviewedUser->status,
        ]);
    }
}
