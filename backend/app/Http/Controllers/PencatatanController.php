<?php

namespace App\Http\Controllers;

use App\Models\Pencatatan;
use Illuminate\Http\Request;

class PencatatanController extends Controller
{
    // Menampilkan pencatatan (bisa difilter per bulan)
    public function index(Request $request)
    {
        // Jika React mengirimkan request filter bulan/tahun, tangkap di sini
        $query = Pencatatan::with('pedagang'); // Load juga nama pedagangnya

        if ($request->has('bulan')) {
            $query->where('periode_bulan', $request->bulan);
        }
        if ($request->has('tahun')) {
            $query->where('periode_tahun', $request->tahun);
        }

        return response()->json($query->get());
    }

    // Mencatat meteran AWAL BULAN
    public function store(Request $request)
    {
        $request->validate([
            'pedagang_id' => 'required|exists:pedagangs,id',
            'periode_bulan' => 'required',
            'periode_tahun' => 'required',
            'meter_awal' => 'required|integer'
        ]);

        $pencatatan = Pencatatan::create($request->all());
        return response()->json(['message' => 'Meter awal dicatat!', 'data' => $pencatatan], 201);
    }

    // Mengupdate meteran AKHIR BULAN (Otomatis hitung selisih!)
    public function update(Request $request, $id)
    {
        $pencatatan = Pencatatan::findOrFail($id);

        $validated = $request->validate([
            // Kita paksa meter_awal jadi integer sebelum dibandingin sama meter_akhir
            'meter_akhir' => 'required|numeric|gte:' . (int)$pencatatan->meter_awal,
        ]);

        $pencatatan->update([
            'meter_akhir' => (int)$request->meter_akhir,
            'jumlah' => (int)$request->meter_akhir - (int)$pencatatan->meter_awal,
        ]);

        return response()->json(['message' => 'Berhasil update', 'data' => $pencatatan]);
    }
}
