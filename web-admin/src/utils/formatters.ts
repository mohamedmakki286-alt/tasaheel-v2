import { format as dateFnsFormat, formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import i18n from '../i18n/i18n';

function getLocale() {
  return i18n.language === 'ar' ? ar : enUS;
}

function asValidDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(date: string | Date | null | undefined, fmt: string = 'yyyy/MM/dd'): string {
  const validDate = asValidDate(date);
  return validDate ? dateFnsFormat(validDate, fmt, { locale: getLocale() }) : '—';
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const validDate = asValidDate(date);
  return validDate ? dateFnsFormat(validDate, 'yyyy/MM/dd HH:mm', { locale: getLocale() }) : '—';
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  const validDate = asValidDate(date);
  return validDate ? formatDistanceToNow(validDate, { addSuffix: true, locale: getLocale() }) : '—';
}

export function formatCurrency(amount: number | null | undefined): string {
  const lang = i18n.language;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
  }).format(Number(amount ?? 0));
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('05')) {
    return `+966 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.length === 9) {
    return `+966 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatNumber(num: number | null | undefined): string {
  const lang = i18n.language;
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(Number(num ?? 0));
}

export function truncate(str: string | null | undefined, len: number = 50): string {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}
