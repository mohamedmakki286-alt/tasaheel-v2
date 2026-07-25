import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Car, ClipboardList, Info, MapPin, Phone, Video, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatSection from '../components/ChatSection';
import { useCallStore } from '@shared/call/callStore';
import { getRequestDetail } from '../api/requests.api';
import { REQUEST_STATUS_LABELS } from '../utils/constants';
import Avatar from '../components/Avatar';

export default function ChatPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [params] = useSearchParams();
  const { data: request } = useQuery({
    queryKey: ['request-detail', requestId],
    queryFn: () => getRequestDetail(String(requestId)),
    enabled: !!requestId,
  });
  const customerName = request?.customer?.name || params.get('customerName') || 'العميل';
  const customerId = request?.customer?.id || params.get('customerId');
  const requestCall = useCallStore((state) => state.requestCall);
  const handleCall = () => {
    if (!customerId) {
      toast.error('معرّف العميل غير متوفر');
      return;
    }
    requestCall(Number(customerId), customerName, Number(requestId));
  };

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_260px]" dir="rtl">
      <section className="flex min-h-[calc(100dvh-8rem)] min-w-0 flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <header className="flex items-center justify-between gap-2 border-b border-surface-100 px-3 py-3 sm:px-4 dark:border-surface-800">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button onClick={() => navigate(-1)} className="shrink-0 rounded-xl p-2 hover:bg-surface-100 dark:hover:bg-surface-800"><ArrowRight size={20} /></button>
            <Avatar name={customerName} size="md" />
            <div className="min-w-0">
              <h1 className="truncate font-bold text-surface-900 dark:text-white">{customerName}</h1>
              <p className="truncate text-xs text-surface-400">طلب #{requestId} · {request?.service || 'محادثة الطلب'}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1 text-primary-600 dark:text-primary-400">
            <button onClick={handleCall} className="rounded-xl p-2 hover:bg-primary-50 dark:hover:bg-primary-500/10" aria-label="اتصال صوتي"><Phone size={19} /></button>
            <button onClick={() => toast('مكالمة الفيديو ستتوفر قريباً')} className="hidden rounded-xl p-2 hover:bg-primary-50 sm:block dark:hover:bg-primary-500/10" aria-label="مكالمة فيديو"><Video size={19} /></button>
            <button onClick={() => navigate(`/requests/${requestId}`)} className="rounded-xl p-2 hover:bg-primary-50 dark:hover:bg-primary-500/10" aria-label="تفاصيل الطلب"><Info size={19} /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 p-2 sm:p-3"><ChatSection requestId={String(requestId)} /></div>
      </section>

      <aside className="hidden space-y-3 lg:block">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-surface-900 dark:text-white">سياق الطلب</h2>
            <span className="badge badge-pending">{REQUEST_STATUS_LABELS[request?.status || 'pending'] || request?.status}</span>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2"><Wrench size={15} className="mt-0.5 shrink-0 text-primary-500" /><div><p className="text-xs text-surface-400">الخدمة</p><p>{request?.service || '-'}</p></div></div>
            <div className="flex items-start gap-2"><Car size={15} className="mt-0.5 shrink-0 text-primary-500" /><div><p className="text-xs text-surface-400">السيارة</p><p>{request?.car ? `${request.car.make} ${request.car.model} ${request.car.year}` : '-'}</p></div></div>
            <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-primary-500" /><div><p className="text-xs text-surface-400">الموقع</p><p>{request?.location || request?.city || '-'}</p></div></div>
            {request?.technicianName && <div className="flex items-start gap-2"><ClipboardList size={15} className="mt-0.5 shrink-0 text-primary-500" /><div><p className="text-xs text-surface-400">الفني</p><p>{request.technicianName}</p></div></div>}
          </div>
          <button onClick={() => navigate(`/requests/${requestId}`)} className="btn-secondary mt-4 w-full">فتح تفاصيل الطلب</button>
        </div>
      </aside>
    </div>
  );
}
