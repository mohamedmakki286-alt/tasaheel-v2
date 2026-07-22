import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ClipboardList,
  FileSignature,
  Star,
  UserCircle,
  LogOut,
  Bell,
  Menu,
  X,
  Wrench,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageCircle,
  Users,
  Home,
  Receipt,
  Gift,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationStore, NotificationItem } from '../stores/notificationStore';
import { useWorkshopWebSocket } from '../hooks/useWorkshopWebSocket';
import { useBackButton } from '../hooks/useBackButton';
import Avatar from '../components/Avatar';
import AIAssistant from '../components/AIAssistant';
import UnifiedCallHost from '@shared/call/UnifiedCallHost';
import apiClient from '../api/client';

export default function WorkshopLayout() {
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { workshop, logout, isAuthenticated } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();

  useWorkshopWebSocket();
  useBackButton();

  if (workshop?.isApproved === false && location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (!workshop && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  const sidebarLinks = [
    { path: '/dashboard', label: t('layout.sidebar.dashboard'), icon: LayoutDashboard },
    { path: '/requests', label: t('layout.sidebar.requests'), icon: ClipboardList },
    { path: '/chats', label: 'المحادثات', icon: MessageCircle },
    { path: '/invoices', label: t('layout.sidebar.invoices'), icon: Receipt },
    { path: '/quotes', label: t('layout.sidebar.quotes'), icon: FileSignature },
    { path: '/services', label: t('layout.sidebar.myServices'), icon: Wrench },
    { path: '/offers', label: 'الباقات والعروض', icon: Gift },
    { path: '/home-service', label: t('layout.sidebar.homeService'), icon: Home },
    { path: '/technicians', label: t('layout.sidebar.technicians'), icon: Users },
    { path: '/reviews', label: t('layout.sidebar.reviews'), icon: Star },
    { path: '/profile', label: t('layout.sidebar.profile'), icon: UserCircle },
  ];

  const bottomNavLinks = [
    { path: '/dashboard', label: t('layout.bottomNav.home'), icon: LayoutDashboard },
    { path: '/requests', label: t('layout.bottomNav.requests'), icon: ClipboardList },
    { path: '/chats', label: 'المحادثات', icon: MessageCircle },
    { path: '/services', label: t('layout.bottomNav.services'), icon: Wrench },
    { path: '/quotes', label: t('layout.bottomNav.quotes'), icon: FileSignature },
    { path: '/profile', label: t('layout.bottomNav.account'), icon: UserCircle },
  ];

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('layout.timeAgo.now');
    if (mins < 60) return t('layout.timeAgo.minutes', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('layout.timeAgo.hours', { count: hours });
    const days = Math.floor(hours / 24);
    return t('layout.timeAgo.days', { count: days });
  }

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLogout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try { await apiClient.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/requests') return location.pathname.startsWith('/requests');
    if (path === '/home-service') return location.pathname.startsWith('/home-service');
    if (path === '/technicians') return location.pathname.startsWith('/technicians');
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex transition-colors duration-200">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-72 bg-white dark:bg-surface-900 border-l border-surface-200 dark:border-surface-800 z-50 transform transition-all duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-surface-100 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/tasaheel-app-icon.png" alt="" className="w-11 h-11 rounded-2xl shrink-0 shadow-lg" />
                <div>
                  <h1 className="font-bold text-surface-900 dark:text-surface-100 text-lg leading-tight">{workshop?.name || t('common.appName')}</h1>
                  <p className="text-[11px] text-surface-400 font-medium">{t('common.appSubtitle')}</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="px-3 mt-3">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder={t('layout.header.search')}
                className="w-full bg-surface-100 dark:bg-surface-800 rounded-xl py-2 pr-9 pl-3 text-sm text-surface-700 dark:text-surface-200 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
            {sidebarLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={isActive(link.path) ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <link.icon size={20} strokeWidth={isActive(link.path) ? 2.5 : 2} />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-surface-100 dark:border-surface-800">
            <button onClick={handleLogout} className={`sidebar-link w-full ${isAuthenticated ? 'text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 hover:text-danger-600' : 'text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 hover:text-accent-600'}`}>
              {isAuthenticated ? <LogOut size={20} /> : <UserCircle size={20} />}
              <span>{isAuthenticated ? t('layout.header.logout') : t('common.login')}</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <Menu size={22} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-surface-400 dark:text-surface-500">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse-slow" />
                <span>{t('layout.header.online')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all text-sm"
              >
                <Globe size={16} />
                <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="relative p-2.5 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-accent-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-accent-500/30">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-800 z-50 animate-scale-in overflow-hidden">
                      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                        <p className="text-sm font-bold text-surface-900 dark:text-surface-100">{t('layout.header.notifications')}</p>
                        <span className="text-xs text-surface-400">{unreadCount} {t('layout.header.unread')}</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-surface-400 dark:text-surface-500">
                            {t('layout.header.noNotifications')}
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => { markAsRead(n.id); setShowNotifications(false); if (n.requestId) navigate(`/requests/${n.requestId}`); }}
                              className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                                n.read
                                  ? 'hover:bg-surface-50 dark:hover:bg-surface-800'
                                  : 'bg-accent-50/50 dark:bg-accent-500/5 hover:bg-accent-50 dark:hover:bg-accent-500/10'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                n.type === 'request' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                n.type === 'quote' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              }`}>
                                {n.type === 'request' && <ClipboardList className="w-4 h-4" />}
                                {n.type === 'quote' && <DollarSign className="w-4 h-4" />}
                                {n.type === 'review' && <Star className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{n.title}</p>
                                {n.body && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{n.body}</p>}
                                <p className="text-[10px] text-surface-400 dark:text-surface-500 mt-1">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-2" />}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-sm text-accent-500 hover:text-accent-600 font-medium">
                            {t('layout.header.markAllRead')}
                          </button>
                        )}
                        <Link to="/requests" onClick={() => setShowNotifications(false)} className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 font-medium mr-auto">
                          {t('layout.header.viewAll')}
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pr-3 border-r border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-xl py-1.5 pl-2 transition-colors"
                >
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 leading-tight">{workshop?.name || t('layout.header.workshop')}</p>
                    <p className="text-[11px] text-surface-400 dark:text-surface-500">{workshop?.city || ''}</p>
                  </div>
                  <Avatar name={workshop?.name} size="md" />
                  <ChevronDown size={14} className="text-surface-400 dark:text-surface-500 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-800 z-50 py-2 animate-scale-in">
                      <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                        <p className="text-sm font-bold text-surface-900 dark:text-surface-100">{workshop?.name || t('common.guest')}</p>
                        <p className="text-xs text-surface-400 dark:text-surface-500">{workshop?.phone || ''}</p>
                      </div>
                      <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                        <UserCircle size={18} />
                        {t('layout.header.profile')}
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 w-full transition-colors">
                        <LogOut size={18} />
                        {isAuthenticated ? t('layout.header.logout') : t('common.login')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 lg:hidden safe-area-pb">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {bottomNavLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px]"
              >
                <div className="relative">
                  <link.icon size={22} strokeWidth={active ? 2.5 : 2} className={`transition-colors duration-200 ${active ? 'text-accent-500' : 'text-surface-400 dark:text-surface-500'}`} />
                  {active && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-500" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-accent-500' : 'text-surface-400 dark:text-surface-500'}`}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {location.pathname === '/dashboard' && <AIAssistant />}

      {workshop && useAuthStore.getState().token && (
        <UnifiedCallHost
          userId={workshop.id}
          userName={workshop.name}
          userRole="workshop"
          token={useAuthStore.getState().token || ''}
        />
      )}
    </div>
  );
}
