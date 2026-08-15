import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Car, ClipboardList, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';
import LoginBottomSheet from './LoginBottomSheet';
import { useTranslation } from 'react-i18next';

const tabs = [
  { path: '/', icon: Home, labelKey: 'layout.sidebar.home', auth: false },
  { path: '/services', icon: LayoutGrid, labelKey: 'layout.sidebar.browseServices', auth: false },
  { path: '/vehicles', icon: Car, labelKey: 'layout.sidebar.cars', auth: true },
  { path: '/orders', icon: ClipboardList, labelKey: 'layout.sidebar.requests', auth: true },
  { path: '/account', icon: User, labelKey: 'pages.settings.title', auth: true },
];

export default function BottomNav() {
  const { t, i18n } = useTranslation();
  const tr = (ar: string, en: string) => i18n.language.startsWith('en') ? en : ar;
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMessage, setSheetMessage] = useState('');

  const handleTab = (tab: typeof tabs[0]) => {
    if (tab.auth && !isAuthenticated) {
      const messages: Record<string, string> = {
        '/vehicles': tr('سجل دخولك لإدارة سياراتك', 'Sign in to manage your cars'),
        '/orders': tr('سجل دخولك لعرض طلباتك', 'Sign in to view your requests'),
        '/account': tr('سجل دخولك لإدارة حسابك', 'Sign in to manage your account'),
      };
      setSheetMessage(messages[tab.path] || tr('سجل دخولك لإكمال الطلب', 'Sign in to continue'));
      setShowSheet(true);
      return;
    }
    navigate(tab.path);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 shadow-nav safe-area-pb">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => handleTab(tab)}
                className="relative flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px]"
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={`transition-colors duration-200 ${
                      active ? 'text-brand' : 'text-surface-400 dark:text-surface-500'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  active ? 'text-brand' : 'text-surface-400 dark:text-surface-500'
                }`}>
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <LoginBottomSheet isOpen={showSheet} onClose={() => setShowSheet(false)} message={sheetMessage} />
    </>
  );
}
