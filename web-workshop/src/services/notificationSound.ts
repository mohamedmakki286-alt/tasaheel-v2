import { useSettingsStore } from '../stores/settingsStore';

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playBeep(frequency = 800, duration = 150, volume = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration / 1000);
}

function playChime(notes: number[], durations: number[], volumes: number[]) {
  const ctx = getAudioContext();
  if (!ctx) return;
  let time = ctx.currentTime;
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const vol = volumes[i] || 0.3;
    const dur = durations[i] || 150;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur / 1000);
    osc.start(time);
    osc.stop(time + dur / 1000);
    time += dur / 1000 + 0.05;
  });
}

// ===== Ringtone patterns =====

const RINGTONES: Record<string, () => void> = {
  // Default phone ring — classic double-beep
  default: () => {
    playBeep(800, 100, 0.3);
    setTimeout(() => playBeep(800, 100, 0.3), 150);
  },

  // ورشة — strong ascending 3-tone (urgent)
  workshop: () => {
    playChime([880, 1100, 1320], [120, 120, 180], [0.3, 0.35, 0.3]);
  },

  // عميل — friendly 2-tone (notification)
  customer: () => {
    playChime([660, 880], [150, 200], [0.25, 0.3]);
  },

  // فني — work tone 3-note (mechanic feel)
  technician: () => {
    playChime([523, 659, 784], [120, 120, 180], [0.3, 0.3, 0.35]);
  },

  // Gentle — soft single tone
  gentle: () => {
    playBeep(520, 200, 0.15);
  },

  // Alert — sharp double-beep
  alert: () => {
    playBeep(1000, 80, 0.35);
    setTimeout(() => playBeep(1200, 100, 0.35), 120);
  },

  // Chime — pleasant ascending
  chime: () => {
    playChime([523, 659, 784, 1047], [100, 100, 100, 200], [0.2, 0.25, 0.3, 0.3]);
  },

  // Digital — tech feel
  digital: () => {
    playChime([880, 1100, 880, 1320], [80, 80, 80, 120], [0.25, 0.3, 0.25, 0.3]);
  },
};

export const RINGTONE_OPTIONS = [
  { id: 'default', label: 'نغمة الجوال الافتراضية' },
  { id: 'workshop', label: 'ورشة (عاجل)' },
  { id: 'customer', label: 'عميل (خفيف)' },
  { id: 'technician', label: 'فني (عمل)' },
  { id: 'gentle', label: 'هادئ' },
  { id: 'alert', label: 'تنبيه' },
  { id: 'chime', label: 'نغمة' },
  { id: 'digital', label: 'رقمي' },
];

// Event-to-ringtone mapping
const EVENT_RINGTONE_MAP: Record<string, string> = {
  REQUEST_SUBMITTED: 'workshop',
  REQUEST_CREATED: 'workshop',
  REQUEST_CANCELLED: 'alert',
  QUOTE_ACCEPTED: 'chime',
  QUOTE_REJECTED: 'alert',
  OFFER_ACCEPTED: 'chime',
  OFFER_REJECTED: 'alert',
  PAYMENT_RELEASED: 'technician',
  PAYMENT_HELD: 'alert',
  INVOICE_APPROVED: 'customer',
  STATUS_UPDATED: 'gentle',
  SERVICE_STARTED: 'technician',
  SERVICE_COMPLETED: 'chime',
  REPORT_SUBMITTED: 'customer',
  REPORT_APPROVED: 'chime',
  REPORT_REJECTED: 'alert',
};

function playRingtone(ringtoneId: string) {
  const fn = RINGTONES[ringtoneId];
  if (fn) fn();
}

async function vibratePattern(pattern: number | number[] = 200) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

export async function playNotificationSound(eventType: string) {
  const { soundEnabled, vibrationEnabled, ringtoneId } = useSettingsStore.getState();
  if (!soundEnabled && !vibrationEnabled) return;

  if (soundEnabled) {
    const mapped = EVENT_RINGTONE_MAP[eventType] || ringtoneId || 'default';
    playRingtone(mapped);
  }

  if (vibrationEnabled) {
    switch (eventType) {
      case 'REQUEST_SUBMITTED':
      case 'REQUEST_CREATED':
        await vibratePattern([100, 50, 100, 50, 200]);
        break;
      case 'QUOTE_ACCEPTED':
      case 'OFFER_ACCEPTED':
        await vibratePattern(150);
        break;
      case 'QUOTE_REJECTED':
      case 'OFFER_REJECTED':
        await vibratePattern([50, 30, 50]);
        break;
      case 'PAYMENT_RELEASED':
        await vibratePattern([100, 50, 100, 50, 100, 50, 200]);
        break;
      default:
        await vibratePattern(100);
        break;
    }
  }
}

export function previewRingtone(ringtoneId: string) {
  playRingtone(ringtoneId);
}
