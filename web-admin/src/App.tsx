import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/guards/ProtectedRoute';
import GuestRoute from './components/guards/GuestRoute';
import AppErrorBoundary from './components/AppErrorBoundary';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const WorkshopsPage = lazy(() => import('./pages/WorkshopsPage'));
const WorkshopDetailPage = lazy(() => import('./pages/WorkshopDetailPage'));
const DriversPage = lazy(() => import('./pages/DriversPage'));
const DriverDetailPage = lazy(() => import('./pages/DriverDetailPage'));
const TechniciansPage = lazy(() => import('./pages/TechniciansPage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const RequestDetailPage = lazy(() => import('./pages/RequestDetailPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const WorkshopServiceListingsPage = lazy(() => import('./pages/WorkshopServiceListingsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FinancialDashboardPage = lazy(() => import('./pages/FinancialDashboardPage'));
const SettlementsPage = lazy(() => import('./pages/SettlementsPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const JournalEntriesPage = lazy(() => import('./pages/JournalEntriesPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const TestDataResetPage = lazy(() => import('./pages/TestDataResetPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'));

function preloadCommonRoutes() {
  void Promise.allSettled([
    import('./pages/DashboardPage'),
    import('./pages/CustomersPage'),
    import('./pages/WorkshopsPage'),
    import('./pages/RequestsPage'),
    import('./pages/SupportPage'),
  ]);
}

function PageLoader() {
  return (
    <div className="min-h-[45vh] grid place-items-center" role="status" aria-label="جاري تحميل الصفحة">
      <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
    </div>
  );
}

function AuthInit({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);
  useEffect(() => { setLoading(false); }, [setLoading]);
  useEffect(() => {
    const preloadTimer = window.setTimeout(preloadCommonRoutes, 1000);
    return () => window.clearTimeout(preloadTimer);
  }, []);
  if (isLoading) return null;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  if (window.location.hash.includes('access_token') && window.location.pathname !== '/login') {
    window.location.replace('/login' + window.location.hash);
    return null;
  }
  return (
    <AuthInit>
    <AppErrorBoundary resetKey={location.pathname}>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="support" element={<SupportPage />} />
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
        <Route path="test-data-reset" element={<TestDataResetPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </AppErrorBoundary>
    </AuthInit>
  );
}

export default function App() {
  return <AppRoutes />;
}
