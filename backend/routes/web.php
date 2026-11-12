<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome'); // CI/CD pull request test
});
