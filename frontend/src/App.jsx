import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast'; 

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    return (
      <>
        <Toaster position="top-right" reverseOrder={false} /> {/* Komponen untuk menampilkan notifikasi */}
        <Router>
            <Routes>
                {/* Rute Halaman Login */}
                <Route path="/" element={<Login />} />
                
                {/* Rute Halaman Dashboard (Dilindungi) */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
      </>
    );
  
}

export default App;