import { useState, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useGuestGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('سجل دخولك لإكمال الطلب');

  const requireAuth = useCallback((message?: string) => {
    if (isAuthenticated) return true;
    setPendingMessage(message || 'سجل دخولك لإكمال الطلب');
    setShowLoginSheet(true);
    return false;
  }, [isAuthenticated]);

  const closeSheet = useCallback(() => {
    setShowLoginSheet(false);
  }, []);

  return { isAuthenticated, showLoginSheet, closeSheet, requireAuth, pendingMessage };
}
