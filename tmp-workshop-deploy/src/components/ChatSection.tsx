import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, CheckCheck, Smile, Plus, Mic } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getRoom, getMessages, sendMessage, markAsRead } from '../api/chat.api';
import { formatDateTime } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import Avatar from './Avatar';

interface ChatSectionProps {
  requestId: string;
}

const emojiGroups = [
  ['😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😢', '😭', '😡', '🤝', '👏', '🙏', '💪', '❤️', '🔥', '🎉', '✅'],
  ['🚗', '🔧', '🛠️', '🛞', '⛽', '🧰', '⚙️', '🚘', '🧽', '🛢️', '📍', '⏰', '📸', '🎥', '📞', '💬', '⭐', '💯', '👍', '👎'],
];

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-surface-200" />
      <span className="text-xs text-surface-400 font-medium px-2">{formatDateTime(date)}</span>
      <div className="flex-1 h-px bg-surface-200" />
    </div>
  );
}

function TypingIndicator() {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-2 mb-3">
      <Avatar name={t('components.chatSection.customer')} size="sm" />
      <div className="bg-surface-200 rounded-2xl rounded-tr-none px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

export default function ChatSection({ requestId }: ChatSectionProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const workshop = useAuthStore((s) => s.workshop);
  const { t } = useTranslation();

  const { data: room } = useQuery({
    queryKey: ['chat-room', requestId],
    queryFn: () => getRoom(requestId),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', room?.id],
    queryFn: () => getMessages(room!.id),
    enabled: !!room?.id,
    refetchInterval: 5000,
  });

  const readMutation = useMutation({
    mutationFn: () => markAsRead(room!.id),
    onSuccess: () => {},
  });

  useEffect(() => {
    if (room?.id && messages.some(m => !m.isRead && m.senderRole === 'customer')) {
      readMutation.mutate();
    }
  }, [messages, room?.id]);

  const mutation = useMutation({
    mutationFn: () => sendMessage(room!.id, content),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room?.id] });
    },
    onError: () => toast.error(t('components.chatSection.sendFailed')),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !room?.id) return;
    mutation.mutate();
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="h-[400px] overflow-y-auto mb-4 space-y-1 p-4 bg-surface-50 rounded-2xl scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={40} className="text-surface-300 mb-3" />
            <p className="text-sm text-surface-400 font-medium">{t('components.chatSection.noMessages')}</p>
            <p className="text-xs text-surface-300 mt-1">{t('components.chatSection.startChat')}</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isWorkshop = msg.senderRole === 'workshop';
          const showDateSeparator = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1]?.createdAt).toDateString();
          return (
            <div key={msg.id}>
              {showDateSeparator && <DateSeparator date={msg.createdAt} />}
              <div className={`flex ${isWorkshop ? 'justify-start' : 'justify-end'} mb-2`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${isWorkshop ? 'flex-row' : 'flex-row-reverse'}`}>
                  {isWorkshop && <Avatar name={workshop?.name} size="sm" />}
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isWorkshop
                          ? 'bg-primary-500 text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-surface-800 rounded-tl-none border border-surface-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[11px] font-semibold ${isWorkshop ? 'text-white/80' : 'text-surface-400'}`}>
                          {msg.senderName}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      {msg.mediaUrl && (
                        <img src={msg.mediaUrl} alt="" className="mt-2 rounded-lg max-w-[240px] max-h-[180px] object-cover cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${isWorkshop ? 'pr-1' : 'pl-1'} ${isWorkshop ? '' : 'justify-end'}`}>
                      <span className={`text-[10px] ${isWorkshop ? 'text-surface-400' : 'text-surface-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isWorkshop && <CheckCheck size={12} className="text-primary-500" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative flex items-center gap-2 rounded-[28px] bg-white p-1.5 shadow-[0_5px_20px_rgba(15,23,42,0.10)] ring-1 ring-surface-100 dark:bg-surface-800 dark:ring-surface-700" dir="ltr">
        {showEmojiPicker && <div className="absolute bottom-[68px] left-0 right-0 z-20 rounded-2xl border border-surface-200 bg-white p-3 shadow-2xl dark:border-surface-700 dark:bg-surface-900" dir="rtl">{emojiGroups.map((group, groupIndex) => <div key={groupIndex} className="mb-2 grid grid-cols-10 gap-1 last:mb-0">{group.map((emoji) => <button key={emoji} type="button" onClick={() => { setContent((value) => `${value}${emoji}`); setShowEmojiPicker(false); }} className="rounded-lg p-1.5 text-xl transition hover:bg-surface-100 dark:hover:bg-surface-800">{emoji}</button>)}</div>)}</div>}
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
        {content.trim() ? <button type="submit" disabled={mutation.isPending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 disabled:opacity-50"><Send size={20} /></button> : <button type="button" onClick={() => toast('التسجيل الصوتي سيُفعّل بعد ربط خدمة رفع الملفات.')} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="رسالة صوتية"><Mic size={27} strokeWidth={2.3} /></button>}
      </form>
    </div>
  );
}
