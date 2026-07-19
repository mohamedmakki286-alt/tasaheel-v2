function playBeep(frequency = 800, duration = 150, volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  } catch {}
}

function playNewRequestSound() {
  playBeep(880, 120, 0.3);
  setTimeout(() => playBeep(1100, 150, 0.3), 150);
  setTimeout(() => playBeep(880, 120, 0.25), 350);
}

function playQuoteSound() {
  playBeep(660, 150, 0.25);
  setTimeout(() => playBeep(880, 200, 0.25), 200);
}

function playPaymentSound() {
  playBeep(523, 150, 0.3);
  setTimeout(() => playBeep(659, 150, 0.3), 180);
  setTimeout(() => playBeep(784, 200, 0.3), 360);
}

async function vibratePattern(pattern: number | number[] = 200) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

export async function playNotificationSound(eventType: string) {
  switch (eventType) {
    case 'QUOTE_GENERATED':
      vibratePattern([100, 50, 100]);
      playQuoteSound();
      break;
    case 'OFFER_ACCEPTED':
      vibratePattern(150);
      playQuoteSound();
      break;
    case 'QUOTE_REJECTED':
    case 'OFFER_REJECTED':
      vibratePattern([50, 30, 50]);
      break;
    case 'PAYMENT_RELEASED':
      vibratePattern([100, 50, 100, 50, 100, 50, 200]);
      playPaymentSound();
      break;
    case 'PAYMENT_HELD':
      vibratePattern(100);
      playPaymentSound();
      break;
    case 'INVOICE_APPROVED':
      vibratePattern(100);
      playQuoteSound();
      break;
    case 'SERVICE_STARTED':
    case 'SERVICE_COMPLETED':
    case 'REPORT_SUBMITTED':
    case 'REPORT_APPROVED':
      vibratePattern(100);
      playNewRequestSound();
      break;
    default:
      vibratePattern(100);
      playBeep(600, 100, 0.2);
      break;
  }
}
