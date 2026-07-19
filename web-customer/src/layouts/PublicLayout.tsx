import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, LogIn, ChevronRight, Check, X } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useCustomerWebSocket } from '../hooks/useCustomerWebSocket';
import { useCallSignaling } from '../hooks/useCallSignaling';
import { useCallStore } from '../stores/callStore';
import { useGuestGuard } from '../hooks/useGuestGuard';
import LoginBottomSheet from '../components/LoginBottomSheet';
import BottomNav from '../components/BottomNav';
import CallOverlay from '../components/CallOverlay';
import IncomingCallDialog from '../components/IncomingCallDialog';
import AIAssistant from '../components/AIAssistant';

const PAGE_TITLES: Record<string, string> = {
  '/services': 'الخدمات',
  '/workshops': 'الورش',
};

export default function PublicLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { showLoginSheet, closeSheet, requireAuth, pendingMessage } = useGuestGuard();
  const [searchFocused, setSearchFocused] = useState(false);
  const isSubPage = location.pathname !== '/';
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useCustomerWebSocket();
  const { answerCall, rejectCall, hangUp, toggleMute } = useCallSignaling();
  const callState = useCallStore();

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const subTitle = useMemo(() => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    if (path.startsWith('/services/')) return 'تفاصيل الخدمة';
    if (path.startsWith('/workshops/')) return 'تفاصيل الورشة';
    return '';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSubPage && (
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-900 dark:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors active:scale-95"
              >
                <ChevronRight size={22} />
              </button>
            )}
            {!isSubPage && (
              <>
                <img src="/tasaheel-app-icon.png" alt="" className="w-8 h-8 rounded-xl" />
                <span className="font-bold text-lg text-surface-900 dark:text-white">تساهيل</span>
              </>
            )}
            {isSubPage && (
              <span className="font-bold text-base text-surface-900 dark:text-white">{subTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-xs font-bold"
            >
              {i18n.language === 'ar' ? 'EN' : 'عر'}
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => requireAuth('سجل دخولك لإكمال الطلب')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 transition-colors active:scale-95"
              >
                <LogIn size={14} />
                دخول
              </button>
            )}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-9 h-9 rounded-xl flex items-center justify-center text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent-500 rounded-full border-2 border-white dark:border-surface-950 flex items-center justify-center text-[9px] font-bold text-white px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200/50 dark:border-surface-800/50 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                      <span className="font-bold text-sm text-surface-900 dark:text-white">{t('websocket.panel.title')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-accent-500 font-medium hover:text-accent-600 transition-colors"
                        >
                          {t('websocket.panel.markAllRead')}
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={32} className="mx-auto mb-2 text-surface-300" />
                          <p className="text-sm text-surface-400">{t('websocket.panel.empty')}</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.requestId) {
                                navigate(`/requests/${n.requestId}`);
                                setShowNotifications(false);
                              }
                            }}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-right ${
                              !n.read ? 'bg-accent-500/5 dark:bg-accent-500/5' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              n.type === 'request' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                              n.type === 'payment' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                              'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                            }`}>
                              <Bell size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-surface-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-[11px] text-surface-500 dark:text-surface-400 truncate mt-0.5">{n.body}</p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0 mt-2" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      <BottomNav />
      <LoginBottomSheet isOpen={showLoginSheet} onClose={closeSheet} message={pendingMessage} />
      {location.pathname === '/' && <AIAssistant />}

      <IncomingCallDialog
        isOpen={callState.status === 'ringing' && !callState.isOutgoing}
        callerName={callState.peerName}
        callerRole={callState.peerRole}
        onAccept={answerCall}
        onReject={rejectCall}
      />

      <CallOverlay
        status={callState.status}
        peerName={callState.peerName}
        duration={callState.duration}
        isOutgoing={callState.isOutgoing}
        isMuted={false}
        onHangUp={hangUp}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
