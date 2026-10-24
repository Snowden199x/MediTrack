<?php

use App\Http\Controllers\AdminAccountController;
use App\Http\Controllers\AdminBhwAccountController;
use App\Http\Controllers\AdminRegistrationController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AreaAlertController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CareRequestController;
use App\Http\Controllers\PsgcLocationController;
use App\Http\Controllers\ResidentController;
use App\Http\Controllers\ResidentMapController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SymptomReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/admin/login', [AuthController::class, 'superuserLogin'])->middleware('throttle:auth');

Route::prefix('locations')->middleware('throttle:locations')->group(function () {
    Route::get('/regions', [PsgcLocationController::class, 'regions']);
    Route::get('/regions/{regionCode}/provinces', [PsgcLocationController::class, 'provinces'])->where('regionCode', '[0-9]{10}');
    Route::get('/regions/{regionCode}/cities-municipalities', [PsgcLocationController::class, 'regionalCitiesMunicipalities'])->where('regionCode', '[0-9]{10}');
    Route::get('/provinces/{provinceCode}/cities-municipalities', [PsgcLocationController::class, 'provincialCitiesMunicipalities'])->where('provinceCode', '[0-9]{10}');
    Route::get('/cities-municipalities/{cityMunicipalityCode}/barangays', [PsgcLocationController::class, 'barangays'])->where('cityMunicipalityCode', '[0-9]{10}');
});

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', fn (Request $request) => $request->user());
    Route::get('/announcements', [AnnouncementController::class, 'index']);

    Route::middleware('role:superuser')->prefix('admin')->group(function () {
        Route::get('/accounts', [AdminAccountController::class, 'index']);
        Route::patch('/accounts/{user}', [AdminAccountController::class, 'update']);
        Route::post('/accounts/{user}/archive', [AdminAccountController::class, 'archive']);
        Route::post('/accounts/{user}/restore', [AdminAccountController::class, 'restore']);
        Route::delete('/accounts/{user}', [AdminAccountController::class, 'destroy']);
        Route::get('/registrations', [AdminRegistrationController::class, 'index']);
        Route::patch('/registrations/{user}', [AdminRegistrationController::class, 'update']);
        Route::get('/bhw-accounts', [AdminBhwAccountController::class, 'index']);
        Route::post('/bhw-accounts', [AdminBhwAccountController::class, 'store']);
        Route::get('/resident-map', [ResidentMapController::class, 'index']);
        Route::post('/announcements', [AnnouncementController::class, 'store']);
    });

    Route::middleware('role:resident')->prefix('resident')->group(function () {
        Route::get('/dashboard', [ResidentController::class, 'dashboard']);
        Route::post('/profile', [ResidentController::class, 'createProfile']);
        Route::post('/requests', [CareRequestController::class, 'store'])->middleware('throttle:reports');
        Route::get('/symptom-questions', [SymptomReportController::class, 'questions']);
        Route::post('/symptom-reports', [SymptomReportController::class, 'store'])->middleware('throttle:reports');
    });

    Route::middleware('role:bhw,health_center')->prefix('staff')->group(function () {
        Route::get('/dashboard', [StaffController::class, 'dashboard']);
        Route::get('/residents', [StaffController::class, 'residents']);
        Route::post('/households', [StaffController::class, 'createHousehold']);
        Route::get('/residents/{resident}', [StaffController::class, 'resident']);
        Route::post('/residents/{resident}/appointments', [StaffController::class, 'createAppointment']);
        Route::post('/residents/{resident}/visits', [StaffController::class, 'createVisit']);
        Route::post('/residents/{resident}/follow-ups', [StaffController::class, 'createFollowUp']);
        Route::patch('/appointments/{appointment}', [StaffController::class, 'updateAppointment']);
        Route::get('/follow-ups', [StaffController::class, 'followUps']);
        Route::patch('/follow-ups/{followUp}', [StaffController::class, 'closeFollowUp']);
        Route::get('/requests', [CareRequestController::class, 'index']);
        Route::patch('/requests/{careRequest}', [CareRequestController::class, 'respond']);
        Route::get('/symptom-reports', [SymptomReportController::class, 'index']);
        Route::patch('/symptom-reports/{symptomReport}', [SymptomReportController::class, 'review']);

        Route::middleware('role:health_center')->group(function () {
            Route::get('/accounts', [StaffController::class, 'accounts']);
            Route::patch('/accounts/{user}', [StaffController::class, 'updateAccount']);
            Route::post('/announcements', [AnnouncementController::class, 'store']);
            Route::get('/area-trends', [AreaAlertController::class, 'trends']);
            Route::get('/area-alerts', [AreaAlertController::class, 'index']);
            Route::patch('/area-alerts/{areaAlert}', [AreaAlertController::class, 'review']);
            Route::get('/area-alert-rules', [AreaAlertController::class, 'rules']);
            Route::put('/area-alert-rules', [AreaAlertController::class, 'saveRule']);
        });
    });
});
