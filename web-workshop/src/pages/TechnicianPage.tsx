import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Car, CheckCircle2, ChevronLeft, ClipboardList, Clock3, Home,
  LogOut, MapPin, MessageCircle, Moon, Package, Settings, Sun, UserCircle,
  UserRound, Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useTechnicianWebSocket } from '../hooks/useTechnicianWebSocket';
import { useThemeStore } from '../stores/themeStore';
import { timeAgo } from '../utils/formatters';
import { useTranslation } from 'react-i18next';

interface TechnicianRequest {
  id: number;
  requestNumber?: string;
  customerName: string;
  carMake: string;
  carModel: string;
  serviceTypeName: string;
  locationAddress: string;
  city: string;
  status: string;
  createdAt: string;
}

const specialtyLabels: Record<string, string> = {
  MECHANIC: 'فني ميكانيكا', ELECTRICIAN: 'فني كهرباء', ENGINE: 'فني محركات',
  BRAKES: 'فني فرامل', GENERAL_TECHNICIAN: 'فني شامل', AC_TECHNICIAN: 'فني تكييف',
};

const statusLabels: Record<string, string> = {
  pending: 'بانتظار البدء', accepted: 'مقبول', customer_approved: 'جاهز للتنفيذ',
  in_progress: 'قيد التنفيذ', awaiting_payment: 'تحتاج إجراء', completed: 'مكتمل', cancelled: 'ملغي',
};

export function TechnicianHeader() {
  const { i18n } = useTranslation();
  const tr = (ar: string, en: string) => i18n.language.startsWith('en') ? en : ar;
  const navigate = useNavigate();
  const technician = useAuthStore((state) => state.technician);
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, syncFromServer } = useNotificationStore();
  const [open, setOpen] = useState(false);

  useEffect(() => { syncFromServer(); }, [syncFromServer]);

  const name = technician?.name || tr('الفني', 'Technician');
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  return (
    <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/95 backdrop-blur dark:border-surface-800 dark:bg-surface-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={() => navigate('/technician/account')} className="flex min-w-0 items-center gap-3 text-right">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-50 font-black text-accent-700 dark:bg-accent-500/15 dark:text-accent-300">{initials}</span>
          <span className="min-w-0"><strong className="block truncate text-sm text-surface-950 dark:text-white">{tr('مرحباً،', 'Hello,')} {name}</strong><span className="mt-0.5 block truncate text-[11px] text-surface-400">{(i18n.language.startsWith('en') ? technician?.specialty : specialtyLabels[technician?.specialty?.toUpperCase() || '']) || technician?.specialty || tr('فني صيانة', 'Maintenance technician')}{technician?.workshopName ? ` • ${technician.workshopName}` : ''}</span></span>
        </button>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl text-surface-500 transition hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800" aria-label={tr('تغيير المظهر', 'Change theme')}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button>
          <div className="relative">
            <button onClick={() => setOpen((value) => !value)} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-surface-500 transition hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800" aria-label={tr('الإشعارات', 'Notifications')} aria-expanded={open}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-black text-white">{Math.min(unreadCount, 99)}</span>}
            </button>
            {open && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label={tr('إغلاق الإشعارات', 'Close notifications')} />
                <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-xl dark:border-surface-800 dark:bg-surface-900 sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-[24rem]">
                  <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-800">
                    <div><p className="text-sm font-black">{tr('الإشعارات', 'Notifications')}</p><p className="mt-0.5 text-xs text-surface-400">{unreadCount} {tr('غير مقروءة', 'unread')}</p></div>
                    {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-bold text-accent-600 dark:text-accent-400">{tr('تحديد الكل كمقروء', 'Mark all as read')}</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-surface-400">{tr('لا توجد إشعارات', 'No notifications')}</div>
                    ) : notifications.slice(0, 5).map((notification) => (
                      <button key={notification.id} onClick={() => { markAsRead(notification.id); setOpen(false); if (notification.requestId) navigate(`/technician/requests/${notification.requestId}`); }} className={`flex w-full items-start gap-3 border-b border-surface-100 px-4 py-3 text-right last:border-0 dark:border-surface-800 ${notification.read ? 'hover:bg-surface-50 dark:hover:bg-surface-800' : 'bg-accent-50/50 dark:bg-accent-500/5'}`}>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300"><ClipboardList size={15} /></span>
                        <span className="min-w-0 flex-1"><strong className="block text-sm">{notification.title}</strong>{notification.body && <span className="mt-0.5 block line-clamp-2 text-xs text-surface-500">{notification.body}</span>}<span className="mt-1 block text-[10px] text-surface-400">{timeAgo(notification.createdAt)}</span></span>
                        {!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setOpen(false); navigate('/technician/notifications'); }} className="flex w-full items-center justify-center gap-2 border-t border-surface-100 px-4 py-3 text-sm font-bold text-accent-600 dark:border-surface-800 dark:text-accent-400">{tr('عرض كل الإشعارات', 'View all notifications')} <ChevronLeft size={16} /></button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => navigate('/technician/account')} className="hidden h-10 w-10 items-center justify-center rounded-xl text-surface-500 transition hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800 sm:flex" aria-label="الحساب"><Settings size={19} /></button>
          <button onClick={() => { logout(); navigate('/login', { replace: true }); }} className="hidden h-10 w-10 items-center justify-center rounded-xl text-surface-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 sm:flex" aria-label="تسجيل الخروج"><LogOut size={19} /></button>
        </div>
      </div>
    </header>
  );
}

function TechnicianDashboard() {
  const { i18n } = useTranslation();
  const tr = (ar: string, en: string) => i18n.language.startsWith('en') ? en : ar;
  const navigate = useNavigate();
  const technician = useAuthStore((state) => state.technician);
  const updateTechnician = useAuthStore((state) => state.updateTechnician);
  const [tab, setTab] = useState<'current' | 'upcoming' | 'action' | 'completed'>('current');
  useTechnicianWebSocket();

  const { data: requests = [], isLoading } = useQuery<TechnicianRequest[]>({
    queryKey: ['technician-requests'],
    queryFn: async () => (await apiClient.get('/technician/requests')).data || [],
    refetchInterval: 30000,
  });
  const availabilityMutation = useMutation({
    mutationFn: async (status: string) => (await apiClient.put('/technician/availability', { status })).data,
    onSuccess: (data) => { updateTechnician({ availabilityStatus: data?.availabilityStatus }); toast.success(tr('تم تحديث حالة التوفر', 'Availability updated')); },
    onError: () => toast.error(tr('فشل تحديث حالة التوفر', 'Failed to update availability')),
  });

  const grouped = useMemo(() => ({
    current: requests.filter((request) => ['accepted', 'customer_approved', 'in_progress'].includes(request.status)),
    upcoming: requests.filter((request) => request.status === 'pending'),
    action: requests.filter((request) => request.status === 'awaiting_payment'),
    completed: requests.filter((request) => ['completed', 'cancelled'].includes(request.status)),
  }), [requests]);
  const activeRequest = grouped.current[0];
  const hasInProgress = requests.some((request) => request.status === 'in_progress');
  const availability = hasInProgress ? 'busy' : (technician?.availabilityStatus || 'available');
  const list = grouped[tab];

  return (
    <div className="min-h-screen bg-surface-50 pb-24 dark:bg-surface-950 lg:pb-8">
      <TechnicianHeader />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
        <section className="flex items-center justify-between gap-4 rounded-3xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-5">
          <div className="flex items-start gap-3"><span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${availability === 'available' ? 'bg-emerald-500' : availability === 'busy' ? 'bg-orange-500' : 'bg-surface-400'}`} /><div><h1 className="font-black text-surface-950 dark:text-white">{availability === 'available' ? tr('متاح لاستقبال الطلبات', 'Available for requests') : availability === 'busy' ? tr('مشغول بمهمة حالية', 'Busy with a current task') : tr('غير متاح حالياً', 'Currently unavailable')}</h1><p className="mt-1 text-xs text-surface-500">{availability === 'available' ? tr('يمكن للورشة إسناد مهمة جديدة إليك.', 'The workshop can assign a new task to you.') : availability === 'busy' ? tr('تعمل حالياً على طلب نشط.', 'You are working on an active request.') : tr('لن يتم إسناد مهام جديدة حتى تعود متاحاً.', 'No new tasks will be assigned until you become available.')}</p></div></div>
          {availability !== 'busy' && <button onClick={() => availabilityMutation.mutate(availability === 'available' ? 'offline' : 'available')} disabled={availabilityMutation.isPending} className={`relative h-7 w-12 shrink-0 rounded-full transition ${availability === 'available' ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-surface-700'}`} aria-label="تغيير حالة التوفر"><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${availability === 'available' ? 'right-[22px]' : 'right-0.5'}`} /></button>}
        </section>

        <section className="grid grid-cols-3 gap-3">
          {[
            { label: tr('المهمة الحالية', 'Current task'), value: grouped.current.length, icon: Wrench },
            { label: tr('بانتظار البدء', 'Waiting to start'), value: grouped.upcoming.length, icon: Clock3 },
            { label: tr('مكتمل اليوم', 'Completed today'), value: grouped.completed.length, icon: CheckCircle2 },
          ].map((item) => <div key={item.label} className="rounded-2xl border border-surface-200 bg-white p-3 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300"><item.icon size={17} /></span><p className="mt-3 text-2xl font-black">{item.value}</p><p className="mt-1 text-[11px] text-surface-400 sm:text-xs">{item.label}</p></div>)}
        </section>

        {activeRequest && (
          <section className="rounded-3xl bg-surface-950 p-5 text-white shadow-sm dark:bg-black sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-white/50" dir="ltr">{activeRequest.requestNumber || `#${activeRequest.id}`}</p><h2 className="mt-2 text-xl font-black">{activeRequest.serviceTypeName || 'خدمة صيانة'}</h2><p className="mt-1 text-sm text-white/60">{activeRequest.carMake} {activeRequest.carModel}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{statusLabels[activeRequest.status] || activeRequest.status}</span></div>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/60"><span className="flex items-center gap-1.5"><UserRound size={14} /> {activeRequest.customerName}</span><span className="flex items-center gap-1.5"><MapPin size={14} /> {activeRequest.locationAddress || activeRequest.city || 'داخل الورشة'}</span></div>
            <button onClick={() => navigate(`/technician/requests/${activeRequest.id}`)} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 text-sm font-black text-white">{tr('متابعة المهمة', 'Continue task')} <ChevronLeft size={17} /></button>
          </section>
        )}

        <nav className="grid grid-cols-4 gap-1 rounded-2xl border border-surface-200 bg-white p-1 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          {[
            ['current', tr('الحالية', 'Current')], ['upcoming', tr('القادمة', 'Upcoming')], ['action', tr('تحتاج إجراء', 'Action needed')], ['completed', tr('المكتملة', 'Completed')],
          ].map(([key, label]) => <button key={key} onClick={() => setTab(key as typeof tab)} className={`rounded-xl px-2 py-2.5 text-[11px] font-bold transition sm:text-xs ${tab === key ? 'bg-accent-600 text-white' : 'text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-800'}`}>{label}{grouped[key as typeof tab].length > 0 ? ` (${grouped[key as typeof tab].length})` : ''}</button>)}
        </nav>

        {isLoading ? <div className="h-44 animate-pulse rounded-3xl bg-surface-200 dark:bg-surface-800" /> : list.length === 0 ? (
          <section className="rounded-3xl border border-surface-200 bg-white px-4 py-14 text-center shadow-sm dark:border-surface-800 dark:bg-surface-900"><Package size={30} className="mx-auto text-surface-300" /><p className="mt-3 font-bold">{tr('لا توجد مهام في هذا القسم', 'No tasks in this section')}</p><p className="mt-1 text-xs text-surface-400">{tr('ستظهر المهمة هنا عند وصول تحديث جديد.', 'New tasks will appear here when received.')}</p></section>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((request) => <button key={request.id} onClick={() => navigate(`/technician/requests/${request.id}`)} className="rounded-2xl border border-surface-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-accent-200 dark:border-surface-800 dark:bg-surface-900"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-accent-600 dark:text-accent-400" dir="ltr">{request.requestNumber || `#${request.id}`}</p><h3 className="mt-1 font-black">{request.serviceTypeName || 'خدمة صيانة'}</h3></div><span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-bold dark:bg-surface-800">{statusLabels[request.status] || request.status}</span></div><div className="mt-4 flex flex-wrap gap-3 text-xs text-surface-500"><span className="flex items-center gap-1"><Car size={13} /> {request.carMake} {request.carModel}</span><span className="flex items-center gap-1"><UserRound size={13} /> {request.customerName}</span></div><div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-3 text-xs dark:border-surface-800"><span className="text-surface-400">{timeAgo(request.createdAt)}</span><span className="font-bold text-accent-600 dark:text-accent-400">فتح المهمة</span></div></button>)}
          </div>
        )}
      </main>
      <TechnicianBottomNav active="home" />
    </div>
  );
}

export function TechnicianBottomNav({ active }: { active: 'home' | 'notifications' | 'account' }) {
  const { i18n } = useTranslation();
  const tr = (ar: string, en: string) => i18n.language.startsWith('en') ? en : ar;
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {[{ key: 'home', label: tr('مهامي', 'My tasks'), icon: Home, path: '/technician' }, { key: 'notifications', label: tr('الإشعارات', 'Notifications'), icon: Bell, path: '/technician/notifications' }, { key: 'account', label: tr('حسابي', 'Account'), icon: UserCircle, path: '/technician/account' }].map((item) => <button key={item.key} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 py-3 text-[10px] font-bold ${active === item.key ? 'text-accent-600 dark:text-accent-400' : 'text-surface-400'}`}><item.icon size={20} />{item.label}</button>)}
      </div>
    </nav>
  );
}

export default function TechnicianPage() {
  const { i18n } = useTranslation();
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated || role !== 'technician') return <div className="flex min-h-screen items-center justify-center"><a href="/login" className="btn-primary">{i18n.language.startsWith('en') ? 'Technician login' : 'تسجيل الدخول كفني'}</a></div>;
  return <TechnicianDashboard />;
}
