import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SetupUjian from './pages/SetupUjian';
import UjianEngine from './pages/UjianEngine';
import ReviewSesi from './pages/ReviewSesi';
import Statistik from './pages/Statistik';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup-ujian" element={<SetupUjian />} />
        <Route path="/ujian/:sessionId" element={<UjianEngine />} />
        <Route path="/review/:sessionId" element={<ReviewSesi />} />
        <Route path="/statistik" element={<Statistik />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
