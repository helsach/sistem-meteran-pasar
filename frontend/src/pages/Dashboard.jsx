import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

function Dashboard() {
    const navigate = useNavigate();
    const [pedagangs, setPedagangs] = useState([]);
    const [pencatatans, setPencatatans] = useState([]);
    
    // State Filter Waktu & Pencarian
    const [bulan, setBulan] = useState(new Date().getMonth() + 1); 
    const [tahun, setTahun] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState(''); // State untuk teks pencarian

    // State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Jumlah pedagang per halaman

    // State Modals (Tetap sama)
    const [isPedagangModalOpen, setIsPedagangModalOpen] = useState(false);
    const [isSubmittingPedagang, setIsSubmittingPedagang] = useState(false);
    const [pedagangForm, setPedagangForm] = useState({ nama: '', no_reg: '', watt: '' });

    const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
    const [isSubmittingMeter, setIsSubmittingMeter] = useState(false);
    const [selectedPedagang, setSelectedPedagang] = useState(null);
    const [meterForm, setMeterForm] = useState({ catatanId: null, meter_awal: '', meter_akhir: '' });

    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const fetchData = async () => {
        try {
            const [resPedagang, resPencatatan] = await Promise.all([
                api.get('/pedagangs'),
                api.get('/pencatatans', { params: { bulan, tahun } })
            ]);
            setPedagangs(resPedagang.data);
            setPencatatans(resPencatatan.data);
            // Reset ke halaman 1 tiap kali ganti bulan/tahun
            setCurrentPage(1);
        } catch (error) {
            console.error("Gagal mengambil data", error);
            if (error.response?.status === 401) handleLogout();
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/logout');
            localStorage.removeItem('token');
            navigate('/');
        } catch (error) {
            localStorage.removeItem('token');
            navigate('/');
        }
    };

    const handleTambahPedagang = async (e) => {
        e.preventDefault();
        setIsSubmittingPedagang(true);
        try {
            await api.post('/pedagangs', pedagangForm);
            setIsPedagangModalOpen(false);
            setPedagangForm({ nama: '', no_reg: '', watt: '' });
            fetchData(); 
            toast.success("Pedagang berhasil ditambahkan.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menambahkan pedagang.");
        } finally {
            setIsSubmittingPedagang(false);
        }
    };

    const handleBukaMeteran = async (pedagang) => {
        setSelectedPedagang(pedagang);
        
        // 1. Cek apakah bulan ini sudah ada catatannya
        const catatanBulanIni = pencatatans.find(p => p.pedagang_id === pedagang.id);
        
        if (catatanBulanIni) {
            // Kalau sudah ada, berarti mode EDIT
            setMeterForm({
                catatanId: catatanBulanIni.id,
                meter_awal: catatanBulanIni.meter_awal,
                meter_akhir: catatanBulanIni.meter_akhir || ''
            });
        } else {
            // Kalau belum ada, berarti mode INPUT BARU
            // Kita cari "Meter Akhir" dari bulan lalu secara otomatis
            let prevBulan = bulan - 1;
            let prevTahun = tahun;
            
            // Handle kalau sekarang Januari, berarti bulan lalunya Desember tahun kemarin
            if (prevBulan === 0) {
                prevBulan = 12;
                prevTahun -= 1;
            }

            let defaultAwal = 0; // Default kalau tidak ada data sama sekali
            try {
                // Panggil API untuk cek data bulan lalu
                const resPrev = await api.get('/pencatatans', { params: { bulan: prevBulan, tahun: prevTahun } });
                const catatanBulanLalu = resPrev.data.find(p => p.pedagang_id === pedagang.id);
                
                if (catatanBulanLalu && catatanBulanLalu.meter_akhir) {
                    // Meter Akhir bulan lalu jadi Meter Awal bulan ini
                    defaultAwal = catatanBulanLalu.meter_akhir;
                }
            } catch (error) { 
                console.error("Gagal ambil data bulan lalu", error); 
            }

            setMeterForm({ 
                catatanId: null, 
                meter_awal: defaultAwal, 
                meter_akhir: '' 
            });
        }
        setIsMeterModalOpen(true);
    };

    const handleSimpanMeteran = async (e) => {
        e.preventDefault();

        const awal = parseInt(meterForm.meter_awal);
        const akhir = parseInt(meterForm.meter_akhir);

        // Validasi: Meter Akhir tidak boleh lebih kecil dari Meter Awal
        if (akhir < awal) {
            toast.error(`Meter akhir (${akhir}) tidak boleh lebih kecil dari meter awal (${awal})!`);
            return;
        }

        setIsSubmittingMeter(true);
        try {
            if (meterForm.catatanId) {
                await api.put(`/pencatatans/${meterForm.catatanId}`, { 
                    meter_akhir: akhir // Kirim sebagai angka yang sudah bersih
                });
            } else {
                const response = await api.post('/pencatatans', {
                    pedagang_id: selectedPedagang.id,
                    periode_bulan: bulan,
                    periode_tahun: tahun,
                    meter_awal: awal
                });
                if (meterForm.meter_akhir) {
                    await api.put(`/pencatatans/${response.data.data.id}`, { 
                        meter_akhir: akhir 
                    });
                }
            }
            setIsMeterModalOpen(false);
            fetchData(); 
            toast.success('Data meteran berhasil disimpan!');
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal menyimpan data.");
        } finally {
            setIsSubmittingMeter(false);
        }
    };

    const handleExportExcel = async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Meteran ${namaBulan[bulan-1]} ${tahun}`);

        // 1. Tambah Judul
        const titleRow = worksheet.addRow(["DAFTAR NAMA PEDAGANG LISTRIK PASAR WARU INDAH"]);
        const periodRow = worksheet.addRow([`${namaBulan[bulan-1].toUpperCase()} ${tahun}`]);
        worksheet.addRow([]); // Baris kosong

        // 2. Tambah Header Tabel
        const headerRow = worksheet.addRow(["NO", "NAMA", "NO REG", "WATT", "METER AWAL", "METER AKHIR", "JUMLAH"]);

        // 3. Tambah Data Pedagang
        pedagangs.forEach((pedagang, index) => {
            const catatan = pencatatans.find(p => p.pedagang_id === pedagang.id);
            worksheet.addRow([
                index + 1,
                pedagang.nama,
                pedagang.no_reg,
                pedagang.watt || '-',
                catatan ? catatan.meter_awal : '-',
                (catatan && catatan.meter_akhir) ? catatan.meter_akhir : '-',
                (catatan && catatan.jumlah != null) ? catatan.jumlah : '-'
            ]);
        });

        // 4. STYLING (Garis, Font, Alignment)
        
        // Merge Judul (Kolom A sampai G)
        worksheet.mergeCells('A1:G1');
        worksheet.mergeCells('A2:G2');

        // Styling Judul & Header
        [1, 2, 3].forEach(rowNum => {
            const row = worksheet.getRow(rowNum);
            row.eachCell((cell) => {
                cell.font = { bold: true, name: 'Calibri', size: 11 };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
        });

        // Atur Lebar Kolom
        worksheet.columns = [
            { width: 5 },  // NO
            { width: 35 }, // NAMA
            { width: 15 }, // NO REG
            { width: 10 }, // WATT
            { width: 15 }, // METER AWAL
            { width: 15 }, // METER AKHIR
            { width: 15 }, // JUMLAH
        ];

        // Kasih Garis Pembatas (Border) ke semua sel yang ada datanya
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber >= 4) { // Mulai dari header tabel ke bawah
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    // Khusus kolom Nama rata kiri, sisanya tengah
                    cell.alignment = { 
                        vertical: 'middle', 
                        horizontal: cell.column === 2 ? 'left' : 'center' 
                    };
                });
            }
        });

        // 5. Generate & Download
        const buffer = await workbook.xlsx.writeBuffer();
        const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, `Laporan_Meteran_${namaBulan[bulan-1]}_${tahun}.xlsx`);
        
        toast.success('Excel berhasil diunduh!');
    } catch (error) {
        console.error(error);
        toast.error('Gagal membuat file Excel.');
    }
};

    // LOGIC UNTUK SEARCH & PAGINATION
    // 1. Filter pedagang berdasarkan Search Query
    const filteredPedagangs = useMemo(() => {
        return pedagangs.filter(p => 
            p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.no_reg.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [pedagangs, searchQuery]);

    // 2. Hitung total halaman
    const totalPages = Math.ceil(filteredPedagangs.length / itemsPerPage);

    // 3. Potong array pedagang sesuai halaman saat ini (0-9, 10-19, dst)
    const currentPedagangs = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filteredPedagangs.slice(indexOfFirstItem, indexOfLastItem);
    }, [filteredPedagangs, currentPage, itemsPerPage]);

    // Efek ketika ngetik di kotak search, otomatis balik ke halaman 1
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        fetchData();
    }, [bulan, tahun]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans relative flex flex-col">
            {/* Header Responsive (Tetap) */}
            <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Si-Maru</h1>
                                <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Sistem Meteran Pasar Waru Indah</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="sm:hidden text-gray-400 hover:text-red-600 p-2 rounded-xl bg-gray-50 border border-gray-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
                        <div className="flex flex-1 sm:flex-none items-center bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                            <select value={bulan} onChange={(e) => setBulan(parseInt(e.target.value))} className="bg-transparent w-full text-sm font-bold text-gray-700 outline-none cursor-pointer pl-2 pr-1 py-1.5 appearance-none">
                                {namaBulan.map((nama, index) => <option key={index + 1} value={index + 1}>{nama}</option>)}
                            </select>
                            <div className="w-px h-5 bg-gray-300 mx-1"></div>
                            <select value={tahun} onChange={(e) => setTahun(parseInt(e.target.value))} className="bg-transparent w-full text-sm font-bold text-gray-700 outline-none cursor-pointer pl-2 pr-1 py-1.5 appearance-none">
                                {[2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100">
                            Keluar
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
                {/* Bagian Judul & Tombol Aksi */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-8 gap-4">
                    <div className="w-full md:w-auto">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                            Catatan: {namaBulan[bulan - 1]} {tahun}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Meter awal terhubung otomatis dengan bulan sebelumnya.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                        {/* KOTAK PENCARIAN (SEARCH) */}
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text" 
                                placeholder="Cari nama / no reg..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                            <button onClick={handleExportExcel} className="flex-1 sm:flex-none justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            
                            <button onClick={() => setIsPedagangModalOpen(true)} className="flex-[2] sm:flex-none justify-center bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-[0.98]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                Tambah
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto pb-2">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider w-16 whitespace-nowrap">No</th>
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Identitas Pedagang</th>
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Watt</th>
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Awal</th>
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Akhir</th>
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-blue-600 uppercase tracking-wider text-right bg-blue-50/50 whitespace-nowrap">Pemakaian</th>
                                    <th className="py-4 px-4 sm:px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentPedagangs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-16 text-center">
                                            <p className="text-gray-400 font-medium">
                                                {searchQuery ? 'Pedagang tidak ditemukan.' : 'Belum ada data pedagang.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentPedagangs.map((pedagang, index) => {
                                        const catatan = pencatatans.find(p => p.pedagang_id === pedagang.id);
                                        // Rumus penomoran biar halaman 2 mulainya dari 11, bukan 1 lagi
                                        const nomorUrut = (currentPage - 1) * itemsPerPage + index + 1;
                                        return (
                                            <tr key={pedagang.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="py-4 px-4 sm:px-6 text-sm font-medium text-gray-400">{nomorUrut}</td>
                                                <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{pedagang.nama}</span>
                                                        <span className="text-xs font-semibold text-gray-500 mt-0.5">{pedagang.no_reg}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">{pedagang.watt || '-'} W</span>
                                                </td>
                                                <td className="py-4 px-4 sm:px-6 text-sm text-gray-600 font-mono font-medium text-right whitespace-nowrap">{catatan ? catatan.meter_awal : '-'}</td>
                                                <td className="py-4 px-4 sm:px-6 text-sm text-gray-600 font-mono font-medium text-right whitespace-nowrap">{catatan && catatan.meter_akhir ? catatan.meter_akhir : '-'}</td>
                                                <td className="py-4 px-4 sm:px-6 text-sm font-bold text-blue-700 font-mono text-right bg-blue-50/30 whitespace-nowrap">{catatan && catatan.jumlah != null ? catatan.jumlah : '-'}</td>
                                                <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                                                    <button 
                                                        onClick={() => handleBukaMeteran(pedagang)} 
                                                        className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 ${
                                                            catatan 
                                                            ? 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50' 
                                                            : 'text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white'
                                                        }`}
                                                    >
                                                        {catatan ? 'Edit Data' : 'Isi Meteran'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {filteredPedagangs.length > itemsPerPage && (
                        <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-xs font-medium text-gray-500 text-center sm:text-left">
                                Menampilkan <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, filteredPedagangs.length)}</span> dari <span className="font-bold text-gray-900">{filteredPedagangs.length}</span> pedagang
                            </p>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                                        currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 shadow-sm'
                                    }`}
                                >
                                    Sebelumnya
                                </button>
                                
                                {/* Indikator Halaman */}
                                <div className="hidden sm:flex items-center justify-center px-4 font-bold text-sm text-gray-700">
                                    {currentPage} / {totalPages}
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                                        currentPage === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 shadow-sm'
                                    }`}
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL TAMBAH PEDAGANG (Tetap sama) */}
            {isPedagangModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsPedagangModalOpen(false)}></div>
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-extrabold text-gray-900">Pedagang Baru</h3>
                            <button onClick={() => setIsPedagangModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <form onSubmit={handleTambahPedagang} className="space-y-5">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap</label><input type="text" required placeholder="Contoh: Bpk. Roechani" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" value={pedagangForm.nama} onChange={e => setPedagangForm({...pedagangForm, nama: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor Registrasi</label><input type="text" required placeholder="Contoh: 0092" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" value={pedagangForm.no_reg} onChange={e => setPedagangForm({...pedagangForm, no_reg: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Daya Listrik (Watt)</label><input type="number" placeholder="Contoh: 450" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" value={pedagangForm.watt} onChange={e => setPedagangForm({...pedagangForm, watt: e.target.value})} /></div>
                                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 pt-2 pb-2">
                                    <button type="button" onClick={() => setIsPedagangModalOpen(false)} className="w-full sm:w-auto flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" disabled={isSubmittingPedagang} className="w-full sm:w-auto flex-1 px-4 py-3 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl shadow-md active:scale-[0.98] transition-all">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CATAT METERAN (Tetap sama) */}
            {isMeterModalOpen && selectedPedagang && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMeterModalOpen(false)}></div>
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-blue-600 shrink-0">
                            <div>
                                <h3 className="text-lg font-extrabold text-white">Input Meteran</h3>
                                <p className="text-xs text-blue-100 font-medium mt-0.5">{selectedPedagang.nama} &bull; {namaBulan[bulan-1]} {tahun}</p>
                            </div>
                            <button onClick={() => setIsMeterModalOpen(false)} className="text-blue-100 hover:text-white p-1 rounded-full hover:bg-blue-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6">
                            <form onSubmit={handleSimpanMeteran} className="space-y-5">
                                <div><label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between"><span>Meter Awal</span><span className="text-gray-400 font-normal text-xs">(Bulan lalu)</span></label><input type="number" required disabled={meterForm.catatanId !== null} className={`w-full px-4 py-3 border rounded-xl text-lg font-mono font-medium outline-none transition-all ${meterForm.catatanId ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'}`} value={meterForm.meter_awal} onChange={(e) => setMeterForm({...meterForm, meter_awal: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Meter Akhir (Bulan Ini)</label><input type="number" className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-lg font-mono font-bold text-blue-900 placeholder-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" placeholder="0" value={meterForm.meter_akhir} onChange={(e) => setMeterForm({...meterForm, meter_akhir: e.target.value})} /></div>
                                {meterForm.meter_awal && meterForm.meter_akhir && (
                                    <div className="mt-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center"><span className="text-sm font-bold text-emerald-800">Total Pemakaian</span><div className="text-right"><span className="text-2xl font-extrabold text-emerald-600 font-mono">{meterForm.meter_akhir - meterForm.meter_awal}</span><span className="text-sm font-bold text-emerald-600 ml-1">kWh</span></div></div>
                                )}
                                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-2 pb-2">
                                    <button type="button" onClick={() => setIsMeterModalOpen(false)} className="w-full sm:w-auto flex-1 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" disabled={isSubmittingMeter} className="w-full sm:w-auto flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all">{isSubmittingMeter ? 'Menyimpan...' : 'Simpan Data'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;