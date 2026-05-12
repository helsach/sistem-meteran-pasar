<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pedagang extends Model
{
    use HasFactory;

    // Kolom apa saja yang boleh diisi (Mass Assignment)
    protected $fillable = ['nama', 'no_reg', 'watt'];

    // Relasi One-to-Many ke tabel Pencatatan
    public function pencatatans()
    {
        return $this->hasMany(Pencatatan::class);
    }
}
