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
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#E31B23] to-gray-900 flex flex-col items-center justify-between py-12 px-6">
      <div className="flex flex-col items-center gap-3 mt-8">
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </div>
        <h2 className="text-white text-2xl font-bold">{peerName || 'مجهول'}</h2>
        <p className="text-white/70 text-sm">
          {status === 'ringing' && (isOutgoing ? 'جاري الاتصال...' : 'مكالمة واردة')}
          {status === 'connecting' && 'جاري الاتصال...'}
          {status === 'active' && formatDuration(duration)}
          {status === 'ended' && 'انتهت المكالمة'}
        </p>
        {status === 'ringing' && (
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-white text-red-500' : 'bg-white/20 text-white'
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={onHangUp}
          className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
        >
          <PhoneOff size={28} className="text-white" />
        </button>

        <button
          onClick={onToggleSpeaker}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isSpeakerOn ? 'bg-white text-[#E31B23]' : 'bg-white/20 text-white'
          }`}
        >
          {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </div>
    </div>
  );
}
