import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ClipboardList, MessageCircle } from 'lucide-react';
import { useNotificationStore } from '../stores/notificationStore';
import { timeAgo } from '../utils/formatters';
import { TechnicianBottomNav, TechnicianHeader } from './TechnicianPage';

export default function TechnicianNotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, syncFromServer } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  useEffect(() => { syncFromServer(); }, [syncFromServer]);
  const items = filter === 'unread' ? notifications.filter((item) => !item.read) : notifications;

  return (
    <div className="min-h-screen bg-surface-50 pb-24 dark:bg-surface-950 lg:pb-8">
      <TechnicianHeader />
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div><h1 className="text-2xl font-black">كل الإشعارات</h1><p className="mt-1 text-xs text-surface-400">{unreadCount} إشعارات غير مقروءة</p></div>
          {unreadCount > 0 && <button onClick={markAllAsRead} className="btn-secondary text-xs">تحديد الكل كمقروء</button>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'tab-item-active' : 'tab-item'}>الكل</button>
          <button onClick={() => setFilter('unread')} className={filter === 'unread' ? 'tab-item-active' : 'tab-item'}>غير المقروءة</button>
        </div>
        <section className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
          {items.length === 0 ? (
            <div className="px-4 py-16 text-center"><Bell size={34} className="mx-auto text-surface-300" /><p className="mt-3 font-bold">لا توجد إشعارات</p></div>
          ) : items.map((item) => (
            <button key={item.id} onClick={() => { markAsRead(item.id); if (item.requestId) navigate(`/technician/requests/${item.requestId}`); }} className={`flex w-full items-start gap-3 border-b border-surface-100 px-4 py-4 text-right last:border-0 dark:border-surface-800 ${item.read ? 'hover:bg-surface-50 dark:hover:bg-surface-800' : 'bg-accent-50/50 dark:bg-accent-500/5'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.read ? 'bg-surface-100 text-surface-500 dark:bg-surface-800' : 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-300'}`}>{item.type === 'request' ? <ClipboardList size={18} /> : item.type === 'quote' ? <MessageCircle size={18} /> : <CheckCircle2 size={18} />}</span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{item.title}</strong>{item.body && <span className="mt-1 block text-xs leading-5 text-surface-500">{item.body}</span>}<span className="mt-1.5 block text-[10px] text-surface-400">{timeAgo(item.createdAt)}{item.requestId ? ` • طلب #${item.requestId}` : ''}</span></span>
              {!item.read && <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
            </button>
          ))}
        </section>
      </main>
      <TechnicianBottomNav active="notifications" />
    </div>
  );
}
