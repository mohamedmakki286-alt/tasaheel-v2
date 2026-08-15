import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, MapPin, Phone, Car, Wrench, MessageCircle, Send, Clock, User,
  FileText, CheckCheck, Plus, Smile, Image, X, Play, CheckCircle2, FileSearch, Mic, MicOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import InspectionReportForm from '../components/InspectionReportForm';
import { getRoom, getMessages, sendMessage, markAsRead, uploadChatMedia } from '../api/chat.api';
import { useRequestWebSocket } from '../hooks/useRequestWebSocket';
import { googleMapsDirectionsUrl, openExternalUrl } from '../utils/externalNavigation';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'قيد الانتظار', color: 'text-gray-700', bg: 'bg-gray-100' },
  quoted: { label: 'تم تقديم عرض', color: 'text-blue-700', bg: 'bg-blue-50' },
  accepted: { label: 'مقبول', color: 'text-green-700', bg: 'bg-green-50' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-orange-700', bg: 'bg-orange-50' },
  awaiting_payment: { label: 'بانتظار الدفع', color: 'text-amber-700', bg: 'bg-amber-50' },
  completed: { label: 'مكتمل', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'ملغي', color: 'text-red-700', bg: 'bg-red-50' },
};

const NEXT_ACTION: Record<string, { label: string; nextStatus: string }> = {
  accepted: { label: 'بدء العمل', nextStatus: 'in_progress' },
  customer_approved: { label: 'بدء العمل', nextStatus: 'in_progress' },
  in_progress: { label: 'إكمال العمل', nextStatus: 'awaiting_payment' },
};

const emojiGroups = [
  ['😀', '😁', '😂', '🤣', '😊', '😍', '😎', '🤔', '😢', '😡', '🤝', '👏', '🙏', '💪', '❤️', '🔥', '🎉', '✅', '👍', '👎'],
  ['🚗', '🔧', '🛠️', '🛞', '⛽', '🧰', '⚙️', '🚘', '📍', '⏰', '📸', '📞', '💬', '⭐', '💯'],
];

interface TechRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  carMake: string;
  carModel: string;
  carYear: number;
  carPlateNumber: string;
  carColor: string;
  carMileage: number;
  serviceTypeName: string;
  serviceTypeIds: number[];
  description: string;
  locationLat: number;
  locationLng: number;
  locationAddress: string;
  city: string;
  status: string;
  technicianId: number | null;
  technicianName: string | null;
  createdAt: string;
  media?: { id: number; url: string; type: string; createdAt: string }[];
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
}

function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const label = d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[10px] text-gray-400 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function MediaMessage({ url, isMine }: { url: string; isMine: boolean }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  const isAudio = /\.(mp3|wav|ogg|m4a|webm|aac)$/i.test(url);
  const isPdf = /\.pdf$/i.test(url);
  if (isAudio) {
    return <audio src={url} controls preload="metadata" className="h-10 max-w-[240px]" />;
  }
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt="صورة" className="max-w-[240px] max-h-[200px] rounded-xl object-cover" loading="lazy" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isMine ? 'bg-white/20' : 'bg-gray-100'}`}>
      {isPdf ? <FileText size={18} /> : <Image size={18} />}
      <span className="text-xs truncate max-w-[150px]">{url.split('/').pop()}</span>
    </a>
  );
}

// ===== Chat Section =====
function TechnicianChatSection({ requestId, customerName }: { requestId: number; customerName: string }) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingAttachmentRef = useRef<File | null>(null);
  const sendRecordingOnStopRef = useRef(false);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const workshop = useAuthStore((s) => s.workshop);
  const userId = workshop?.id || useAuthStore((s) => s.technician?.id);

  const { data: room, isError: isRoomError, refetch: refetchRoom } = useQuery({
    queryKey: ['chat-room', requestId],
    queryFn: () => getRoom(String(requestId)),
    enabled: !!requestId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', room?.id],
    queryFn: () => getMessages(room!.id),
    enabled: !!room?.id,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const attachment = pendingAttachmentRef.current || previewFile;
      if (attachment && room?.id) {
        const url = await uploadChatMedia(attachment);
        const type = attachment.type.startsWith('image/') ? 'image' : attachment.type.startsWith('audio/') ? 'audio' : 'file';
        return sendMessage(room.id, content || '', type, url);
      }
      return sendMessage(room!.id, content);
    },
    onSuccess: () => {
      setContent('');
      setPreviewFile(null);
      pendingAttachmentRef.current = null;
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', room?.id] });
    },
    onError: () => toast.error('فشل إرسال الرسالة'),
  });

  const readMutation = useMutation({
    mutationFn: () => markAsRead(room!.id),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (room?.id) readMutation.mutate();
  }, [messages, room?.id]);

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
    setPreviewFile(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = supportedType ? new MediaRecorder(stream, { mimeType: supportedType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType.split(';')[0] || 'audio/webm';
        const extension = mimeType === 'audio/mp4' ? 'm4a' : (mimeType.split('/')[1] || 'webm');
        const file = new File([new Blob(audioChunksRef.current, { type: mimeType })], `voice-${Date.now()}.${extension}`, { type: mimeType });
        pendingAttachmentRef.current = file;
        setPreviewFile(file);
        stream.getTracks().forEach((track) => track.stop());
        if (sendRecordingOnStopRef.current) {
          sendRecordingOnStopRef.current = false;
          setTimeout(() => sendMutation.mutate(), 0);
        }
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime((value) => value + 1), 1000);
    } catch {
      toast.error('تعذر الوصول إلى الميكروفون');
    }
  };

  const stopRecording = (sendImmediately: boolean) => {
    if (!mediaRecorderRef.current || !isRecording) return;
    sendRecordingOnStopRef.current = sendImmediately;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = null;
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    pendingAttachmentRef.current = null;
    sendRecordingOnStopRef.current = false;
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = null;
  };

  useEffect(() => () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  }, []);

  if (isRoomError) {
    return (
      <div className="rounded-2xl border border-surface-200 bg-white p-6 text-center shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <MessageCircle size={36} className="mx-auto mb-3 text-surface-300 dark:text-surface-600" />
        <h3 className="font-bold text-surface-900 dark:text-white">تعذر فتح المحادثة</h3>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">أعد المحاولة لتجهيز محادثة العميل.</p>
        <button type="button" onClick={() => refetchRoom()} className="mt-4 rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-700">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#E31B23]/30 border-t-[#E31B23] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <MessageCircle size={18} className="text-[#E31B23]" />
        <h3 className="font-bold text-sm text-[#111827]">محادثة مع {customerName}</h3>
      </div>

      <div className="h-[400px] overflow-y-auto space-y-1 p-4 bg-[#F7F8FA]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={40} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-medium">ابدأ المحادثة مع العميل</p>
          </div>
        )}
        {messages.map((msg: any, idx: number) => {
          const myId = String(userId);
          const isMine = String(msg.senderId) === myId;
          const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1]?.createdAt).toDateString();
          return (
            <div key={msg.id}>
              {showDate && <DateSeparator date={msg.createdAt} />}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? 'bg-[#E31B23] text-white rounded-bl-md'
                    : 'bg-white text-[#111827] border border-gray-100 shadow-sm rounded-br-md'
                }`}>
                  {!isMine && <p className="text-[10px] font-bold text-gray-400 mb-0.5">{msg.senderName}</p>}
                  {['image', 'audio', 'video', 'file'].includes(String(msg.type).toLowerCase()) ? (
                    <MediaMessage url={msg.mediaUrl || msg.content} isMine={isMine} />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : ''}`}>
                    <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && <CheckCheck size={12} className="text-white/60" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {previewFile && previewUrl && (
        <div className="px-4 pt-2">
          <div className="relative inline-block">
            {previewFile.type.startsWith('image/') ? (
              <img src={previewUrl} alt="معاينة" className="max-h-24 rounded-xl border border-gray-200" />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200">
                <FileText size={16} className="text-gray-500" />
                <span className="text-xs text-gray-600 truncate max-w-[120px]">{previewFile.name}</span>
              </div>
            )}
            <button onClick={() => { setPreviewFile(null); setPreviewUrl(null); }} className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="relative flex items-center gap-2 p-3 border-t border-gray-100 bg-white" dir="ltr">
        {showEmojiPicker && (
          <div className="absolute bottom-[68px] left-0 right-0 z-20 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl" dir="rtl">
            {emojiGroups.map((group, gi) => (
              <div key={gi} className="mb-2 grid grid-cols-10 gap-1 last:mb-0">
                {group.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => { setContent(v => `${v}${emoji}`); setShowEmojiPicker(false); }} className="rounded-lg p-1.5 text-xl hover:bg-gray-100 transition">{emoji}</button>
                ))}
              </div>
            ))}
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition" aria-label="إضافة ملف"><Plus size={22} /></button>
        <button type="button" onClick={() => setShowEmojiPicker(v => !v)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition" aria-label="الإيموجي"><Smile size={22} /></button>
        {isRecording ? (
          <div className="flex flex-1 items-center gap-3 rounded-full bg-red-50 px-4 py-2" dir="rtl">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span className="flex-1 text-sm font-medium text-red-700">
              {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
            </span>
            <button type="button" onClick={cancelRecording} className="text-red-500" aria-label="إلغاء التسجيل">
              <MicOff size={19} />
            </button>
          </div>
        ) : <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 transition-all"
          placeholder="اكتب رسالة..."
          dir="rtl"
        />}
        {isRecording ? (
          <button type="button" onClick={() => stopRecording(true)} disabled={sendMutation.isPending} className="w-10 h-10 rounded-full bg-[#E31B23] text-white flex items-center justify-center disabled:opacity-50 shrink-0">
            <Send size={18} />
          </button>
        ) : content.trim() || previewFile ? (
          <button type="submit" disabled={sendMutation.isPending} className="w-10 h-10 rounded-full bg-[#E31B23] text-white flex items-center justify-center disabled:opacity-50 shrink-0 transition hover:bg-[#c9161e]">
            <Send size={18} />
          </button>
        ) : (
          <button type="button" onClick={startRecording} className="w-10 h-10 rounded-full text-gray-500 flex items-center justify-center shrink-0 hover:bg-gray-100" aria-label="رسالة صوتية">
            <Mic size={20} />
          </button>
        )}
      </form>
    </div>
  );
}

// ===== Main Page =====
export default function TechnicianRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showReport, setShowReport] = useState(false);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['technician-requests'],
    queryFn: async () => {
      const response = await apiClient.get('/technician/requests');
      return (response.data || []) as TechRequest[];
    },
  });

  const request = requests.find((r) => String(r.id) === String(id));

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiClient.put(`/technician/requests/${requestId}/status`, { status });
      return { updatedRequest: response.data as TechRequest, requestedStatus: status };
    },
    onSuccess: async ({ updatedRequest, requestedStatus }) => {
      const effectiveStatus = requestedStatus === 'completed' ? 'awaiting_payment' : requestedStatus;
      queryClient.setQueryData<TechRequest[]>(['technician-requests'], (current = []) =>
        current.map((item) =>
          String(item.id) === String(updatedRequest?.id || request?.id)
            ? { ...item, ...updatedRequest, status: updatedRequest?.status || effectiveStatus }
            : item
        )
      );
      toast.success('تم تحديث الحالة بنجاح');
      await queryClient.refetchQueries({ queryKey: ['technician-requests'], type: 'active' });
    },
    onError: () => toast.error('فشل تحديث الحالة'),
  });

  const handleWsEvent = () => {
    queryClient.invalidateQueries({ queryKey: ['technician-requests'] });
  };

  useRequestWebSocket(id, handleWsEvent);

  if (!isAuthenticated || role !== 'technician') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">يجب تسجيل الدخول كفني</p>
          <a href="/login" className="px-6 py-2.5 rounded-xl bg-[#E31B23] text-white text-sm font-medium inline-block">تسجيل الدخول</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate('/technician')} className="p-2 rounded-xl hover:bg-gray-100"><ArrowRight size={20} className="text-gray-500" /></button>
            <h1 className="font-bold text-[#111827]">تفاصيل الطلب</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate('/technician')} className="p-2 rounded-xl hover:bg-gray-100"><ArrowRight size={20} className="text-gray-500" /></button>
            <h1 className="font-bold text-[#111827]">تفاصيل الطلب</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">الطلب غير موجود أو غير مسندة إليك</p>
          <button onClick={() => navigate('/technician')} className="mt-4 text-sm text-[#E31B23] font-medium">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[request.status] || { label: request.status, color: 'text-gray-700', bg: 'bg-gray-100' };
  const nextAction = NEXT_ACTION[request.status];
  const canWriteReport = request.status === 'in_progress' || request.status === 'accepted';

  return (
    <div className="technician-request-detail min-h-screen bg-[#F7F8FA] dark:bg-surface-950">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/technician')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowRight size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="font-bold text-[#111827] text-sm">تفاصيل الطلب #{request.id}</h1>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium mt-0.5 ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Card 1: Customer & Vehicle Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50">
          <div className="grid grid-cols-1 gap-4">
            {/* Customer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <User size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">العميل</p>
                  <p className="font-semibold text-[#111827] text-sm">{request.customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex items-center gap-2 rounded-xl bg-[#E31B23] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#c9161e]"
                  aria-label="محادثة العميل"
                >
                  <MessageCircle size={17} />
                  <span className="hidden sm:inline">محادثة</span>
                </button>
                {request.customerPhone && (
                  <a href={`tel:${request.customerPhone.replace(/[^\d+]/g, '')}`} className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors dark:bg-green-500/10 dark:text-green-400" aria-label="الاتصال بالعميل">
                    <Phone size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Vehicle */}
            <div className="p-3 rounded-xl bg-[#F7F8FA]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Car size={18} className="text-indigo-600" />
                </div>
                <p className="font-semibold text-[#111827] text-sm">السيارة</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm pr-[52px]">
                <div><span className="text-gray-400">الماركة: </span><span className="text-[#111827]">{request.carMake}</span></div>
                <div><span className="text-gray-400">الموديل: </span><span className="text-[#111827]">{request.carModel}</span></div>
                {request.carYear && <div><span className="text-gray-400">السنة: </span><span className="text-[#111827]">{request.carYear}</span></div>}
                {request.carPlateNumber && <div><span className="text-gray-400">اللوحة: </span><span className="text-[#111827]">{request.carPlateNumber}</span></div>}
                {request.carColor && <div><span className="text-gray-400">اللون: </span><span className="text-[#111827]">{request.carColor}</span></div>}
                {request.carMileage > 0 && <div><span className="text-gray-400">الممشى: </span><span className="text-[#111827]">{request.carMileage.toLocaleString()} كم</span></div>}
              </div>
            </div>

            {/* Location */}
            {request.locationAddress && (
              <div className="p-3 rounded-xl bg-[#F7F8FA]">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-amber-600" />
                  </div>
                  <p className="font-semibold text-[#111827] text-sm">الموقع</p>
                </div>
                <div className="pr-[52px]">
                  <p className="text-sm text-gray-600">{request.locationAddress}</p>
                  {request.city && <p className="text-xs text-gray-400 mt-0.5">{request.city}</p>}
                  {request.locationLat && request.locationLng && (
                    <button type="button" onClick={() => void openExternalUrl(googleMapsDirectionsUrl(request.locationLat!, request.locationLng!))} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#E31B23] hover:underline">
                      <MapPin size={12} /> فتح في خرائط قوقل
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Service Description */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Wrench size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-[#111827] text-sm">{request.serviceTypeName || 'خدمة صيانة'}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {timeAgo(request.createdAt)}</p>
            </div>
          </div>
          {request.description && <p className="text-sm text-gray-600 leading-relaxed pr-[52px]">{request.description}</p>}
        </div>

        {/* Customer Media */}
        {request.media && request.media.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50">
            <h3 className="font-semibold text-sm text-[#111827] mb-3">صور ومرفقات العميل</h3>
            <div className="grid grid-cols-2 gap-2">
              {request.media.map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gray-100">
                  {m.type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(m.url) ? (
                    <img src={m.url} alt="مرفق" className="w-full h-32 object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 h-32">
                      <FileText size={24} className="text-gray-400" />
                      <span className="text-xs text-gray-500 truncate">{m.url.split('/').pop()}</span>
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status Update + Inspection Report */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50">
          <h3 className="font-semibold text-sm text-[#111827] mb-3">تحديث الحالة</h3>
          <div className="space-y-2">
            {nextAction && (
              <button
                onClick={() => updateStatusMutation.mutate({ requestId: request.id, status: nextAction.nextStatus })}
                disabled={updateStatusMutation.isPending}
                className="w-full py-3 rounded-xl bg-[#E31B23] text-white text-sm font-bold hover:bg-[#c9161e] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {request.status === 'in_progress' ? <CheckCheck size={18} /> : <Play size={18} />}
                {updateStatusMutation.isPending ? 'جاري التحديث...' : nextAction.label}
              </button>
            )}
            {canWriteReport && (
              <button
                onClick={() => setShowReport(true)}
                className="w-full py-3 rounded-xl border-2 border-[#E31B23] text-[#E31B23] text-sm font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <FileSearch size={18} />
                تقرير الفحص
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div ref={chatSectionRef} className="scroll-mt-20">
          <TechnicianChatSection requestId={request.id} customerName={request.customerName} />
        </div>
      </div>

      {/* Inspection Report Form */}
      {showReport && (
        <InspectionReportForm
          requestId={String(request.id)}
          request={request}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
