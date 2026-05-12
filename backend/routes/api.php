<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PedagangController;
use App\Http\Controllers\PencatatanController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('pedagangs', PedagangController::class);

    Route::apiResource('pencatatans', PencatatanController::class)->except(['destroy', 'show']);
});
