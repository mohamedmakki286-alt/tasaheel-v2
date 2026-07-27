export interface WorkingDay {
  day?: string;
  open: string;
  close: string;
  closed?: boolean;
}

export function getWorkshopOpenStatus(
  workingHours?: string,
  now = new Date(),
): { isOpen: boolean; text: string } | null {
  if (!workingHours) return null;
  try {
    const hours = JSON.parse(workingHours) as WorkingDay[];
    if (!Array.isArray(hours) || hours.length !== 7) return null;
    const index = now.getDay() === 6 ? 0 : now.getDay() + 1;
    const today = hours[index];
    if (!today || today.closed || !today.open || !today.close) return { isOpen: false, text: 'مغلق' };
    const [openHour, openMinute] = today.open.split(':').map(Number);
    const [closeHour, closeMinute] = today.close.split(':').map(Number);
    if (![openHour, openMinute, closeHour, closeMinute].every(Number.isFinite)) return null;
    const current = now.getHours() * 60 + now.getMinutes();
    const open = openHour * 60 + openMinute;
    const close = closeHour * 60 + closeMinute;
    const isOpen = open === close
      ? true
      : close > open
        ? current >= open && current < close
        : current >= open || current < close;
    return { isOpen, text: isOpen ? 'مفتوح' : 'مغلق' };
  } catch {
    return null;
  }
}
