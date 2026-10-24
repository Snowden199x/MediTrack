<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\Resident;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'middle_initial' => ['nullable', 'string', 'max:10'],
            'last_name' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'age' => ['required', 'integer', 'between:0,120'],
            'sex' => ['required', Rule::in(['female', 'male', 'other', 'undisclosed'])],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
            'address' => ['nullable', 'string', 'max:255'],
            'region_code' => ['required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'region_name' => ['required', 'string', 'max:120'],
            'province_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/', 'required_with:province_name'],
            'province_name' => ['nullable', 'string', 'max:150', 'required_with:province_code'],
            'city_municipality_code' => ['required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'city_municipality_name' => ['required', 'string', 'max:150'],
            'barangay_code' => ['required', 'string', 'regex:/\A[0-9]{10}\z/'],
            'barangay_name' => ['required', 'string', 'max:150'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $name = implode(' ', array_filter([
            $data['first_name'],
            $data['middle_initial'] ?? null,
            $data['last_name'],
        ]));

        $user = DB::transaction(function () use ($data, $name, $activityRecorder): User {
            $user = User::create([
                'name' => $name,
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => User::ROLE_RESIDENT,
                'status' => 'pending',
            ]);

            $household = Household::create([
                'address' => $data['address'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'region_code' => $data['region_code'],
                'region_name' => $data['region_name'],
                'province_code' => $data['province_code'] ?? null,
                'province_name' => $data['province_name'] ?? null,
                'city_municipality_code' => $data['city_municipality_code'],
                'city_municipality_name' => $data['city_municipality_name'],
                'barangay_code' => $data['barangay_code'],
                'barangay_name' => $data['barangay_name'],
                'created_by' => $user->id,
            ]);

            $resident = Resident::create([
                'household_id' => $household->id,
                'user_id' => $user->id,
                'name' => $name,
                'first_name' => $data['first_name'],
                'middle_initial' => $data['middle_initial'] ?? null,
                'last_name' => $data['last_name'],
                'birth_date' => $data['birth_date'],
                'age' => $data['age'],
                'sex' => $data['sex'],
                'created_by' => $user->id,
            ]);
            $activityRecorder->record($user, 'resident.registered', $resident);

            return $user;
        });

        return response()->json([
            'message' => 'Registration received. A superuser must approve your account before you can sign in.',
            'status' => $user->status,
        ], 202);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || $user->role === User::ROLE_SUPERUSER) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status === 'pending') {
            abort(403, 'Your registration is waiting for superuser review.');
        }

        if ($user->status === 'rejected') {
            abort(403, 'Your registration was not approved. Please contact the health center.');
        }

        abort_unless($user->status === 'active', 403, 'This account is not active.');

        return response()->json([
            'user' => $user->load('resident.household'),
            'token' => $user->createToken('web', ['*'], now()->addDays(7))->plainTextToken,
        ]);
    }

    public function superuserLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password) || $user->role !== User::ROLE_SUPERUSER) {
            throw ValidationException::withMessages([
                'email' => ['Invalid superuser credentials.'],
            ]);
        }

        abort_unless($user->status === 'active', 403, 'This superuser account is not active.');

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('admin-web', ['*'], now()->addDays(7))->plainTextToken,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('resident.household'));
    }
}
