import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Phone, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatSection from '../components/ChatSection';
import { useCallStore } from '@shared/call/callStore';

export default function ChatPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [params] = useSearchParams();
  const customerName = params.get('customerName') || 'العميل';
  const customerId = params.get('customerId');
  const requestCall = useCallStore((s) => s.requestCall);
  const handleCall = () => {
    if (!customerId) { toast.error('معرف العميل غير متوفر'); return; }
    requestCall(Number(customerId), customerName, Number(requestId));
  };
  return <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900" dir="rtl">
    <header className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-800"><div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="rounded-xl p-2 hover:bg-surface-100 dark:hover:bg-surface-800"><ArrowRight size={22}/></button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 font-black text-primary-600">ع</div><div><h1 className="font-black">{customerName}</h1><p className="text-xs text-emerald-600">محادثة الطلب</p></div></div><div className="flex gap-1 text-primary-600"><button onClick={handleCall} className="p-2"><Phone size={20}/></button><button onClick={() => toast('مكالمة الفيديو ستتوفر قريباً')} className="p-2"><Video size={20}/></button></div></header>
    <div className="flex-1 p-3"><ChatSection requestId={String(requestId)} /></div>
  </div>;
}
