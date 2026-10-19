<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CareRequest;
use App\Models\FollowUp;
use App\Models\Household;
use App\Models\Resident;
use App\Models\SymptomReport;
use App\Models\User;
use App\Models\Visit;
use App\Services\ActivityRecorder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StaffController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $residentIds = $this->residentScope($request->user())->select('residents.id');

        return response()->json([
            'residents' => (clone $residentIds)->count(),
            'upcoming_appointments' => Appointment::whereIn('resident_id', (clone $residentIds))
                ->where('status', 'scheduled')->where('scheduled_for', '>=', now())->count(),
            'open_follow_ups' => FollowUp::whereIn('resident_id', (clone $residentIds))->where('status', 'open')->count(),
            'pending_requests' => CareRequest::whereIn('resident_id', (clone $residentIds))->where('status', 'pending')->count(),
            'pending_reports' => SymptomReport::whereIn('resident_id', (clone $residentIds))->where('status', 'pending')->count(),
            'visits_this_month' => Visit::whereIn('resident_id', (clone $residentIds))
                ->where('visited_at', '>=', now()->startOfMonth())->count(),
        ]);
    }

    public function residents(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'barangay_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/'],
        ]);

        $residents = $this->residentScope($request->user())
            ->with('household:id,address,barangay_code,barangay_name')
            ->when($data['search'] ?? null, fn (Builder $query, string $search) => $query->where('name', 'like', '%'.$search.'%'))
            ->when($data['barangay_code'] ?? null, fn (Builder $query, string $barangayCode) => $query->whereHas('household', fn (Builder $households) => $households->where('barangay_code', $barangayCode)))
            ->orderBy('name')->orderBy('id')->paginate(20);

        return response()->json($residents);
    }

    public function resident(Request $request, Resident $resident): JsonResponse
    {
        $this->authorizeResident($request->user(), $resident);

        return response()->json($resident->load([
            'household',
            'appointments' => fn ($query) => $query->latest('scheduled_for')->limit(20),
            'visits' => fn ($query) => $query->latest('visited_at')->limit(20),
            'followUps' => fn ($query) => $query->latest()->limit(20),
            'careRequests' => fn ($query) => $query->latest()->limit(20),
            'symptomReports' => fn ($query) => $query->latest()->limit(20),
        ]));
    }

    public function createHousehold(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        $locationRequirement = $request->user()->role === User::ROLE_HEALTH_CENTER ? 'required' : 'nullable';
        $data = $request->validate([
            'address' => ['nullable', 'string', 'max:255'],
            'region_code' => [$locationRequirement, 'string', 'regex:/\A[0-9]{10}\z/'],
            'region_name' => [$locationRequirement, 'string', 'max:120'],
            'province_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/', 'required_with:province_name'],
            'province_name' => ['nullable', 'string', 'max:150', 'required_with:province_code'],
            'city_municipality_code' => [$locationRequirement, 'string', 'regex:/\A[0-9]{10}\z/'],
            'city_municipality_name' => [$locationRequirement, 'string', 'max:150'],
            'barangay_code' => [$locationRequirement, 'string', 'regex:/\A[0-9]{10}\z/'],
            'barangay_name' => [$locationRequirement, 'string', 'max:150'],
            'members' => ['required', 'array', 'min:1', 'max:10'],
            'members.*.name' => ['required', 'string', 'max:255'],
            'members.*.birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'members.*.sex' => ['nullable', Rule::in(['female', 'male', 'other', 'undisclosed'])],
            'members.*.phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = $request->user();
        $barangayCode = $user->role === User::ROLE_BHW ? $user->barangay_code : ($data['barangay_code'] ?? null);
        abort_unless($user->canAccessArea($barangayCode), 403);

        $household = DB::transaction(function () use ($data, $request, $activityRecorder, $user, $barangayCode): Household {
            $household = Household::create([
                'address' => $data['address'] ?? null,
                'region_code' => $user->role === User::ROLE_BHW ? $user->region_code : $data['region_code'] ?? null,
                'region_name' => $user->role === User::ROLE_BHW ? $user->region_name : $data['region_name'] ?? null,
                'province_code' => $user->role === User::ROLE_BHW ? $user->province_code : $data['province_code'] ?? null,
                'province_name' => $user->role === User::ROLE_BHW ? $user->province_name : $data['province_name'] ?? null,
                'city_municipality_code' => $user->role === User::ROLE_BHW ? $user->city_municipality_code : $data['city_municipality_code'] ?? null,
                'city_municipality_name' => $user->role === User::ROLE_BHW ? $user->city_municipality_name : $data['city_municipality_name'] ?? null,
                'barangay_code' => $barangayCode,
                'barangay_name' => $user->role === User::ROLE_BHW ? $user->barangay_name : $data['barangay_name'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['members'] as $member) {
                $resident = $household->residents()->create([
                    'name' => $member['name'],
                    'birth_date' => $member['birth_date'] ?? null,
                    'sex' => $member['sex'] ?? null,
                    'phone' => $member['phone'] ?? null,
                    'created_by' => $request->user()->id,
                ]);
                $activityRecorder->record($request->user(), 'resident.created', $resident);
            }

            return $household;
        });

        return response()->json($household->load('residents'), 201);
    }

    public function createAppointment(Request $request, Resident $resident, ActivityRecorder $activityRecorder): JsonResponse
    {
        $this->authorizeResident($request->user(), $resident);
        $data = $request->validate([
            'type' => ['required', 'string', 'max:80'],
            'scheduled_for' => ['required', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment = $resident->appointments()->create($data + [
            'status' => 'scheduled',
            'created_by' => $request->user()->id,
        ]);
        $activityRecorder->record($request->user(), 'appointment.created', $appointment);

        return response()->json($appointment, 201);
    }

    public function updateAppointment(Request $request, Appointment $appointment, ActivityRecorder $activityRecorder): JsonResponse
    {
        $this->authorizeResident($request->user(), $appointment->resident);
        $data = $request->validate([
            'status' => ['required', Rule::in(['completed', 'missed', 'cancelled'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        DB::transaction(function () use ($appointment, $data, $request, $activityRecorder): void {
            $appointment = Appointment::whereKey($appointment->id)->lockForUpdate()->firstOrFail();
            abort_unless($appointment->status === 'scheduled', 409, 'This appointment is already closed.');
            $appointment->update($data);

            if ($data['status'] === 'missed') {
                FollowUp::create([
                    'resident_id' => $appointment->resident_id,
                    'reason' => 'Missed '.$appointment->type.' appointment on '.$appointment->scheduled_for->toDateString(),
                    'status' => 'open',
                    'created_by' => $request->user()->id,
                ]);
            }

            $activityRecorder->record($request->user(), 'appointment.updated', $appointment);
        });

        return response()->json($appointment->refresh());
    }

    public function createVisit(Request $request, Resident $resident, ActivityRecorder $activityRecorder): JsonResponse
    {
        $this->authorizeResident($request->user(), $resident);
        $data = $request->validate([
            'visited_at' => ['required', 'date', 'before_or_equal:now'],
            'outcome' => ['required', Rule::in(['completed', 'unable_to_contact'])],
            'systolic' => ['nullable', 'required_with:diastolic', 'integer', 'between:40,300'],
            'diastolic' => ['nullable', 'required_with:systolic', 'integer', 'between:20,200'],
            'temperature_c' => ['nullable', 'numeric', 'between:30,45'],
            'notes' => ['nullable', 'string', 'max:3000'],
            'next_visit_at' => ['nullable', 'date', 'after:now'],
        ]);

        if ($data['outcome'] === 'unable_to_contact' &&
            (isset($data['systolic']) || isset($data['diastolic']) || isset($data['temperature_c']))) {
            throw ValidationException::withMessages(['outcome' => ['Measurements cannot be recorded when the resident was not contacted.']]);
        }

        $visit = DB::transaction(function () use ($resident, $data, $request, $activityRecorder): Visit {
            $visit = $resident->visits()->create($data + ['recorded_by' => $request->user()->id]);

            if (! empty($data['next_visit_at'])) {
                $resident->appointments()->create([
                    'type' => 'Follow-up visit',
                    'scheduled_for' => $data['next_visit_at'],
                    'status' => 'scheduled',
                    'created_by' => $request->user()->id,
                ]);
            }

            $activityRecorder->record($request->user(), 'visit.created', $visit);

            return $visit;
        });

        return response()->json($visit, 201);
    }

    public function followUps(Request $request): JsonResponse
    {
        return response()->json(FollowUp::query()
            ->whereIn('resident_id', $this->residentScope($request->user())->select('residents.id'))
            ->with('resident.household:id,address,barangay_code,barangay_name')
            ->orderByRaw("CASE WHEN status = 'open' THEN 0 ELSE 1 END")
            ->latest('id')->paginate(20));
    }

    public function createFollowUp(Request $request, Resident $resident, ActivityRecorder $activityRecorder): JsonResponse
    {
        $this->authorizeResident($request->user(), $resident);
        $data = $request->validate(['reason' => ['required', 'string', 'max:255']]);
        $followUp = $resident->followUps()->create($data + [
            'status' => 'open',
            'created_by' => $request->user()->id,
        ]);
        $activityRecorder->record($request->user(), 'follow_up.created', $followUp);

        return response()->json($followUp, 201);
    }

    public function closeFollowUp(Request $request, FollowUp $followUp, ActivityRecorder $activityRecorder): JsonResponse
    {
        $this->authorizeResident($request->user(), $followUp->resident);
        abort_unless($followUp->status === 'open', 409, 'Follow-up is already closed.');
        $data = $request->validate(['action_note' => ['required', 'string', 'max:3000']]);
        $followUp->update([
            'status' => 'completed',
            'action_note' => $data['action_note'],
            'closed_by' => $request->user()->id,
            'closed_at' => now(),
        ]);
        $activityRecorder->record($request->user(), 'follow_up.completed', $followUp);

        return response()->json($followUp);
    }

    public function accounts(): JsonResponse
    {
        return response()->json(User::query()
            ->whereIn('role', [User::ROLE_RESIDENT, User::ROLE_BHW])
            ->select('id', 'name', 'email', 'role', 'status', 'barangay_code', 'barangay_name', 'approved_at', 'created_at')
            ->orderBy('name')->orderBy('id')->paginate(20));
    }

    public function updateAccount(Request $request, User $user, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless(in_array($user->role, [User::ROLE_RESIDENT, User::ROLE_BHW], true), 403);
        abort_if($user->id === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended', 'deactivated'])],
            'region_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/', 'required_with:barangay_code'],
            'region_name' => ['nullable', 'string', 'max:120', 'required_with:barangay_code'],
            'province_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/', 'required_with:province_name'],
            'province_name' => ['nullable', 'string', 'max:150', 'required_with:province_code'],
            'city_municipality_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/', 'required_with:barangay_code'],
            'city_municipality_name' => ['nullable', 'string', 'max:150', 'required_with:barangay_code'],
            'barangay_code' => ['sometimes', 'required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'barangay_name' => ['nullable', 'string', 'max:150', 'required_with:barangay_code'],
        ]);

        $changes = ['status' => $data['status']];
        if ($user->role === User::ROLE_BHW && isset($data['barangay_code'])) {
            $changes = array_merge($changes, array_intersect_key($data, array_flip([
                'region_code', 'region_name', 'province_code', 'province_name',
                'city_municipality_code', 'city_municipality_name', 'barangay_code', 'barangay_name',
            ])));
        }
        $user->update($changes);

        if ($data['status'] !== 'active') {
            $user->tokens()->delete();
        }

        $activityRecorder->record($request->user(), 'account.updated', $user);

        return response()->json($user->only([
            'id', 'name', 'email', 'role', 'status', 'barangay_code', 'barangay_name',
            'region_code', 'region_name', 'province_code', 'province_name',
            'city_municipality_code', 'city_municipality_name',
        ]));
    }

    private function residentScope(User $user): Builder
    {
        return Resident::query()->when($user->role === User::ROLE_BHW, fn (Builder $query) => $query->whereHas('household', fn (Builder $households) => $households->where('barangay_code', $user->barangay_code)));
    }

    private function authorizeResident(User $user, Resident $resident): void
    {
        abort_unless($user->canAccessArea($resident->household->barangay_code), 403);
    }
}
