import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DataStoreProvider from './components/DataStoreProvider';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SetupUjian from './pages/SetupUjian';
import UjianEngine from './pages/UjianEngine';
import ReviewSesi from './pages/ReviewSesi';
import Statistik from './pages/Statistik';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import { useStore } from './store/useStore';
import './index.css';
import './landing.css';
import './auth.css';

function AppBootstrap() {
  const syncDailyTargetFromSettings = useStore(s => s.syncDailyTargetFromSettings);
  const checkDayRollover = useStore(s => s.checkDayRollover);

  useEffect(() => {
    checkDayRollover();
    syncDailyTargetFromSettings();
  }, [checkDayRollover, syncDailyTargetFromSettings]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/' || location.pathname === '/auth';

  return (
    <>
      <AppBootstrap />
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup-ujian" element={<SetupUjian />} />
        <Route path="/ujian/:sessionId" element={<UjianEngine />} />
        <Route path="/review/:sessionId" element={<ReviewSesi />} />
        <Route path="/statistik" element={<Statistik />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <DataStoreProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </DataStoreProvider>
  );
}
