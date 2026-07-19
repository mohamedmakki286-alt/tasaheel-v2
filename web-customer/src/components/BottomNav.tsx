import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Plus, Car, ClipboardList, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';
import LoginBottomSheet from './LoginBottomSheet';

const tabs = [
  { path: '/', icon: Home, label: 'الرئيسية', auth: false },
  { path: '/services', icon: LayoutGrid, label: 'الخدمات', auth: false },
  { path: '/new-request', icon: Plus, label: 'طلب', auth: true, isCenter: true },
  { path: '/vehicles', icon: Car, label: 'سياراتي', auth: true },
  { path: '/orders', icon: ClipboardList, label: 'طلباتي', auth: true },
  { path: '/account', icon: User, label: 'حسابي', auth: true },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMessage, setSheetMessage] = useState('');

  const handleTab = (tab: typeof tabs[0]) => {
    if (tab.auth && !isAuthenticated) {
      const messages: Record<string, string> = {
        '/new-request': 'سجل دخولك لإنشاء طلب جديد',
        '/vehicles': 'سجل دخولك لإدارة سياراتك',
        '/orders': 'سجل دخولك لعرض طلباتك',
        '/account': 'سجل دخولك لإدارة حسابك',
      };
      setSheetMessage(messages[tab.path] || 'سجل دخولك لإكمال الطلب');
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 safe-area-pb">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;

            if (tab.isCenter) {
              return (
                <button
                  key={tab.path}
                  onClick={() => handleTab(tab)}
                  className="relative -mt-6"
                >
                  <div className="w-14 h-14 rounded-full bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/30 active:scale-95 transition-transform">
                    <Plus size={26} className="text-white" strokeWidth={2.5} />
                  </div>
                </button>
              );
            }

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
                      active ? 'text-accent-500' : 'text-surface-400 dark:text-surface-500'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  active ? 'text-accent-500' : 'text-surface-400 dark:text-surface-500'
                }`}>
                  {tab.label}
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
