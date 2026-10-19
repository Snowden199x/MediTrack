<?php

namespace App\Http\Controllers;

use App\Models\Resident;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $role = $request->query('role');
        $status = $request->query('status');
        $accountRoles = [User::ROLE_RESIDENT, User::ROLE_BHW];

        $byRoleStatus = User::query()
            ->whereIn('role', $accountRoles)
            ->selectRaw('role, status, COUNT(*) as total')
            ->groupBy('role', 'status')
            ->get()
            ->groupBy('role')
            ->map(fn ($statuses) => $statuses->mapWithKeys(fn ($row) => [$row->status => (int) $row->total]));

        $accounts = User::query()
            ->whereIn('role', $accountRoles)
            ->with('resident:id,user_id,birth_date,age,sex')
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('barangay_name', 'like', "%{$search}%")))
            ->when(in_array($role, $accountRoles, true), fn ($query) => $query->where('role', $role))
            ->when(is_string($status) && $status !== '', fn ($query) => $query->where('status', $status))
            ->select([
                'id', 'name', 'email', 'role', 'status', 'archived_from_status', 'barangay_code',
                'barangay_name', 'city_municipality_name', 'province_name', 'region_name', 'created_at',
            ])
            ->orderByDesc('created_at')->orderByDesc('id')->paginate(20);

        return response()->json([
            'counts' => [
                'residents' => (int) User::where('role', User::ROLE_RESIDENT)->count(),
                'bhw' => (int) User::where('role', User::ROLE_BHW)->count(),
                'pending' => (int) User::where('role', User::ROLE_RESIDENT)->where('status', 'pending')->count(),
                'archived' => (int) User::whereIn('role', $accountRoles)->where('status', 'archived')->count(),
            ],
            'by_role_status' => $byRoleStatus,
            'accounts' => $accounts,
        ]);
    }

    public function update(Request $request, User $user, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless(in_array($user->role, [User::ROLE_RESIDENT, User::ROLE_BHW], true), 404);
        abort_if($user->status === 'archived', 409, 'Restore this account before editing it.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        DB::transaction(function () use ($user, $data, $activityRecorder, $request): void {
            $user->update($data);
            if ($user->role === User::ROLE_RESIDENT) {
                Resident::where('user_id', $user->id)->update(['name' => $data['name']]);
            }
            $activityRecorder->record($request->user(), 'account.edited', $user);
        });

        return response()->json($user->only(['id', 'name', 'email', 'role', 'status']));
    }

    public function archive(Request $request, User $user, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless(in_array($user->role, [User::ROLE_RESIDENT, User::ROLE_BHW], true), 404);
        abort_if($user->status === 'archived', 409, 'This account is already archived.');
        abort_if($user->status === 'pending', 409, 'Review this resident registration before archiving it.');

        DB::transaction(function () use ($user, $activityRecorder, $request): void {
            $user->update(['archived_from_status' => $user->status, 'status' => 'archived']);
            $user->tokens()->delete();
            $activityRecorder->record($request->user(), 'account.archived', $user);
        });

        return response()->json(['id' => $user->id, 'status' => $user->status]);
    }

    public function restore(Request $request, User $user, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless(in_array($user->role, [User::ROLE_RESIDENT, User::ROLE_BHW], true), 404);
        abort_unless($user->status === 'archived', 409, 'This account is not archived.');

        DB::transaction(function () use ($user, $activityRecorder, $request): void {
            $user->update([
                'status' => $user->archived_from_status ?? 'active',
                'archived_from_status' => null,
            ]);
            $activityRecorder->record($request->user(), 'account.restored', $user);
        });

        return response()->json(['id' => $user->id, 'status' => $user->status]);
    }

    public function destroy(Request $request, User $user, ActivityRecorder $activityRecorder): JsonResponse
    {
        abort_unless(in_array($user->role, [User::ROLE_RESIDENT, User::ROLE_BHW], true), 404);
        abort_if($user->status !== 'archived', 409, 'Archive this account before permanently deleting it.');

        DB::transaction(function () use ($user, $activityRecorder, $request): void {
            $activityRecorder->record($request->user(), 'account.deleted', $user);
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->json(['message' => 'Account deleted. Existing resident health records are retained.']);
    }
}
