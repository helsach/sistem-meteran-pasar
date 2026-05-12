# ⚡ Si-Maru - Sistem Meteran Pasar Waru Indah

Si-Maru adalah aplikasi berbasis web yang dirancang khusus untuk mempermudah pencatatan dan manajemen pemakaian listrik pedagang di Pasar Waru Indah. Aplikasi ini menggantikan pencatatan manual agar lebih akurat, cepat, dan profesional.

## ✨ Fitur Utama
- **Dashboard Responsive**: Bisa diakses dengan lancar melalui HP maupun Laptop.
- **Manajemen Pedagang**: Tambah dan kelola data pedagang (Nama, No. Registrasi, Daya/Watt).
- **Pencatatan Otomatis**: Input meter akhir bulan ini, dan sistem akan otomatis mengambil meter awal dari data bulan sebelumnya.
- **Export Excel**: Menghasilkan laporan Excel yang rapi dengan garis (border) dan format judul yang sesuai standar operasional pasar.
- **Sistem Keamanan**: Dilengkapi dengan fitur Login untuk menjaga keamanan data.
- **Notifikasi Modern**: Menggunakan Toast notification yang halus (bukan alert jadul).

## 🛠️ Teknologi yang Digunakan
### Backend:
- **Laravel 11**: Sebagai API Server.
- **MySQL**: Untuk penyimpanan database.
- **Sanctum**: Untuk proteksi API (Sistem Login).

### Frontend:
- **React.js + Vite**: Untuk antarmuka yang cepat dan modern.
- **Tailwind CSS**: Untuk desain UI yang bersih dan responsive.
- **ExcelJS**: Untuk generate laporan Excel berstandar tinggi.
- **React Hot Toast**: Untuk notifikasi aplikasi.

## 🚀 Cara Menjalankan Project

### 1. Persiapan Database
- Buat database baru bernama `sistem_meteran` di MySQL/Laragon kamu.

### 2. Konfigurasi Backend
```bash
cd backend
composer install
cp .env.example .env  # Atur konfigurasi database di sini
php artisan key:generate
php artisan migrate
php artisan serve