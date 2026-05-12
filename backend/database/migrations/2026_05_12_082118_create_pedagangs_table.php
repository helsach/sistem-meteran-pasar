<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedagangs', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('no_reg')->unique(); // Dibuat unique agar tidak ada nomor registrasi yang ganda
            $table->integer('watt')->nullable(); // Nullable untuk jaga-jaga kalau data watt belum terisi
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedagangs');
    }
};
