import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './stores/authStore';
import WorkshopLayout from './layouts/WorkshopLayout';
import TechnicianLayout from './layouts/TechnicianLayout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/guards/LoadingScreen';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'));
const PendingApprovalPage = lazy(() => import('./pages/PendingApprovalPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RequestsPage = lazy(() => import('./pages/RequestsPage'));
const RequestDetailPage = lazy(() => import('./pages/RequestDetailPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ChatsPage = lazy(() => import('./pages/ChatsPage'));
const MyQuotesPage = lazy(() => import('./pages/MyQuotesPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const TechniciansPage = lazy(() => import('./pages/TechniciansPage'));
const TechnicianPage = lazy(() => import('./pages/TechnicianPage'));
const TechnicianAccountPage = lazy(() => import('./pages/TechnicianAccountPage'));
const TechnicianRequestDetailPage = lazy(() => import('./pages/TechnicianRequestDetailPage'));
const HomeServicePage = lazy(() => import('./pages/HomeServicePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ProtectedRoute = lazy(() => import('./components/guards/ProtectedRoute'));
const GuestRoute = lazy(() => import('./components/guards/GuestRoute'));

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function PageLoader() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-11 h-11 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

function AuthInit({ children }: { children: React.ReactNode }) {
  const [showOpening, setShowOpening] = React.useState(true);
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

function AppRoutes() {
  if (window.location.hash.includes('access_token') && window.location.pathname !== '/login') {
    window.location.replace('/login' + window.location.hash);
    return null;
  }
  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
    <AuthInit>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/technician" element={<TechnicianLayout />}>
        <Route index element={<TechnicianPage />} />
        <Route path="account" element={<TechnicianAccountPage />} />
        <Route path="requests/:id" element={<TechnicianRequestDetailPage />} />
      </Route>
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/reset-password" element={<SetPasswordPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/" element={<WorkshopLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="requests/:requestId/chat" element={<ChatPage />} />
        <Route path="chats" element={<ChatsPage />} />
        <Route path="quotes" element={<MyQuotesPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="technicians" element={<TechniciansPage />} />
        <Route path="home-service" element={<HomeServicePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
    </AuthInit>
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
