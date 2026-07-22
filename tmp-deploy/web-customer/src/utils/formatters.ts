import i18n from '../i18n/i18n';

export function formatCurrency(amount: number): string {
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'SAR', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));
}
