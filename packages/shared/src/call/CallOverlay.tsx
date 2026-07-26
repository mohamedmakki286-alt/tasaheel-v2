import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface CallOverlayProps {
  status: string;
  peerName: string;
  duration: number;
  isOutgoing: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getStatusLabel(status: string, isOutgoing: boolean, duration: number): string {
  if (status === 'ringing') return isOutgoing ? 'جاري الاتصال…' : 'مكالمة واردة';
  if (status === 'connecting') return 'جاري إنشاء اتصال آمن…';
  if (status === 'active') return formatDuration(duration);
  if (status === 'ended') return 'انتهت المكالمة';
  if (status === 'failed') return 'تعذر إكمال المكالمة';
  return '';
}

export default function CallOverlay({
  status,
  peerName,
  duration,
  isOutgoing,
  isMuted,
  isSpeakerOn,
  onHangUp,
  onToggleMute,
  onToggleSpeaker,
}: CallOverlayProps) {
  // The incoming-call dialog owns the ringing state until the user accepts it.
  if (status === 'idle' || (status === 'ringing' && !isOutgoing)) return null;

  const displayName = peerName?.trim() || 'مستخدم تساهيل';
  const initial = displayName.charAt(0);
  const statusLabel = getStatusLabel(status, isOutgoing, duration);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#111214] p-0 text-white sm:p-6"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="شاشة المكالمة"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#e30613]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-[#e30613]/10 blur-3xl" />

      <section className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-[#1d1e21] to-[#0d0e10] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] shadow-2xl sm:h-[min(760px,calc(100vh-3rem))] sm:max-w-md sm:rounded-[2.25rem] sm:border sm:border-white/10 sm:px-9">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e30613] shadow-lg shadow-red-950/40">
              <img src="/tasaheel-logo.png" alt="" className="h-7 w-7 rounded-lg object-cover" />
            </span>
            <div>
              <p className="text-sm font-extrabold leading-4">تساهيل</p>
              <p className="mt-1 text-[10px] text-white/45">اتصال صوتي</p>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/60">
            <span className={`h-2 w-2 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'}`} />
            {status === 'active' ? 'متصل' : 'قيد الاتصال'}
          </span>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center">
          <div className="relative mb-7">
            {status !== 'active' && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full border border-[#e30613]/50" />
                <span className="absolute -inset-4 rounded-full border border-white/5" />
              </>
            )}
            <div className="relative grid h-32 w-32 place-items-center rounded-full border-4 border-white/10 bg-gradient-to-br from-[#e30613] to-[#79040b] text-5xl font-black shadow-[0_24px_70px_rgba(227,6,19,0.28)]">
              {initial}
            </div>
          </div>

          <h1 className="max-w-full truncate px-4 text-center text-3xl font-black tracking-tight">{displayName}</h1>
          <p className="mt-2 min-h-6 text-center text-sm font-medium text-white/55" aria-live="polite">
            {statusLabel}
          </p>
          <p className="mt-3 flex items-center gap-2 text-[11px] text-white/35">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            المكالمة مشفّرة وآمنة
          </p>
        </main>

        <footer>
          <div className="mb-7 grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={onToggleSpeaker}
              aria-pressed={isSpeakerOn}
              className="group flex flex-col items-center gap-2 text-xs text-white/55"
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl border transition active:scale-95 ${isSpeakerOn ? 'border-white bg-white text-[#e30613]' : 'border-white/10 bg-white/10 text-white hover:bg-white/15'}`}>
                {isSpeakerOn ? <Volume2 size={23} /> : <VolumeX size={23} />}
              </span>
              {isSpeakerOn ? 'السماعة مفعّلة' : 'السماعة'}
            </button>

            <button
              type="button"
              onClick={onHangUp}
              className="group flex flex-col items-center gap-2 text-xs font-bold text-white"
              aria-label="إنهاء المكالمة"
            >
              <span className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-[#e30613] text-white shadow-xl shadow-red-950/50 transition hover:bg-[#c9000c] active:scale-95">
                <PhoneOff size={27} />
              </span>
              إنهاء
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={isMuted}
              className="group flex flex-col items-center gap-2 text-xs text-white/55"
            >
              <span className={`grid h-14 w-14 place-items-center rounded-2xl border transition active:scale-95 ${isMuted ? 'border-white bg-white text-[#e30613]' : 'border-white/10 bg-white/10 text-white hover:bg-white/15'}`}>
                {isMuted ? <MicOff size={23} /> : <Mic size={23} />}
              </span>
              {isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
            </button>
          </div>
          <div className="mx-auto h-1 w-28 rounded-full bg-white/20 sm:hidden" />
        </footer>
      </section>
    </div>
  );
}
