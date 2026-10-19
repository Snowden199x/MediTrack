<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminBhwAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::query()
            ->where('role', User::ROLE_BHW)
            ->select(
                'id', 'name', 'email', 'role', 'status', 'address', 'region_name', 'province_name',
                'city_municipality_name', 'barangay_name', 'approved_at', 'created_at',
            )
            ->orderBy('name')->orderBy('id')->paginate(20));
    }

    public function store(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
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

        $bhw = DB::transaction(function () use ($data, $request, $activityRecorder): User {
            $bhw = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'address' => $data['address'] ?? null,
                'region_code' => $data['region_code'],
                'region_name' => $data['region_name'],
                'province_code' => $data['province_code'] ?? null,
                'province_name' => $data['province_name'] ?? null,
                'city_municipality_code' => $data['city_municipality_code'],
                'city_municipality_name' => $data['city_municipality_name'],
                'barangay_code' => $data['barangay_code'],
                'barangay_name' => $data['barangay_name'],
                'role' => User::ROLE_BHW,
                'status' => 'active',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            $activityRecorder->record($request->user(), 'bhw.account_created', $bhw);

            return $bhw;
        });

        return response()->json($bhw->only([
            'id', 'name', 'email', 'role', 'status', 'address', 'region_name', 'province_name',
            'city_municipality_name', 'barangay_name', 'approved_at',
        ]), 201);
    }
}
