<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pencatatan extends Model
{
    use HasFactory;

    protected $fillable = [
        'pedagang_id', 'periode_bulan', 'periode_tahun',
        'meter_awal', 'meter_akhir', 'jumlah'
    ];

    // Relasi kebalikannya: Satu pencatatan ini milik siapa?
    public function pedagang()
    {
        return $this->belongsTo(Pedagang::class);
    }
}
