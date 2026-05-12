<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pencatatans', function (Blueprint $table) {
            $table->id();
            // Foreign key yang menyambungkan ke tabel pedagangs
            $table->foreignId('pedagang_id')->constrained('pedagangs')->onDelete('cascade');
            $table->string('periode_bulan', 2); // Contoh: "01", "05", "12"
            $table->year('periode_tahun'); // Contoh: 2025
            $table->integer('meter_awal');
            $table->integer('meter_akhir')->nullable(); // Nullable saat awal bulan karena belum dicatat
            $table->integer('jumlah')->nullable(); // Hasil pengurangan akhir - awal
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pencatatans');
    }
};
