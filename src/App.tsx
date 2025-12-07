import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Overview from './components/Dashboard/Overview';
import ClientDetailsPage from './pages/ClientDetailsPage';
import UnscheduledRequests from './pages/UnscheduledRequests';
import PhotoListPage from './pages/PhotoListPage';
import StaffList from './pages/StaffList';
import SosList from './pages/SosList';
import NoticePage from './pages/NoticePage';
import TeamsList from './pages/TeamList';
import VehicleManagement from './pages/VehicleManagement';
import ClientsList from './pages/ClientsPage';
import ClaimsPage from './pages/ClaimsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout/Layout';
import { useAuth } from './contexts/AuthContext';
import PendingRequests from './pages/PendingRequests';
import Runs from './pages/Runs';
import InTransitRequests from './pages/InTransitRequests';
import AddClientPage from './pages/AddClientPage';
import ClientBranchesPage from './pages/ClientBranchesPage';
import DailyRuns from './pages/DailyRuns';
import DoneRequestsPage from './pages/DoneRequestsPage';
import DoneDetailsPage from './pages/DoneDetailsPage';
import DateRequestsPage from './pages/DateRequestsPage';
import { SosProvider } from './contexts/SosContext';

// Development cache clearing helper
const DevCacheHelper = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Add keyboard shortcut to clear cache (Ctrl+Shift+R)
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
          console.log('Clearing all caches...');
          if ('caches' in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
            });
          }
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return null;
};

// Protected route wrapper
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  
  // Wait for auth state to initialize before checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Redirect authenticated users away from login
const LoginRoute = () => {
  const { user, isLoading } = useAuth();

  // Wait for auth state to initialize before checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
};

// Dashboard layout wrapper
const DashboardWrapper = () => {
  return (
    <Layout>
      <DashboardLayout />
    </Layout>
  );
};

const App = () => {
  return (
    <SosProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginRoute />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardWrapper />}>
            <Route path="/" element={<UnscheduledRequests />} />
            <Route path="/dashboard" element={<UnscheduledRequests />} />
            <Route path="/dashboard/unscheduled" element={<UnscheduledRequests />} />
            <Route path="/dashboard/pending" element={<PendingRequests />} />
            <Route path="/dashboard/in-transit" element={<InTransitRequests />} />
            <Route path="/dashboard/clients/:id" element={<ClientDetailsPage />} />
            <Route path="/dashboard/photo-list" element={<PhotoListPage />} />
            <Route path="/dashboard/staff-list" element={<StaffList/>} />
            <Route path="/dashboard/sos-list" element={<SosList/>} />
            <Route path="/dashboard/notices" element={<NoticePage/>} />
            <Route path="/dashboard/daily" element={<DailyRuns/>} />
            <Route path="/dashboard/done-requests" element={<DoneRequestsPage/>} />
            <Route path="/dashboard/done-details/:date" element={<DoneDetailsPage/>} />
            <Route path="/dashboard/teams-list" element={<TeamsList/>} />
            <Route path="/dashboard/vehicle-management" element={<VehicleManagement/>} />
            <Route path="/dashboard/clients-list" element={<ClientsList/>} />
            <Route path="/dashboard/claims" element={<ClaimsPage />} />
            <Route path="/dashboard/runs" element={<Runs />} />
            <Route path="/dashboard/reports" element={<ReportsPage />} />
            <Route path="/dashboard/clients/add" element={<AddClientPage />} />
            <Route path="/dashboard/clients/:id/branches" element={<ClientBranchesPage />} />
            <Route path="/dashboard/date-requests/:date" element={<DateRequestsPage />} />
          </Route>
          
          <Route path="/settings" element={
            <Layout>
              <SettingsPage />
            </Layout>
          } />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevCacheHelper />
    </SosProvider>
  );
};

export default App;