import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, CheckCheck, Smile, Plus, Mic, Image, FileText, X, MicOff, Loader2, ArrowUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getOrCreateRoom, getLatestMessages, getMessagesPage, sendMessage, markAsRead, sendAttachmentMessage } from '../api/chat.api';
import type { ChatMessage } from '../types';
import { useAuthStore } from '../stores/authStore';

interface ChatSectionProps {
  requestId: number;
  workshopId?: number;
  workshopName?: string;
}

const PAGE_SIZE = 50;
const SCROLL_THRESHOLD = 60;

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

function MediaMessage({ msg, isCustomer }: { msg: { mediaUrl?: string; content?: string; type?: string; attachment?: any }; isCustomer: boolean }) {
  const url = msg.attachment?.url || msg.mediaUrl || msg.content;
  if (!url) return null;
  const type = msg.type?.toLowerCase() || '';
  const isImage = type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isAudio = type === 'audio' || /\.(mp3|wav|ogg|m4a|webm|aac)$/i.test(url);
  const isPdf = type === 'file' && /\.pdf$/i.test(url);

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
    <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isCustomer ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-600'}`}>
      {isPdf ? <FileText size={18} /> : <Image size={18} />}
      <span className="text-xs truncate max-w-[150px]">{msg.attachment?.originalFileName || url.split('/').pop()}</span>
    </a>
  );
}

export default function ChatSection({ requestId, workshopId, workshopName }: ChatSectionProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'sent' | 'failed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const customer = useAuthStore((s) => s.customer);
  const userId = customer?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isNearBottomRef = useRef(true);
  const scrollHeightBeforeLoadRef = useRef(0);

  const { data: room } = useQuery({
    queryKey: ['chat-room', requestId],
    queryFn: () => getOrCreateRoom(requestId, Number(userId), workshopId ? Number(workshopId) : undefined),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!room?.id) return;
    let cancelled = false;
    setMessages([]);
    setIsInitialLoad(true);
    setCurrentPage(0);
    setTotalPages(0);
    setHasMore(false);

    getLatestMessages(room.id, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setMessages(result.messages);
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setHasMore(result.currentPage > 0);
        setIsInitialLoad(false);
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView();
        });
      })
      .catch(() => {
        if (!cancelled) setIsInitialLoad(false);
      });

    return () => { cancelled = true; };
  }, [room?.id]);

  useEffect(() => {
    if (!room?.id || isInitialLoad) return;
    const interval = setInterval(() => {
      getLatestMessages(room.id, PAGE_SIZE).then((result) => {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = result.messages.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        setCurrentPage(result.currentPage);
        setTotalPages(result.totalPages);
        setHasMore(result.currentPage > 0);
        if (isNearBottomRef.current) {
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          });
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [room?.id, isInitialLoad]);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore || !room?.id) return;
    const olderPage = currentPage - 1;
    if (olderPage < 0) return;

    setIsLoadingMore(true);
    const container = containerRef.current;
    scrollHeightBeforeLoadRef.current = container?.scrollHeight || 0;

    try {
      const result = await getMessagesPage(room.id, olderPage, PAGE_SIZE);
      setMessages((prev) => [...result.messages, ...prev]);
      setCurrentPage(olderPage);
      setHasMore(olderPage > 0);
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - scrollHeightBeforeLoadRef.current;
        }
      });
    } catch {
      // silently fail
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, room?.id, currentPage]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const nearTop = container.scrollTop < SCROLL_THRESHOLD;
    if (nearTop && hasMore && !isLoadingMore) {
      loadOlderMessages();
    }
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    isNearBottomRef.current = nearBottom;
  }, [hasMore, isLoadingMore, loadOlderMessages]);

  const refetchMessages = useCallback(() => {
    if (!room?.id) return;
    getLatestMessages(room.id, PAGE_SIZE).then((result) => {
      setMessages(result.messages);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setHasMore(result.currentPage > 0);
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }).catch(() => {});
  }, [room?.id]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!room?.id) throw new Error('No room');
      if (previewFile) {
        setUploadState('uploading');
        setUploadProgress(0);
        const clientMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        try {
          const result = await sendAttachmentMessage(room.id, previewFile, content, clientMsgId, (p) => setUploadProgress(p));
          setUploadState('sent');
          return result;
        } catch (e) {
          setUploadState('failed');
          throw e;
        }
      }
      return sendMessage(room.id, String(userId), 'customer', content);
    },
    onSuccess: () => {
      setContent('');
      setPreviewFile(null);
      setPreviewUrl(null);
      setUploadState('idle');
      setUploadProgress(0);
      refetchMessages();
    },
    onError: (err: any) => {
      if (uploadState === 'failed') return;
      const msg = err?.friendlyMessage || err?.message || 'فشل إرسال الرسالة';
      toast.error(msg);
    },
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

  const readMutation = useMutation({
    mutationFn: () => markAsRead(room!.id),
    onSuccess: () => {},
  });

  useEffect(() => {
    if (room?.id && userId) {
      readMutation.mutate();
    }
  }, [messages.length, room?.id]);

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
    if ((!content.trim() && !previewFile) || !room?.id || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الملف 10 ميجا');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/aac', 'audio/mpeg', 'audio/wav', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('نوع الملف غير مدعوم');
      return;
    }
    setPreviewFile(file);
    setUploadState('idle');
    e.target.value = '';
  };

  const retryUpload = () => {
    setUploadState('idle');
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
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[400px] overflow-y-auto mb-4 space-y-1 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-2xl scrollbar-hide"
      >
        {hasMore && (
          <div className="flex justify-center py-2">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-xs text-surface-400">
                <Loader2 size={14} className="animate-spin" />
                <span>جاري تحميل الرسائل القديمة...</span>
              </div>
            ) : (
              <button
                onClick={loadOlderMessages}
                className="flex items-center gap-1.5 text-xs text-accent-500 hover:text-accent-600 transition-colors"
              >
                <ArrowUp size={14} />
                <span>تحميل الرسائل القديمة</span>
              </button>
            )}
          </div>
        )}

        {!hasMore && messages.length > 0 && (
          <div className="flex items-center justify-center py-2">
            <span className="text-[10px] text-surface-300 dark:text-surface-600">بداية المحادثة</span>
          </div>
        )}

        {messages.length === 0 && !isInitialLoad && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={40} className="text-surface-300 dark:text-surface-600 mb-3" />
            <p className="text-sm text-surface-400 font-medium">ابدأ المحادثة</p>
            <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">أرسل رسالة إلى {workshopName || 'الورشة'}</p>
          </div>
        )}

        {isInitialLoad && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
          </div>
        )}

        {messages.map((msg, idx) => {
          const isCustomer = msg.senderRole === 'customer';
          const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1]?.createdAt).toDateString();
          const msgType = msg.type?.toLowerCase() || '';
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
                  {(msgType === 'image' || msgType === 'audio' || msgType === 'file') ? (
                    <MediaMessage msg={msg} isCustomer={isCustomer} />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
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
          {uploadState === 'uploading' && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Loader2 size={20} className="text-white animate-spin mx-auto mb-1" />
                <span className="text-[10px] text-white">{uploadProgress}%</span>
              </div>
            </div>
          )}
          {uploadState === 'failed' && (
            <button onClick={retryUpload} className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
              <Loader2 size={12} />
            </button>
          )}
          {uploadState === 'idle' && (
            <button onClick={() => { setPreviewFile(null); setPreviewUrl(null); }} className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex items-center gap-2 rounded-[28px] bg-white p-1.5 shadow-[0_5px_20px_rgba(15,23,42,0.10)] ring-1 ring-surface-100 dark:bg-surface-800 dark:ring-surface-700" dir="ltr">
        {showEmojiPicker && <div className="absolute bottom-[68px] left-0 right-0 z-20 rounded-2xl border border-surface-200 bg-white p-3 shadow-2xl dark:border-surface-700 dark:bg-surface-900" dir="rtl">
          {emojiGroups.map((group, groupIndex) => <div key={groupIndex} className="mb-2 grid grid-cols-10 gap-1 last:mb-0">{group.map((emoji) => <button key={emoji} type="button" onClick={() => { setContent((value) => `${value}${emoji}`); setShowEmojiPicker(false); }} className="rounded-lg p-1.5 text-xl transition hover:bg-surface-100 dark:hover:bg-surface-800">{emoji}</button>)}</div>)}
        </div>}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/ogg,audio/mp4,audio/m4a,audio/aac,audio/mpeg,audio/wav,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
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
            {content.trim() || previewFile ? (
              <button type="submit" disabled={sendMutation.isPending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition hover:bg-accent-600 disabled:opacity-50">
                {sendMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-surface-900 transition hover:bg-surface-100 dark:text-white dark:hover:bg-surface-700" aria-label="رسالة صوتية"><Mic size={27} strokeWidth={2.3} /></button>
            )}
          </>
        )}
      </form>
    </div>
  );
}
