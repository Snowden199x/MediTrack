<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

#[Signature('meditrack:bootstrap-superuser')]
#[Description('Create the initial superuser account from private environment settings.')]
class BootstrapSuperuser extends Command
{
    public function handle(): int
    {
        $data = config('meditrack.superuser');
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:16'],
        ]);

        if ($validator->fails()) {
            $this->error('Set MEDITRACK_SUPERUSER_NAME, MEDITRACK_SUPERUSER_EMAIL, and a password of at least 16 characters in the private backend/.env.');

            return self::FAILURE;
        }

        $validated = $validator->validated();
        $existingUser = User::where('email', $validated['email'])->first();

        if ($existingUser) {
            if ($existingUser->role === User::ROLE_SUPERUSER && $existingUser->status === 'active') {
                $existingUser->fill([
                    'name' => $validated['name'],
                    'password' => $validated['password'],
                ]);
                $existingUser->save();

                $this->info('The configured superuser account was updated.');

                return self::SUCCESS;
            }

            $this->error('The configured email is already used by another account.');

            return self::FAILURE;
        }

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => User::ROLE_SUPERUSER,
            'status' => 'active',
        ]);

        $this->info('Initial superuser account created.');

        return self::SUCCESS;
    }
}
