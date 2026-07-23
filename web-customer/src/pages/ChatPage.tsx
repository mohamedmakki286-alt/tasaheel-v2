import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ChatSection from '../components/ChatSection';
import { getOrCreateRoom } from '../api/chat.api';
import { useAuthStore } from '../stores/authStore';
import { useCallStore, type CallState } from '@shared/call/callStore';

export default function ChatPage() {
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [params] = useSearchParams();
  const workshopId = params.get('workshopId') || undefined;
  const workshopNameParam = params.get('workshopName');
  const userId = useAuthStore((s) => s.customer?.id);
  const requestCall = useCallStore((s: CallState) => s.requestCall);

  const { data: room } = useQuery({
    queryKey: ['chat-room', requestId],
    queryFn: () => getOrCreateRoom(Number(requestId), Number(userId), workshopId ? Number(workshopId) : undefined),
    enabled: !!userId && !!requestId,
  });

  const workshopName = room?.workshopName || workshopNameParam || 'الورشة المختارة';

  return <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900" dir="rtl">
    <header className="flex items-center justify-between border-b border-surface-100 px-4 py-3 dark:border-surface-800">
      <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="rounded-xl p-2 text-surface-700 hover:bg-surface-100 dark:text-white dark:hover:bg-surface-800"><ArrowRight size={22} /></button><div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 font-black text-accent-600 dark:bg-accent-500/10">و</div><div><h1 className="font-black text-surface-900 dark:text-white">{workshopName}</h1><p className="text-xs text-emerald-600">متاح للمحادثة</p></div></div>
      <div className="flex items-center gap-1 text-accent-600">
        <button onClick={() => { if (workshopId) { requestCall(Number(workshopId), workshopName, Number(requestId)); } }} className="rounded-xl p-2 hover:bg-accent-50" aria-label="مكالمة صوتية"><Phone size={20} /></button>
      </div>
    </header>
    <div className="flex-1 p-3"><ChatSection requestId={Number(requestId)} workshopId={workshopId ? Number(workshopId) : undefined} workshopName={workshopName} /></div>
  </div>;
}
