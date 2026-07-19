import { CalendarDays, Gauge, MoreHorizontal, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Car } from '../types';
import { CarBrandLogo } from './CarBrandLogo';

function MiniPlate({ value = '' }: { value?: string }) {
  const tokens = value.trim().split(/\s+/);
  const letters = tokens.filter((token) => /[A-Za-z\u0600-\u06ff]/.test(token)).join(' ');
  const numbers = tokens.filter((token) => /\d/.test(token)).join(' ');
  return (
    <div className="grid h-[64px] w-[124px] shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-xl border border-surface-300 bg-white text-center text-[10px] font-black text-surface-800" dir="ltr">
      <span className="flex items-center justify-center border-b border-r border-surface-300">{numbers || '١ ٢ ٣ ٤'}</span>
      <span className="flex items-center justify-center border-b border-surface-300" dir="rtl">{letters || 'أ ب ج'}</span>
      <span className="flex items-center justify-center border-r border-surface-300">{numbers || '1 2 3 4'}</span>
      <span className="flex items-center justify-center">{letters.toUpperCase() || 'A B J'}</span>
    </div>
  );
}

export function CarCard({ car, onDelete, onEdit }: { car: Car; onDelete?: () => void; onEdit?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[25px] border border-surface-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.035)] transition hover:border-accent-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.07)] dark:border-surface-700 dark:bg-surface-900">
      <Link to={`/vehicles/${car.id}/history`} className="flex min-h-[142px] items-center gap-3 p-4 sm:min-h-[150px] sm:p-5">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <CarBrandLogo make={car.make} className="h-14 w-14 rounded-xl p-2 sm:h-16 sm:w-16" />
          <span className="text-[9px] font-black tracking-wide text-accent-600">{car.make?.toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <h3 className="truncate text-[17px] font-black text-surface-900 dark:text-white sm:text-lg">{car.make}، {car.model}</h3>
          <div className="mt-2 flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1 text-[13px] font-bold text-surface-600 dark:text-surface-300">
            <span className="flex items-center gap-1"><CalendarDays size={16} className="text-surface-400" />{car.year}</span>
            <span className="flex items-center gap-1"><Gauge size={17} className="text-surface-400" />{(car.mileage || 0).toLocaleString('ar-SA')} كم</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3">
          <Star size={23} className="text-surface-300" strokeWidth={1.8} />
          <MiniPlate value={car.plateNumber} />
        </div>
      </Link>
      {(onEdit || onDelete) && (
        <details className="absolute left-3 top-3">
          <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-white/90 text-surface-600 shadow-sm dark:bg-surface-800 dark:text-white"><MoreHorizontal size={20} /></summary>
          <div className="absolute left-0 z-20 mt-1 w-28 overflow-hidden rounded-xl border border-surface-200 bg-white p-1 shadow-xl dark:border-surface-700 dark:bg-surface-800">
            {onEdit && <button onClick={onEdit} className="w-full rounded-lg px-3 py-2 text-right text-xs font-bold hover:bg-surface-100 dark:hover:bg-surface-700">تعديل</button>}
            {onDelete && <button onClick={onDelete} className="w-full rounded-lg px-3 py-2 text-right text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">حذف</button>}
          </div>
        </details>
      )}
    </div>
  );
}
