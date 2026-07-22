import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './stores/authStore';
import { initTheme } from './stores/themeStore';
import { useBackButton } from './hooks/useBackButton';
import { CustomerLayout } from './layouts/CustomerLayout';
import PublicLayout from './layouts/PublicLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { CarsPage } from './pages/CarsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { RequestDetailPage } from './pages/RequestDetailPage';
import ChatPage from './pages/ChatPage';
import ChatsPage from './pages/ChatsPage';
import { NewRequestPage } from './pages/NewRequestPage';
import { InspectionReportPage } from './pages/InspectionReportPage';
import { PaymentPage } from './pages/PaymentPage';
import { RatingPage } from './pages/RatingPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { WorkshopsPage } from './pages/WorkshopsPage';
import { WorkshopDetailPage } from './pages/WorkshopDetailPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { BrowseServicesPage } from './pages/BrowseServicesPage';
import InvoicesHistoryPage from './pages/InvoicesHistoryPage';
import CarHistoryPage from './pages/CarHistoryPage';
import OffersPage from './pages/OffersPage';
import ProtectedRoute from './components/guards/ProtectedRoute';
import GuestRoute from './components/guards/GuestRoute';
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
    <GoogleOAuthProvider clientId={googleClientId || ''}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BackButtonHandler />
        <AuthInit>
          <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #334155', fontFamily: 'Cairo, sans-serif' } }} />
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
        </AuthInit>
      </BrowserRouter>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
