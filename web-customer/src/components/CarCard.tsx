import { CalendarDays, Gauge, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Car } from '../types';
import { CarBrandLogo } from './CarBrandLogo';
import { SAUDI_PLATE_LETTERS, toArabicPlateDigits, toEnglishPlateLetters } from '../utils/saudiPlate';

const ENGLISH_TO_ARABIC: Record<string, string> = {
  A: 'ا', B: 'ب', J: 'ح', D: 'د', R: 'ر', S: 'س', X: 'ص', T: 'ط',
  E: 'ع', G: 'ق', K: 'ك', L: 'ل', Z: 'م', N: 'ن', H: 'ه', U: 'و', V: 'ى',
};

const normalizeDigit = (char: string) => {
  const arabic = '٠١٢٣٤٥٦٧٨٩'.indexOf(char);
  const eastern = '۰۱۲۳۴۵۶۷۸۹'.indexOf(char);
  return arabic >= 0 ? String(arabic) : eastern >= 0 ? String(eastern) : char;
};

function parseStoredPlate(value?: string | null) {
  const chars = [...(value || '').trim()];
  const numbers = chars.map(normalizeDigit).filter((char) => /\d/.test(char)).slice(0, 4).join('');
  const storedArabic = chars.filter((char) => SAUDI_PLATE_LETTERS[char]).slice(0, 3);
  const storedEnglish = chars.filter((char) => /[A-Za-z]/.test(char)).map((char) => char.toUpperCase()).slice(0, 3);
  const englishLetters = storedArabic.length
    ? toEnglishPlateLetters(storedArabic.join(''))
    : storedEnglish.join(' ');
  const arabicLetters = storedArabic.length
    ? storedArabic.join(' ')
    : storedEnglish.map((char) => ENGLISH_TO_ARABIC[char]).filter(Boolean).join(' ');

  return { numbers, englishLetters, arabicLetters };
}

function MiniPlate({ value }: { value?: string | null }) {
  const { numbers, englishLetters, arabicLetters } = parseStoredPlate(value);
  const plateDigits = numbers ? [...numbers] : [];

  return (
    <div className="grid h-[62px] w-full max-w-[220px] grid-cols-2 grid-rows-2 overflow-hidden rounded-[12px] border border-surface-200 bg-white text-center text-[11px] font-extrabold text-primary-500" dir="ltr">
      <span className="flex items-center justify-center gap-1 border-b border-r border-surface-200" dir="ltr">
        {plateDigits.length ? plateDigits.map((digit, index) => <bdi key={`${digit}-${index}`} dir="ltr">{toArabicPlateDigits(digit)}</bdi>) : '—'}
      </span>
      <span className="flex items-center justify-center border-b border-surface-200" dir="rtl">{arabicLetters || '—'}</span>
      <span className="flex items-center justify-center gap-1 border-r border-surface-200" dir="ltr">{plateDigits.length ? plateDigits.map((digit, index) => <bdi key={`${digit}-${index}`} dir="ltr">{digit}</bdi>) : '—'}</span>
      <span className="flex items-center justify-center" dir="ltr">{englishLetters || '—'}</span>
    </div>
  );
}

export function CarCard({ car, onDelete, onEdit }: { car: Car; onDelete?: () => void; onEdit?: () => void }) {
  const modelDirection = /[A-Za-z]/.test(`${car.make} ${car.model}`) ? 'ltr' : 'auto';

  return (
    <div className="relative overflow-visible rounded-[20px] border border-surface-100 bg-white shadow-card transition hover:border-brand-200 hover:shadow-card-hover dark:border-surface-700 dark:bg-surface-900">
      <Link to={`/vehicles/${car.id}/history`} className="block min-h-[168px] p-4 pl-14 sm:p-5 sm:pl-16">
        <div className="flex items-start gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <CarBrandLogo make={car.make} className="h-14 w-14 rounded-[14px] p-2 sm:h-16 sm:w-16" />
            <span className="max-w-16 truncate text-[9px] font-black tracking-wide text-brand" dir="ltr">{car.make?.toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5 text-right">
            <h3 className="break-words text-[17px] font-extrabold leading-7 text-primary-500 dark:text-white sm:text-lg" dir={modelDirection}>
              {car.make}، {car.model}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-bold text-surface-500 dark:text-surface-300">
              <span className="flex items-center gap-1"><CalendarDays size={15} className="text-surface-400" />{car.year}</span>
              <span className="flex items-center gap-1"><Gauge size={16} className="text-surface-400" />{(car.mileage || 0).toLocaleString('ar-SA')} كم</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <MiniPlate value={car.plateNumber} />
        </div>
      </Link>

      {(onEdit || onDelete) && (
        <details className="absolute left-3 top-3 z-20">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-white/95 text-surface-500 shadow-sm dark:bg-surface-800 dark:text-white" aria-label="خيارات السيارة"><MoreHorizontal size={20} /></summary>
          <div className="absolute left-0 z-30 mt-1 w-28 overflow-hidden rounded-[12px] border border-surface-100 bg-white p-1 shadow-xl dark:border-surface-700 dark:bg-surface-800">
            {onEdit && <button type="button" onClick={onEdit} className="w-full rounded-[8px] px-3 py-2 text-right text-xs font-bold hover:bg-surface-50 dark:hover:bg-surface-700">تعديل</button>}
            {onDelete && <button type="button" onClick={onDelete} className="w-full rounded-[8px] px-3 py-2 text-right text-xs font-bold text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10">حذف</button>}
          </div>
        </details>
      )}
    </div>
  );
}
