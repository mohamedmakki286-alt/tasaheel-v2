import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Truck,
  ClipboardList,
  DollarSign,
  Settings,
  BarChart3,
  Cog,
  LogOut,
  Menu,
  ChevronDown,
  Bell,
  Search,
  ChevronLeft,
  Sun,
  Moon,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  Wallet,
  Receipt,
  ScrollText,
  BookOpen,
  Globe,
  Gift,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useThemeStore } from '../stores/themeStore';
import AIAssistant from '../components/AIAssistant';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [accountingOpen, setAccountingOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  const navItems = [
    { path: '/', label: t('layout.sidebar.dashboard'), icon: LayoutDashboard },
    { path: '/customers', label: t('layout.sidebar.customers'), icon: Users },
    { path: '/workshops', label: t('layout.sidebar.workshops'), icon: Wrench },
    { path: '/drivers', label: t('layout.sidebar.drivers'), icon: Truck },
    { path: '/technicians', label: t('layout.sidebar.technicians'), icon: Wrench },
    { path: '/requests', label: t('layout.sidebar.requests'), icon: ClipboardList },
    { path: '/financial', label: t('layout.sidebar.financial'), icon: Wallet },
    { path: '/services', label: t('layout.sidebar.services'), icon: Settings },
    { path: '/workshop-services', label: t('layout.sidebar.workshopServices', 'خدمات الورش'), icon: Wrench },
    { path: '/offers', label: 'الباقات والعروض', icon: Gift },
    { path: '/reports', label: t('layout.sidebar.reports'), icon: BarChart3 },
    { path: '/settings', label: t('layout.sidebar.settings'), icon: Cog },
  ];
  const accountingItems = [
    { path: '/payments', label: 'سجل التحصيلات', icon: DollarSign },
    { path: '/settlements', label: 'تحويلات الورش', icon: Receipt },
    { path: '/accounts', label: 'شجرة الحسابات', icon: BookOpen },
    { path: '/journal-entries', label: 'قيود اليومية', icon: ScrollText },
  ];

  const breadcrumbMap: Record<string, string> = {
    '/': t('layout.sidebar.dashboard'),
    '/customers': t('layout.sidebar.customers'),
    '/workshops': t('layout.sidebar.workshops'),
    '/drivers': t('layout.sidebar.drivers'),
    '/requests': t('layout.sidebar.requests'),
    '/financial': t('layout.sidebar.financial'),
    '/payments': t('layout.sidebar.payments'),
    '/settlements': t('layout.sidebar.settlements'),
    '/accounts': t('layout.sidebar.accounts'),
    '/journal-entries': t('layout.sidebar.journalEntries'),
    '/services': t('layout.sidebar.services'),
    '/workshop-services': t('layout.sidebar.workshopServices', 'خدمات الورش'),
    '/offers': 'الباقات والعروض',
    '/reports': t('layout.sidebar.reports'),
    '/settings': t('layout.sidebar.settings'),
  };

  const notifications = [
    { id: 1, text: t('layout.notifications.newRequest'), time: t('layout.notifications.timeAgo.5min'), type: 'request', read: false },
    { id: 2, text: t('layout.notifications.newWorkshop'), time: t('layout.notifications.timeAgo.15min'), type: 'workshop', read: false },
    { id: 3, text: t('layout.notifications.paymentCompleted'), time: t('layout.notifications.timeAgo.1hour'), type: 'payment', read: false },
    { id: 4, text: t('layout.notifications.requestCompleted'), time: t('layout.notifications.timeAgo.2hours'), type: 'completed', read: true },
    { id: 5, text: t('layout.notifications.newDriver'), time: t('layout.notifications.timeAgo.3hours'), type: 'driver', read: true },
  ];

  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const breadcrumbs = [
    { label: breadcrumbMap[location.pathname] || breadcrumbMap['/'], path: location.pathname },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-950 flex transition-colors duration-200">
      {mobileSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 right-0 z-40 h-screen transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-[72px]',
          mobileSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
        style={{ background: 'linear-gradient(180deg, #0f1724 0%, #0c131e 100%)' }}
      >
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className={clsx('flex items-center gap-3', !sidebarOpen && 'justify-center w-full')}>
            <img src="/tasaheel-app-icon.png" alt="" className="w-9 h-9 rounded-xl shrink-0 shadow-lg shadow-black/30" />
            {sidebarOpen && (
              <div>
                <span className="font-bold text-white text-sm block leading-tight">{t('common.appName')}</span>
                <span className="text-[10px] text-white/50">{t('common.appSubtitle')}</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="mr-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white absolute -left-3 top-5 bg-[#0f1724] border border-white/10 shadow-lg"
            >
              <ChevronLeft className="w-3 h-3 rotate-180" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setMobileSidebar(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 font-semibold shadow-lg shadow-amber-500/5'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                  !sidebarOpen && 'justify-center px-2'
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
              {sidebarOpen && (
                <div className={`mr-auto w-1 h-5 rounded-full transition-all duration-200 ${
                  location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                    ? 'bg-amber-500'
                    : 'bg-transparent'
                }`} />
              )}
            </NavLink>
          ))}
          <div className="pt-2 mt-2 border-t border-white/10">
            <button onClick={() => setAccountingOpen(v => !v)} className={clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:bg-white/5 hover:text-white', !sidebarOpen && 'justify-center px-2')}>
              <BookOpen className="w-5 h-5 shrink-0" />
              {sidebarOpen && <><span className="text-sm">المحاسبة المتقدمة</span><ChevronDown className={clsx('w-4 h-4 mr-auto transition-transform', accountingOpen && 'rotate-180')} /></>}
            </button>
            {accountingOpen && sidebarOpen && <div className="mt-1 mr-4 space-y-1 border-r border-white/10 pr-2">
              {accountingItems.map(item => <NavLink key={item.path} to={item.path} onClick={() => setMobileSidebar(false)} className={({isActive}) => clsx('flex items-center gap-2 px-3 py-2 rounded-lg text-xs', isActive ? 'bg-amber-500/15 text-amber-400' : 'text-white/50 hover:text-white hover:bg-white/5')}><item.icon className="w-4 h-4"/><span>{item.label}</span></NavLink>)}
            </div>}
          </div>
        </nav>

        {sidebarOpen && user && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-amber-400">
                  {user.name?.charAt(0) || 'أ'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-white/40">{t('layout.header.systemAdmin')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div
        className={clsx(
          'flex-1 transition-all duration-300 flex flex-col min-h-screen',
          sidebarOpen ? 'mr-64' : 'mr-[72px]'
        )}
      >
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-surface-800">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileSidebar(true)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors lg:hidden text-gray-500 dark:text-surface-400"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:block relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-surface-500" />
                <input
                  type="text"
                  placeholder={t('layout.header.quickSearch')}
                  className="w-64 pl-4 pr-9 py-2 text-sm bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-xl focus:bg-white dark:focus:bg-surface-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors text-gray-500 dark:text-surface-400 text-sm"
              >
                <Globe className="w-4 h-4" />
                <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors text-gray-500 dark:text-surface-400"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors text-gray-500 dark:text-surface-400"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-surface-900" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-gray-100 dark:border-surface-800 z-30 animate-scale-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-surface-800 flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900 dark:text-surface-100">{t('layout.header.notifications')}</p>
                      <span className="text-xs text-surface-400">{unreadCount} {t('layout.header.unread')}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                            n.read
                              ? 'hover:bg-gray-50 dark:hover:bg-surface-800'
                              : 'bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === 'request' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                            n.type === 'workshop' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                            n.type === 'payment' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            n.type === 'completed' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                            'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
                          }`}>
                            {n.type === 'request' && <ClipboardList className="w-4 h-4" />}
                            {n.type === 'workshop' && <Wrench className="w-4 h-4" />}
                            {n.type === 'payment' && <DollarSign className="w-4 h-4" />}
                            {n.type === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                            {n.type === 'driver' && <Truck className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-surface-200">{n.text}</p>
                            <p className="text-xs text-gray-400 dark:text-surface-500 mt-0.5">{n.time}</p>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-2" />}
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-surface-800">
                      <button className="text-sm text-amber-600 hover:text-amber-700 font-medium w-full text-center">
                        {t('layout.header.viewAll')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0) || 'أ'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-surface-200 hidden sm:block">
                    {user?.name || t('constants.roles.admin')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-surface-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-gray-100 dark:border-surface-800 py-2 z-30 animate-scale-in overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-surface-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-surface-100">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-surface-400">{t('layout.userMenu.systemAdmin')}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-surface-200 hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
                      >
                        <Cog className="w-4 h-4 text-gray-400 dark:text-surface-500" />
                        <span>{t('layout.header.settings')}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('layout.header.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 lg:px-6 py-2 border-t border-gray-50 dark:border-surface-800 bg-white/50 dark:bg-surface-900/50">
            <nav className="flex items-center gap-2 text-sm">
              <button onClick={() => navigate('/')} className="text-gray-400 dark:text-surface-500 hover:text-gray-600 dark:hover:text-surface-300 transition-colors">
                {t('layout.breadcrumbs.home')}
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  <ChevronLeft className="w-3 h-3 text-gray-300 dark:text-surface-600" />
                  <span
                    className={idx === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-surface-100 font-medium' : 'text-gray-500 dark:text-surface-400'}
                  >
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 page-container animate-fade-in dark:bg-surface-950">
          <Outlet />
        </main>

        <footer className="px-4 lg:px-6 py-4 border-t border-gray-100 dark:border-surface-800 bg-white dark:bg-surface-900">
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-surface-500">
            <span>{t('layout.footer.copyright', { year: new Date().getFullYear() })}</span>
            <span>{t('common.version')}</span>
          </div>
        </footer>
      </div>

      <AIAssistant />
    </div>
  );
}
