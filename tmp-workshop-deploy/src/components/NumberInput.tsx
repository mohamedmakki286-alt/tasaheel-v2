import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  suffix?: string;
}

function normalizeArabicNumerals(str: string): string {
  const arabicNums = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/[٠-٩]/g, (d) => String(arabicNums.indexOf(d)));
}

export default function NumberInput({
  value, onChange, min = 0, max, step = 1, precision = 0,
  placeholder, className = '', disabled = false, required = false, suffix,
}: NumberInputProps) {
  const handleChange = (raw: string) => {
    const normalized = normalizeArabicNumerals(raw).replace(/[^\d.\-]/g, '');
    if (normalized === '' || normalized === '-') { onChange(0); return; }
    const num = parseFloat(normalized);
    if (!isNaN(num)) onChange(num);
  };

  const increment = () => {
    const current = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const next = Math.min(current + step, max ?? Infinity);
    onChange(parseFloat(next.toFixed(precision)));
  };

  const decrement = () => {
    const current = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const next = Math.max(current - step, min ?? -Infinity);
    onChange(parseFloat(next.toFixed(precision)));
  };

  const displayValue = typeof value === 'number' ?
    (precision > 0 ? value.toFixed(precision) : (value || '').toString()) :
    normalizeArabicNumerals(value || '');

  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <button type="button" onClick={decrement} disabled={disabled}
        className="flex-shrink-0 w-10 h-full flex items-center justify-center rounded-r-xl border border-l-0 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 transition-colors">
        <Minus size={16} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="flex-1 min-w-0 h-11 text-center border-y border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 font-semibold text-sm focus:outline-none focus:ring-0 focus:border-primary-400"
      />
      {suffix && <span className="text-xs text-surface-400 px-1">{suffix}</span>}
      <button type="button" onClick={increment} disabled={disabled}
        className="flex-shrink-0 w-10 h-full flex items-center justify-center rounded-l-xl border border-r-0 border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-30 transition-colors">
        <Plus size={16} />
      </button>
    </div>
  );
}
