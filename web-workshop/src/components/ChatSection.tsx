import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, CheckCheck, Smile, Plus, Mic, Image, FileText, X, MicOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getRoom, getMessages, sendMessage, markAsRead, uploadChatMedia } from '../api/chat.api';
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

function MediaMessage({ url, isWorkshop }: { url: string; isWorkshop: boolean }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  const isPdf = /\.pdf$/i.test(url);
  const isAudio = /\.(mp3|wav|ogg|m4a|webm|aac)$/i.test(url);

  if (isAudio) {
    return (
      <audio controls className="max-w-[240px] h-10">
        <source src={url} />
      </audio>
    );
  }

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt="صورة" className="max-w-[240px] max-h-[200px] rounded-xl object-cover" loading="lazy" />
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isWorkshop ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-600'}`}>
      {isPdf ? <FileText size={18} /> : <Image size={18} />}
      <span className="text-xs truncate max-w-[150px]">{url.split('/').pop()}</span>
    </a>
  );
}

export default function ChatSection({ requestId }: ChatSectionProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    mutationFn: async () => {
      if (previewFile && room?.id) {
        const url = await uploadChatMedia(previewFile);
        const type = previewFile.type.startsWith('image/') ? 'image' : previewFile.type.startsWith('audio/') ? 'audio' : 'file';
        return sendMessage(room.id, content || '', type, url);
      }
      return sendMessage(room!.id, content);
    },
    onSuccess: () => {
      setContent('');
      setPreviewFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room?.id] });
    },
    onError: () => toast.error(t('components.chatSection.sendFailed')),
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setPreviewFile(file);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch {
      toast.error('لا يمكن الوصول إلى الميكروفون');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (previewFile) {
      const url = URL.createObjectURL(previewFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [previewFile]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !previewFile) || !room?.id) return;
    mutation.mutate();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الملف 10 ميجا');
      return;
    }
    setPreviewFile(file);
    e.target.value = '';
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
                      {msg.type === 'image' || msg.type === 'file' ? (
                        <MediaMessage url={msg.mediaUrl || msg.content} isWorkshop={isWorkshop} />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
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

      {previewFile && previewUrl && (
        <div className="mb-3 relative inline-block">
          {previewFile.type.startsWith('image/') ? (
            <img src={previewUrl} alt="معاينة" className="max-h-24 rounded-xl border border-surface-200" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-600">
              <FileText size={16} className="text-surface-500" />
              <span className="text-xs text-surface-600 dark:text-surface-300 truncate max-w-[120px]">{previewFile.name}</span>
            </div>
          )}
          <button onClick={() => { setPreviewFile(null); setPreviewUrl(null); }} className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex items-center gap-2 rounded-[28px] bg-white p-1.5 shadow-[0_5px_20px_rgba(15,23,42,0.10)] ring-1 ring-surface-100 dark:bg-surface-800 dark:ring-surface-700" dir="ltr">
        {showEmojiPicker && <div className="absolute bottom-[68px] left-0 right-0 z-20 rounded-2xl border border-surface-200 bg-white p-3 shadow-2xl dark:border-surface-700 dark:bg-surface-900" dir="rtl">{emojiGroups.map((group, groupIndex) => <div key={groupIndex} className="mb-2 grid grid-cols-10 gap-1 last:mb-0">{group.map((emoji) => <button key={emoji} type="button" onClick={() => { setContent((value) => `${value}${emoji}`); setShowEmojiPicker(false); }} className="rounded-lg p-1.5 text-xl transition hover:bg-surface-100 dark:hover:bg-surface-800">{emoji}</button>)}</div>)}</div>}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="إضافة ملف"><Plus size={29} strokeWidth={2.2} /></button>
        <button type="button" onClick={() => setShowEmojiPicker((open) => !open)} className="flex h-12 w-10 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="الإيموجي"><Smile size={28} strokeWidth={2.2} /></button>
        {isRecording ? (
          <div className="flex items-center gap-2 flex-1">
            <button type="button" onClick={cancelRecording} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-400 font-mono">{String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}</span>
            </div>
            <button type="button" onClick={stopRecording} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500 text-white animate-pulse">
              <MicOff size={22} />
            </button>
          </div>
        ) : (
          <>
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
            {content.trim() || previewFile ? <button type="submit" disabled={mutation.isPending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 disabled:opacity-50"><Send size={20} /></button> : <button type="button" onClick={startRecording} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="رسالة صوتية"><Mic size={27} strokeWidth={2.3} /></button>}
          </>
        )}
      </form>
    </div>
  );
}
