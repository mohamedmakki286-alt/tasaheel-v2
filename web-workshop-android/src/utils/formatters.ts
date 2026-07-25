import i18n from '../i18n/i18n';

export function parseApiDate(dateString: string): Date {
  if (!dateString) return new Date(NaN);
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateString);
  return new Date(hasTimezone ? dateString : `${dateString}Z`);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = parseApiDate(dateString);
  return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = parseApiDate(dateString);
  return new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

export function formatPhone(phone: string): string {
  if (phone.startsWith('05') && phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  if (phone.startsWith('9665') && phone.length === 12) {
    return `0${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
  }
  return phone;
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = parseApiDate(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (!Number.isFinite(diffMs)) return '';
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return i18n.t('layout.timeAgo.now');
  if (diffMins < 60) return i18n.t('layout.timeAgo.minutes', { count: diffMins });
  if (diffHours < 24) return i18n.t('layout.timeAgo.hours', { count: diffHours });
  if (diffDays < 7) return i18n.t('layout.timeAgo.days', { count: diffDays });
  return formatDate(dateString);
}
