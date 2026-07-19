import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, CheckCheck, Smile, Plus, Mic } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getOrCreateRoom, getMessages, sendMessage, markAsRead } from '../api/chat.api';
import { useAuthStore } from '../stores/authStore';

interface ChatSectionProps {
  requestId: number;
  workshopId?: number;
  workshopName?: string;
}

const emojiGroups = [
  ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😢', '😭', '😡', '🤝', '👏', '🙏', '💪', '❤️', '🔥', '🎉', '✅'],
  ['🚗', '🔧', '🛠️', '🛞', '⛽', '🧰', '⚙️', '🚘', '🧽', '🛢️', '📍', '⏰', '📸', '🎥', '📞', '💬', '⭐', '💯', '👍', '👎'],
];

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label = d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
      <span className="text-[10px] text-surface-400 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700" />
    </div>
  );
}

export default function ChatSection({ requestId, workshopId, workshopName }: ChatSectionProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const customer = useAuthStore((s) => s.customer);
  const userId = customer?.id;
  const userName = customer?.name;

  const { data: room } = useQuery({
    queryKey: ['chat-room', requestId],
    queryFn: () => getOrCreateRoom(requestId, Number(userId), workshopId ? Number(workshopId) : undefined),
    enabled: !!userId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', room?.id],
    queryFn: () => getMessages(room!.id),
    enabled: !!room?.id,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(room!.id, String(userId), 'customer', content),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room?.id] });
    },
    onError: () => toast.error('فشل إرسال الرسالة'),
  });

  const readMutation = useMutation({
    mutationFn: () => markAsRead(room!.id),
    onSuccess: () => {},
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (room?.id && userId) {
      readMutation.mutate();
    }
  }, [messages, room?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !room?.id || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="h-[400px] overflow-y-auto mb-4 space-y-1 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={40} className="text-surface-300 dark:text-surface-600 mb-3" />
            <p className="text-sm text-surface-400 font-medium">ابدأ المحادثة</p>
            <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">أرسل رسالة إلى {workshopName || 'الورشة'}</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isCustomer = msg.senderRole === 'customer';
          const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1]?.createdAt).toDateString();
          return (
            <div key={msg.id}>
              {showDate && <DateSeparator date={msg.createdAt} />}
              <div className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isCustomer
                    ? 'bg-accent-500 text-white rounded-bl-md'
                    : 'bg-white dark:bg-surface-700 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-600 rounded-br-md'
                }`}>
                  {!isCustomer && (
                    <p className="text-[10px] font-bold text-accent-400 mb-0.5">{msg.senderName}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-0.5 ${isCustomer ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-white/60 dark:text-surface-400">
                      {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isCustomer && <CheckCheck size={12} className="text-white/60" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative flex items-center gap-2 rounded-[28px] bg-white p-1.5 shadow-[0_5px_20px_rgba(15,23,42,0.10)] ring-1 ring-surface-100 dark:bg-surface-800 dark:ring-surface-700" dir="ltr">
        {showEmojiPicker && <div className="absolute bottom-[68px] left-0 right-0 z-20 rounded-2xl border border-surface-200 bg-white p-3 shadow-2xl dark:border-surface-700 dark:bg-surface-900" dir="rtl">
          {emojiGroups.map((group, groupIndex) => <div key={groupIndex} className="mb-2 grid grid-cols-10 gap-1 last:mb-0">{group.map((emoji) => <button key={emoji} type="button" onClick={() => { setContent((value) => `${value}${emoji}`); setShowEmojiPicker(false); }} className="rounded-lg p-1.5 text-xl transition hover:bg-surface-100 dark:hover:bg-surface-800">{emoji}</button>)}</div>)}
        </div>}
        <button type="button" onClick={() => toast('إرفاق الصور والفيديو سيُفعّل بعد ربط التخزين الآمن.')} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="إضافة ملف"><Plus size={29} strokeWidth={2.2} /></button>
        <button type="button" onClick={() => setShowEmojiPicker((open) => !open)} className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="الإيموجي"><Smile size={28} strokeWidth={2.2} /></button>
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-12 w-full bg-transparent px-1 text-base text-surface-900 outline-none placeholder:text-surface-400 dark:text-white"
            placeholder="اكتب رسالة"
            dir="rtl"
          />
        </div>
        {content.trim() ? <button type="submit" disabled={sendMutation.isPending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition hover:bg-accent-600 disabled:opacity-50"><Send size={20} /></button> : <button type="button" onClick={() => toast('التسجيل الصوتي سيُفعّل بعد ربط خدمة رفع الملفات.')} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="رسالة صوتية"><Mic size={27} strokeWidth={2.3} /></button>}
      </form>
    </div>
  );
}
