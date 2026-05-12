<?php

namespace App\Http\Controllers;

use App\Models\Pedagang;
use Illuminate\Http\Request;

class PedagangController extends Controller
{
    // Menampilkan semua data pedagang
    public function index()
    {
        $pedagangs = Pedagang::all();
        return response()->json($pedagangs);
    }

    // Menyimpan pedagang baru
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required',
            'no_reg' => 'required|unique:pedagangs',
            'watt' => 'nullable|integer'
        ]);

        $pedagang = Pedagang::create($request->all());
        return response()->json(['message' => 'Pedagang berhasil ditambahkan!', 'data' => $pedagang], 201);
    }

    // Menampilkan satu pedagang beserta histori meterannya
    public function show(Pedagang $pedagang)
    {
        // Load juga relasi riwayat pencatatannya
        return response()->json($pedagang->load('pencatatans'));
    }

    // Mengupdate data pedagang
    public function update(Request $request, Pedagang $pedagang)
    {
        $request->validate([
            'nama' => 'required',
            'no_reg' => 'required|unique:pedagangs,no_reg,' . $pedagang->id, // Hindari error duplikat saat update dirinya sendiri
        ]);

        $pedagang->update($request->all());
        return response()->json(['message' => 'Data pedagang diperbarui!', 'data' => $pedagang]);
    }

    // Menghapus pedagang
    public function destroy(Pedagang $pedagang)
    {
        $pedagang->delete();
        return response()->json(['message' => 'Pedagang dihapus!']);
    }
}
