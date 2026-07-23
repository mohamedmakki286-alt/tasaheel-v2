import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Wrench } from 'lucide-react';
import { requestsApi } from '../api/requests.api';

function getWorkshopName(request: any): string {
  return request.workshopName
    || request.quotes?.find((q: any) => q.status === 'accepted')?.workshopName
    || 'الورشة المختارة';
}

function getWorkshopId(request: any): string {
  return request.quotes?.find((q: any) => q.status === 'accepted')?.workshopId || request.workshopIds?.[0] || '';
}

export default function ChatsPage() {
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['customer-chats'], queryFn: async () => { const res: any = await requestsApi.getAll(); return res.data || res || []; } });
  const conversations = requests.filter((request: any) => ['accepted', 'in_progress', 'inspection_report', 'customer_approved', 'awaiting_payment'].includes(request.status));
  return <div className="mx-auto max-w-2xl space-y-5" dir="rtl"><div><h1 className="text-2xl font-black text-surface-900 dark:text-white">محادثاتي</h1><p className="mt-1 text-sm text-surface-500">تواصل مباشر مع الورش المختارة</p></div><div className="overflow-hidden rounded-3xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">{isLoading ? <p className="p-8 text-center text-surface-500">جارٍ تحميل المحادثات…</p> : conversations.length ? conversations.map((request: any) => { const name = getWorkshopName(request); const wid = getWorkshopId(request); return <Link key={request.id} to={`/orders/${request.id}/chat?workshopId=${wid}&workshopName=${encodeURIComponent(name)}`} className="flex items-center gap-3 border-b border-surface-100 p-4 last:border-0 hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-500/10"><Wrench size={22}/></span><span className="min-w-0 flex-1"><span className="block font-black text-surface-900 dark:text-white">{name}</span><span className="mt-1 block truncate text-xs text-surface-500">طلب #{request.id} · {request.description}</span></span><MessageCircle size={19} className="text-accent-500"/><ChevronLeft size={18} className="text-surface-400"/></Link>; }) : <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><MessageCircle size={42} className="mb-3 text-surface-300"/><h2 className="font-black text-surface-900 dark:text-white">لا توجد محادثات حالياً</h2><p className="mt-1 text-sm text-surface-500">تظهر المحادثة بعد اختيار عرض ورشة.</p></div>}</div></div>;
}
