<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $barangayCode = $request->user()->role === User::ROLE_RESIDENT
            ? $request->user()->resident?->household?->barangay_code
            : $request->user()->barangay_code;

        $announcements = Announcement::query()
            ->where('published_at', '<=', now())
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>=', now()))
            ->when($request->user()->role !== User::ROLE_HEALTH_CENTER,
                fn ($query) => $query->where(fn ($scoped) => $scoped->whereNull('barangay_code')->orWhere('barangay_code', $barangayCode)))
            ->latest('published_at')->paginate(20);

        return response()->json($announcements);
    }

    public function store(Request $request, ActivityRecorder $activityRecorder): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'barangay_code' => ['nullable', 'string', 'regex:/\A[0-9]{10}\z/'],
            'barangay_name' => ['nullable', 'string', 'max:150', 'required_with:barangay_code'],
            'published_at' => ['required', 'date'],
            'expires_at' => ['nullable', 'date', 'after:published_at'],
        ]);

        $announcement = Announcement::create($data + ['created_by' => $request->user()->id]);
        $activityRecorder->record($request->user(), 'announcement.created', $announcement);

        return response()->json($announcement, 201);
    }
}
