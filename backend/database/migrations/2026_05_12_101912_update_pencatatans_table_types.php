<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pencatatans', function (Blueprint $table) {
            // Kita ubah periode_bulan jadi integer agar mudah difilter
            $table->integer('periode_bulan')->change();

            // Kita pastikan meteran adalah integer (sudah benar, tapi ini untuk meyakinkan Schema)
            $table->integer('meter_awal')->change();
            $table->integer('meter_akhir')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('pencatatans', function (Blueprint $table) {
            $table->string('periode_bulan', 2)->change();
        });
    }
};
