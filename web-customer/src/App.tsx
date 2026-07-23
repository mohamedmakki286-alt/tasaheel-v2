import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './stores/authStore';
import { initTheme } from './stores/themeStore';
import { useBackButton } from './hooks/useBackButton';
import { CustomerLayout } from './layouts/CustomerLayout';
import PublicLayout from './layouts/PublicLayout';
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const CarsPage = lazy(() => import('./pages/CarsPage').then(m => ({ default: m.CarsPage })));
const MyRequestsPage = lazy(() => import('./pages/MyRequestsPage').then(m => ({ default: m.MyRequestsPage })));
const RequestDetailPage = lazy(() => import('./pages/RequestDetailPage').then(m => ({ default: m.RequestDetailPage })));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const NewRequestPage = lazy(() => import('./pages/NewRequestPage').then(m => ({ default: m.NewRequestPage })));
const InspectionReportPage = lazy(() => import('./pages/InspectionReportPage').then(m => ({ default: m.InspectionReportPage })));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then(m => ({ default: m.PaymentPage })));
const RatingPage = lazy(() => import('./pages/RatingPage').then(m => ({ default: m.RatingPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const WorkshopsPage = lazy(() => import('./pages/WorkshopsPage').then(m => ({ default: m.WorkshopsPage })));
const WorkshopDetailPage = lazy(() => import('./pages/WorkshopDetailPage').then(m => ({ default: m.WorkshopDetailPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const BrowseServicesPage = lazy(() => import('./pages/BrowseServicesPage').then(m => ({ default: m.BrowseServicesPage })));
const InvoicesHistoryPage = lazy(() => import('./pages/InvoicesHistoryPage'));
const CarHistoryPage = lazy(() => import('./pages/CarHistoryPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
import ProtectedRoute from './components/guards/ProtectedRoute';
import GuestRoute from './components/guards/GuestRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/guards/LoadingScreen';
const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AuthInit({ children }: { children: React.ReactNode }) {
  const [showOpening, setShowOpening] = useState(true);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  useEffect(() => {
    const openingTimer = window.setTimeout(() => setShowOpening(false), 3000);
    return () => window.clearTimeout(openingTimer);
  }, []);
  if (showOpening || isLoading) return <LoadingScreen />;
  return <>{children}</>;
}

function BackButtonHandler() {
  useBackButton();
  return null;
}

export default function App() {
  initTheme();

  return (
    <ErrorBoundary>
    <GoogleOAuthProvider clientId={googleClientId || ''}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BackButtonHandler />
        <AuthInit>
          <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #334155', fontFamily: 'Cairo, sans-serif' } }} />
          <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public routes - guest + auth */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<BrowseServicesPage />} />
              <Route path="services/:id" element={<ServiceDetailPage />} />
              <Route path="workshops" element={<WorkshopsPage />} />
              <Route path="workshops/:id" element={<WorkshopDetailPage />} />
              <Route path="offers" element={<OffersPage />} />
            </Route>

            {/* Auth-only routes */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* Protected routes - auth screen if not logged in */}
            <Route path="/vehicles" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<CarsPage />} />
            </Route>
            <Route path="/vehicles/:carId/history" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<CarHistoryPage />} />
            </Route>
            <Route path="/orders" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<MyRequestsPage />} />
            </Route>
            <Route path="/orders/:id" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<RequestDetailPage />} />
            </Route>
            <Route path="/orders/:requestId/chat" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<ChatPage />} />
            </Route>
            <Route path="/chats" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<ChatsPage />} />
            </Route>
            <Route path="/new-request" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<NewRequestPage />} />
            </Route>
            <Route path="/reports" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<ReportsPage />} />
            </Route>
            <Route path="/invoices" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<InvoicesHistoryPage />} />
            </Route>
            <Route path="/inspection-report/:requestId" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<InspectionReportPage />} />
            </Route>
            <Route path="/payment/:requestId" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<PaymentPage />} />
            </Route>
            <Route path="/rating/:requestId/:workshopId" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<RatingPage />} />
            </Route>
            <Route path="/account" element={<ProtectedRoute requiredRole="customer"><CustomerLayout /></ProtectedRoute>}>
              <Route index element={<SettingsPage />} />
            </Route>

            {/* Legacy routes redirect */}
            <Route path="/app/*" element={<Navigate to="/" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </AuthInit>
      </BrowserRouter>
    </QueryClientProvider>
    </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
