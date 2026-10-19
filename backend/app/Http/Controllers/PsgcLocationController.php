<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use UnexpectedValueException;

class PsgcLocationController extends Controller
{
    public function regions(): JsonResponse
    {
        return $this->locations('regions');
    }

    public function provinces(string $regionCode): JsonResponse
    {
        return $this->locations('regions/'.rawurlencode($regionCode).'/provinces');
    }

    public function regionalCitiesMunicipalities(string $regionCode): JsonResponse
    {
        return $this->locations('regions/'.rawurlencode($regionCode).'/cities-municipalities');
    }

    public function provincialCitiesMunicipalities(string $provinceCode): JsonResponse
    {
        return $this->locations('provinces/'.rawurlencode($provinceCode).'/cities-municipalities');
    }

    public function barangays(string $cityMunicipalityCode): JsonResponse
    {
        return $this->locations('cities-municipalities/'.rawurlencode($cityMunicipalityCode).'/barangays');
    }

    private function locations(string $path): JsonResponse
    {
        try {
            $locations = Cache::remember('psgc:v2:'.$path, now()->addHours(24), function () use ($path): array {
                $baseUrl = rtrim((string) config('services.psgc.base_url'), '/');
                $response = Http::acceptJson()
                    ->connectTimeout(3)
                    ->timeout(8)
                    ->get($baseUrl.'/'.$path)
                    ->throw();
                $data = $response->json('data');

                if (! is_array($data)) {
                    throw new UnexpectedValueException('Unexpected PSGC response format.');
                }

                return $data;
            });

            return response()->json($locations);
        } catch (ConnectionException|RequestException|UnexpectedValueException $exception) {
            report($exception);

            return response()->json(['message' => 'Address options are temporarily unavailable.'], 503);
        }
    }
}
