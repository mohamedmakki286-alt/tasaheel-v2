import { Phone, PhoneOff, ShieldCheck } from 'lucide-react';
import { ROLE_LABELS } from './types';
import type { UserRole } from './types';

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerName: string;
  callerRole: UserRole | string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallDialog({
  isOpen,
  callerName,
  callerRole,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  if (!isOpen) return null;

  const roleLabel = ROLE_LABELS[callerRole] || 'مستخدم تساهيل';
  const displayName = callerName?.trim() || 'مكالمة واردة';
  const initial = displayName.charAt(0);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#111214] p-0 text-white sm:bg-black/75 sm:p-6 sm:backdrop-blur-xl"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="مكالمة واردة"
    >
      <div className="pointer-events-none absolute -right-36 -top-28 h-96 w-96 rounded-full bg-[#e30613]/25 blur-3xl" />
      <section className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-[#202124] to-[#0d0e10] px-7 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] shadow-2xl sm:h-[min(720px,calc(100vh-3rem))] sm:max-w-md sm:rounded-[2.25rem] sm:border sm:border-white/10 sm:px-9">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e30613]">
              <img src="/tasaheel-logo.png" alt="" className="h-7 w-7 rounded-lg object-cover" />
            </span>
            <div>
              <p className="text-sm font-extrabold">تساهيل</p>
              <p className="mt-0.5 text-[10px] text-white/45">خدمة الاتصال</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck size={14} className="text-emerald-400" />
            اتصال آمن
          </span>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-7 text-sm font-medium text-white/50">مكالمة صوتية واردة</p>
          <div className="relative mb-8">
            <span className="absolute -inset-5 animate-ping rounded-full border border-[#e30613]/40" />
            <span className="absolute -inset-10 rounded-full border border-white/5" />
            <div className="relative grid h-32 w-32 place-items-center rounded-full border-4 border-white/10 bg-gradient-to-br from-[#e30613] to-[#79040b] text-5xl font-black shadow-[0_24px_70px_rgba(227,6,19,0.28)]">
              {initial}
            </div>
          </div>
          <h1 className="max-w-full truncate px-4 text-3xl font-black tracking-tight">{displayName}</h1>
          <span className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50">
            {roleLabel}
          </span>
        </main>

        <footer className="grid grid-cols-2 gap-8 px-3">
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-3 text-sm font-bold"
          >
            <span className="grid h-[4.25rem] w-[4.25rem] place-items-center rounded-[1.4rem] bg-emerald-500 shadow-xl shadow-emerald-950/40 transition hover:bg-emerald-400 active:scale-95">
              <Phone size={28} />
            </span>
            قبول
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex flex-col items-center gap-3 text-sm font-bold"
          >
            <span className="grid h-[4.25rem] w-[4.25rem] place-items-center rounded-[1.4rem] bg-[#e30613] shadow-xl shadow-red-950/50 transition hover:bg-[#c9000c] active:scale-95">
              <PhoneOff size={28} />
            </span>
            رفض
          </button>
        </footer>
        <div className="mx-auto mt-8 h-1 w-28 rounded-full bg-white/20 sm:hidden" />
      </section>
    </div>
  );
}
