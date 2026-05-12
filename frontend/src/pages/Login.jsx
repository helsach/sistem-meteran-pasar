import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); 
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const response = await api.post('/login', { email, password });
            localStorage.setItem('token', response.data.token);
            setTimeout(() => navigate('/dashboard'), 300);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Email atau password salah!');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
            
            {/* Wrapper utama, akan menyesuaikan lebar maksimal 448px di desktop, tapi 100% di HP */}
            <div className="w-full max-w-md flex flex-col items-center">
                
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-5">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    {/* Teks mengecil sedikit di HP biar rapi */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Si-Maru</h2>
                    <p className="mt-2 text-sm text-gray-500 font-medium">Sistem Meteran Pasar Waru Indah</p>
                </div>

                {/* Login Card */}
                {/* Padding mengecil di HP (p-6) tapi tetap lega di Desktop (p-8) */}
                <div className="bg-white w-full p-6 sm:p-8 shadow-sm border border-gray-100 rounded-3xl sm:rounded-2xl">
                    {message && (
                        <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-sm text-red-700 font-medium">{message}</p>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Admin</label>
                            {/* Input lebih tinggi dikit buat touch target jempol */}
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
                                placeholder="admin@gmail.com"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full pl-4 pr-14 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
                                    placeholder="••••••••"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {/* Tombol Mata dengan area klik lebih lebar (p-2) */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-1 flex items-center p-2 my-1 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-4 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2 ${
                                isLoading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-[0.98]'
                            }`}
                        >
                            {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
                        </button>
                    </form>
                </div>
                
                <p className="mt-8 text-xs font-medium text-gray-400">
                    &copy; 2026 Si-Maru - Dikembangkan oleh Helsa Christabel Harsono
                </p>
            </div>
        </div>
    );
}

export default Login;