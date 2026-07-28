import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, MessageCircle, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteRoom, getRooms } from '../api/chat.api';
import Avatar from '../components/Avatar';

function actualTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat('ar-SA', sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
  ).format(date);
}

function preview(room: any) {
  const message = room.lastMessage;
  if (!message) return `طلب #${room.requestId}`;
  if (message.type === 'image') return 'صورة';
  if (message.type === 'audio') return 'رسالة صوتية';
  if (message.type === 'video') return 'فيديو';
  if (message.type === 'file') return 'ملف مرفق';
  return message.content || `طلب #${room.requestId}`;
}

export default function ChatsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
    refetchInterval: 15_000,
  });
  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rooms;
    return rooms.filter(room =>
      room.customerName?.toLowerCase().includes(query)
      || String(room.requestId).includes(query)
    );
  }, [rooms, search]);

  const handleDelete = async (roomId: string) => {
    if (!window.confirm('حذف المحادثة من قائمتك؟ لن تُحذف عند العميل.')) return;
    try {
      await deleteRoom(roomId);
      await queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      toast.success('تم حذف المحادثة من قائمتك');
    } catch {
      toast.error('تعذر حذف المحادثة');
    }
  };

  return <div className="mx-auto w-full max-w-3xl space-y-5" dir="rtl">
    <div><h1 className="text-2xl font-black text-surface-900 dark:text-white">المحادثات</h1><p className="mt-1 text-sm text-surface-500">الأحدث أولاً مع حالة القراءة والوقت الفعلي</p></div>
    <div className="relative"><Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400"/><input value={search} onChange={event => setSearch(event.target.value)} className="input-field h-12 pr-11" placeholder="ابحث باسم العميل أو رقم الطلب"/></div>
    <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
      {isLoading ? <div className="p-10 text-center text-surface-500">جاري تحميل المحادثات…</div> : filteredRooms.length ? filteredRooms.map((room) =>
        <div key={room.id} className="flex items-center border-b border-surface-100 last:border-0 dark:border-surface-800">
          <Link to={`/requests/${room.requestId}/chat?customerName=${encodeURIComponent(room.customerName || '')}`} className="flex min-w-0 flex-1 items-center gap-3 p-4 transition hover:bg-surface-50 dark:hover:bg-surface-800/60">
            <Avatar name={room.customerName} size="lg"/>
            <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h2 className="truncate font-black text-surface-900 dark:text-white">{room.customerName}</h2><time className="shrink-0 text-[11px] text-surface-400">{actualTime(room.lastMessage?.createdAt || room.createdAt)}</time></div><p className="mt-1 truncate text-sm text-surface-500">{preview(room)}</p><p className="mt-1 text-[11px] text-surface-400">طلب #{room.requestId}</p></div>
            {!!room.unreadCount && <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[10px] font-black text-white">{room.unreadCount}</span>}
            <ChevronLeft size={19} className="text-surface-400"/>
          </Link>
          <button onClick={() => handleDelete(room.id)} aria-label="حذف المحادثة" className="ml-3 rounded-xl p-2 text-surface-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 size={18}/></button>
        </div>
      ) : <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><MessageCircle size={40} className="mb-3 text-surface-300"/><h2 className="font-black">لا توجد محادثات حالياً</h2></div>}
    </div>
  </div>;
}
