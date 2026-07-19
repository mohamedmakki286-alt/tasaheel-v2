import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MessageCircle, Search, ChevronLeft, Car, Circle } from 'lucide-react';
import { getMyRequests } from '../api/requests.api';
import Avatar from '../components/Avatar';

export default function ChatsPage() {
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['workshop-chat-requests'], queryFn: getMyRequests, refetchInterval: 15000 });
  const conversations = requests.filter((request) => !['pending', 'cancelled'].includes(request.status));
  return <div className="mx-auto w-full max-w-3xl space-y-5" dir="rtl">
    <div><h1 className="text-2xl font-black text-surface-900 dark:text-white">المحادثات</h1><p className="mt-1 text-sm text-surface-500">تواصل مع عملاء الورشة بحسب الطلب</p></div>
    <div className="relative"><Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400" /><input className="input-field h-12 pr-11" placeholder="ابحث باسم العميل أو رقم الطلب" /></div>
    <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
      {isLoading ? <div className="p-10 text-center text-surface-500">جارٍ تحميل المحادثات…</div> : conversations.length ? conversations.map((request, index) => <Link key={request.id} to={`/requests/${request.id}/chat?customerName=${encodeURIComponent(request.customer.name)}`} className="flex items-center gap-3 border-b border-surface-100 p-4 transition hover:bg-surface-50 last:border-0 dark:border-surface-800 dark:hover:bg-surface-800/60">
        <div className="relative"><Avatar name={request.customer.name} size="lg" /><Circle size={11} className="absolute bottom-0 left-0 fill-emerald-500 text-white" /></div>
        <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="truncate font-black text-surface-900 dark:text-white">{request.customer.name}</h2><span className="text-[11px] text-surface-400">{new Date(request.updatedAt || request.createdAt).toLocaleDateString('ar-SA')}</span></div><p className="mt-1 truncate text-sm text-surface-500">{request.service} · {request.car.make} {request.car.model}</p><div className="mt-2 flex items-center gap-1 text-xs text-surface-400"><Car size={14}/><span>طلب #{request.id}</span></div></div>
        {index === 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-black text-white">1</span>}<ChevronLeft size={19} className="text-surface-400" />
      </Link>) : <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><MessageCircle size={40} className="mb-3 text-surface-300"/><h2 className="font-black">لا توجد محادثات حالياً</h2><p className="mt-1 text-sm text-surface-500">تظهر المحادثات بعد قبول العميل للعرض.</p></div>}
    </div>
  </div>;
}
