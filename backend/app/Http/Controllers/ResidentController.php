<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Household;
use App\Models\Resident;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResidentController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $resident = $request->user()->resident;

        if (! $resident) {
            return response()->json(['needs_profile' => true]);
        }

        $barangayCode = $resident->household->barangay_code;
        $announcements = Announcement::query()
            ->where('published_at', '<=', now())
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
            ->where(fn ($query) => $query->whereNull('barangay_code')->orWhere('barangay_code', $barangayCode))
            ->latest('published_at')->limit(10)->get();

        return response()->json([
            'resident' => $resident->load('household'),
            'appointments' => $resident->appointments()->where('status', 'scheduled')
                ->where('scheduled_for', '>=', now())->orderBy('scheduled_for')->limit(20)->get(),
            'requests' => $resident->careRequests()->latest()->limit(20)->get(),
            'symptom_reports' => $resident->symptomReports()->latest()->limit(20)->get(),
            'announcements' => $announcements,
        ]);
    }

    public function createProfile(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_if($request->user()->resident()->exists(), 409, 'A resident profile already exists.');
        $data = $request->validate([
            'address' => ['nullable', 'string', 'max:255'],
            'region_code' => ['required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'region_name' => ['required', 'string', 'max:120'],
            'province_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/', 'required_with:province_name'],
            'province_name' => ['nullable', 'string', 'max:150', 'required_with:province_code'],
            'city_municipality_code' => ['required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'city_municipality_name' => ['required', 'string', 'max:150'],
            'barangay_code' => ['required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'barangay_name' => ['required', 'string', 'max:150'],
        ]);

        $resident = DB::transaction(function () use ($request, $data, $activityRecorder): Resident {
            $household = Household::create([
                'address' => $data['address'] ?? null,
                'region_code' => $data['region_code'],
                'region_name' => $data['region_name'],
                'province_code' => $data['province_code'] ?? null,
                'province_name' => $data['province_name'] ?? null,
                'city_municipality_code' => $data['city_municipality_code'],
                'city_municipality_name' => $data['city_municipality_name'],
                'barangay_code' => $data['barangay_code'],
                'barangay_name' => $data['barangay_name'],
                'created_by' => $request->user()->id,
            ]);
            $resident = Resident::create([
                'household_id' => $household->id,
                'user_id' => $request->user()->id,
                'name' => $request->user()->name,
                'created_by' => $request->user()->id,
            ]);
            $activityRecorder->record($request->user(), 'resident.profile_created', $resident);

            return $resident;
        });

        return response()->json($resident->load('household'), 201);
    }
}
