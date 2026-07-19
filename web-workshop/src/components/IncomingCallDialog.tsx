import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerName: string;
  callerRole: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallDialog({ isOpen, callerName, callerRole, onAccept, onReject }: IncomingCallDialogProps) {
  if (!isOpen) return null;

  const roleLabel = callerRole === 'customer' ? 'عميل' : 'ورشة';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center animate-in fade-in zoom-in duration-200">
        <div className="relative mx-auto mb-6">
          <div className="w-20 h-20 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto animate-pulse">
            <Phone size={36} className="text-accent-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-ping" />
        </div>

        <p className="text-surface-500 text-sm mb-1">{roleLabel}</p>
        <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-8">
          {callerName || 'مكالمة واردة'}
        </h3>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all active:scale-95 shadow-lg"
          >
            <PhoneOff size={24} className="text-white" />
          </button>

          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-all active:scale-95 shadow-lg"
          >
            <Phone size={24} className="text-white" />
          </button>
        </div>

        <div className="flex justify-between mt-6 px-4">
          <span className="text-xs text-surface-400">رفض</span>
          <span className="text-xs text-surface-400">قبول</span>
        </div>
      </div>
    </div>
  );
}
