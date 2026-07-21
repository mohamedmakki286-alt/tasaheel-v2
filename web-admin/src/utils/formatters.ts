import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import i18n from '../i18n/i18n';

function getLocale() {
  return i18n.language === 'ar' ? ar : enUS;
}

export function formatDate(date: string | Date, fmt: string = 'yyyy/MM/dd'): string {
  return dateFnsFormat(new Date(date), fmt, { locale: getLocale() });
}

export function formatDateTime(date: string | Date): string {
  return dateFnsFormat(new Date(date), 'yyyy/MM/dd HH:mm', { locale: getLocale() });
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: getLocale() });
}

export function formatCurrency(amount: number): string {
  const lang = i18n.language;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `+966 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 9) {
    return `+966 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatNumber(num: number): string {
  const lang = i18n.language;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(num);
}

export function truncate(str: string, len: number = 50): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}
