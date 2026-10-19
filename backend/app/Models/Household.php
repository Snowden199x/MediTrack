<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'address', 'region_code', 'region_name', 'province_code', 'province_name',
    'city_municipality_code', 'city_municipality_name', 'barangay_code', 'barangay_name', 'created_by',
])]
class Household extends Model
{
    public function residents(): HasMany
    {
        return $this->hasMany(Resident::class);
    }
}
