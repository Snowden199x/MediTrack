<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

#[Signature('meditrack:create-staff {--role=health_center} {--name=} {--email=} {--barangay-code=} {--barangay-name=}')]
#[Description('Create a health-center or BHW account; prompts for the password privately.')]
class CreateHealthCenterStaff extends Command
{
    public function handle(): int
    {
        $data = [
            'role' => $this->option('role'),
            'name' => $this->option('name') ?: $this->ask('Name'),
            'email' => $this->option('email') ?: $this->ask('Email'),
            'barangay_code' => $this->option('barangay-code'),
            'barangay_name' => $this->option('barangay-name'),
            'password' => $this->secret('Password (at least 8 characters)'),
        ];

        $validator = Validator::make($data, [
            'role' => ['required', 'in:bhw,health_center'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'barangay_code' => ['required_if:role,bhw', 'nullable', 'string', 'regex:/\A[0-9]{10}\z/'],
            'barangay_name' => ['required_if:role,bhw', 'nullable', 'string', 'max:150'],
        ]);

        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        $validated = $validator->validated();
        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'status' => 'active',
            'barangay_code' => $validated['barangay_code'] ?? null,
            'barangay_name' => $validated['barangay_name'] ?? null,
            'approved_at' => now(),
        ]);

        $this->info('Staff account created.');

        return self::SUCCESS;
    }
}
