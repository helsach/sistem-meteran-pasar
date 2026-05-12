<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validasi inputan dari React
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();

        // 3. Cek apakah user ada dan passwordnya cocok
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau Password salah!'
            ], 401);
        }

        // 4. Buatkan token untuk React
        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login sukses!',
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        // Hapus token saat admin logout
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout sukses!'
        ]);
    }
}
