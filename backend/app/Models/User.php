<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name', 'email', 'password', 'role', 'status', 'address', 'region_code', 'region_name',
    'province_code', 'province_name', 'city_municipality_code', 'city_municipality_name',
    'barangay_code', 'barangay_name', 'approved_by', 'approved_at', 'rejected_by', 'rejected_at', 'rejection_reason',
    'archived_from_status',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_RESIDENT = 'resident';

    public const ROLE_BHW = 'bhw';

    public const ROLE_HEALTH_CENTER = 'health_center';

    public const ROLE_SUPERUSER = 'superuser';

    public function resident(): HasOne
    {
        return $this->hasOne(Resident::class);
    }

    public function isStaff(): bool
    {
        return in_array($this->role, [self::ROLE_BHW, self::ROLE_HEALTH_CENTER], true);
    }

    public function canAccessArea(?string $barangayCode): bool
    {
        return $this->role === self::ROLE_HEALTH_CENTER || ($this->role === self::ROLE_BHW && $barangayCode !== null && $this->barangay_code === $barangayCode);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }
}
