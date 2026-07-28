import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Trash2, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteRoom, getRooms } from '../api/chat.api';

function messagePreview(room: any) {
  const message = room.lastMessage;
  if (!message) return `طلب #${room.requestId}`;
  if (message.type === 'image') return 'صورة';
  if (message.type === 'audio') return 'رسالة صوتية';
  if (message.type === 'video') return 'فيديو';
  if (message.type === 'file') return 'ملف مرفق';
  return message.content || `طلب #${room.requestId}`;
}

function actualTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat('ar-SA', sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
  ).format(date);
}

export default function ChatsPage() {
  const queryClient = useQueryClient();
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
    refetchInterval: 15_000,
  });

  const handleDelete = async (roomId: string) => {
    if (!window.confirm('حذف المحادثة من قائمتك؟ لن تُحذف عند الورشة.')) return;
    try {
      await deleteRoom(roomId);
      await queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      toast.success('تم حذف المحادثة من قائمتك');
    } catch {
      toast.error('تعذر حذف المحادثة');
    }
  };

  return <div className="mx-auto max-w-2xl space-y-5" dir="rtl">
    <div><h1 className="text-2xl font-black text-surface-900 dark:text-white">محادثاتي</h1><p className="mt-1 text-sm text-surface-500">تواصل مباشر مع الورش المختارة</p></div>
    <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
      {isLoading ? <p className="p-8 text-center text-surface-500">جاري تحميل المحادثات…</p> : rooms.length ? rooms.map((room) =>
        <div key={room.id} className="flex items-center border-b border-surface-100 last:border-0 dark:border-surface-800">
          <Link to={`/orders/${room.requestId}/chat?workshopId=${room.workshopId || ''}&workshopName=${encodeURIComponent(room.workshopName || 'الورشة المختارة')}`} className="flex min-w-0 flex-1 items-center gap-3 p-4 hover:bg-surface-50 dark:hover:bg-surface-800">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-500/10"><Wrench size={22}/></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2"><strong className="truncate text-surface-900 dark:text-white">{room.workshopName || 'الورشة المختارة'}</strong><time className="shrink-0 text-[11px] text-surface-400">{actualTime(room.lastMessage?.createdAt || room.createdAt)}</time></span>
              <span className="mt-1 block truncate text-xs text-surface-500">{messagePreview(room)}</span>
            </span>
            {!!room.unreadCount && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-black text-white">{room.unreadCount}</span>}
            <ChevronLeft size={18} className="text-surface-400"/>
          </Link>
          <button onClick={() => handleDelete(room.id)} aria-label="حذف المحادثة" className="ml-3 rounded-xl p-2 text-surface-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={18}/></button>
        </div>
      ) : <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><MessageCircle size={42} className="mb-3 text-surface-300"/><h2 className="font-black text-surface-900 dark:text-white">لا توجد محادثات حالياً</h2><p className="mt-1 text-sm text-surface-500">تظهر المحادثة بعد اختيار عرض ورشة.</p></div>}
    </div>
  </div>;
}
