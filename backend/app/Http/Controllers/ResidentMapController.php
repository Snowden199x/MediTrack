<?php

namespace App\Http\Controllers;

use App\Models\Household;
use Illuminate\Http\JsonResponse;

class ResidentMapController extends Controller
{
    public function index(): JsonResponse
    {
        $households = Household::query()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select([
                'id', 'address', 'latitude', 'longitude',
                'barangay_name', 'city_municipality_name', 'province_name', 'region_name',
            ])
            ->with([
                'residents' => fn ($q) => $q->select([
                    'id', 'household_id', 'name', 'first_name', 'last_name', 'age', 'sex',
                ]),
            ])
            ->get();

        return response()->json($households);
    }
}
