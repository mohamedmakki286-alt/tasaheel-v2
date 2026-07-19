import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import WorkshopsPage from './pages/WorkshopsPage';
import WorkshopDetailPage from './pages/WorkshopDetailPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import TechniciansPage from './pages/TechniciansPage';
import RequestsPage from './pages/RequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import ServicesPage from './pages/ServicesPage';
import WorkshopServiceListingsPage from './pages/WorkshopServiceListingsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import SettlementsPage from './pages/SettlementsPage';
import AccountsPage from './pages/AccountsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import OffersPage from './pages/OffersPage';
import ProtectedRoute from './components/guards/ProtectedRoute';
import GuestRoute from './components/guards/GuestRoute';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AuthInit({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);
  useEffect(() => { setLoading(false); }, [setLoading]);
  if (isLoading) return null;
  return <>{children}</>;
}

function AppRoutes() {
  if (window.location.hash.includes('access_token') && window.location.pathname !== '/login') {
    window.location.replace('/login' + window.location.hash);
    return null;
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
    <AuthInit>
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="workshops" element={<WorkshopsPage />} />
        <Route path="workshops/:id" element={<WorkshopDetailPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="drivers/:id" element={<DriverDetailPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="financial" element={<FinancialDashboardPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="settlements" element={<SettlementsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="journal-entries" element={<JournalEntriesPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="workshop-services" element={<WorkshopServiceListingsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
    </AuthInit>
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return <AppRoutes />;
}
