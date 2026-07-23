import { useState, useCallback, useEffect } from 'react';

function normalizeArabicNumerals(str: string): string {
  const arabicNums = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/[٠-٩]/g, (d) => String(arabicNums.indexOf(d)));
}

function cleanRaw(raw: string): string {
  let normalized = normalizeArabicNumerals(raw);
  normalized = normalized.replace(/،/g, '.');
  return normalized.replace(/[^\d.\-]/g, '');
}

interface NumericInputProps {
  value: string;
  onValueChange: (raw: string) => void;
  mode?: 'integer' | 'decimal';
  decimalScale?: number;
  min?: number;
  max?: number;
  suffix?: string;
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  'aria-label'?: string;
}

export default function NumberInput({
  value,
  onValueChange,
  mode = 'decimal',
  decimalScale = 2,
  min,
  max,
  suffix,
  allowEmpty = true,
  placeholder,
  className = '',
  disabled = false,
  required = false,
  error = false,
  'aria-label': ariaLabel,
}: NumericInputProps) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    setInternal(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const cleaned = cleanRaw(raw);

      if (cleaned === '' || cleaned === '-') {
        if (allowEmpty || cleaned === '-') {
          setInternal(cleaned);
          onValueChange(cleaned);
        }
        return;
      }

      if (mode === 'decimal') {
        const parts = cleaned.split('.');
        if (parts.length > 2) return;
        if (parts.length === 2 && parts[1].length > decimalScale) return;
        if (!/^-?\d*\.?\d*$/.test(cleaned)) return;
      } else {
        if (!/^-?\d*$/.test(cleaned)) return;
      }

      if (cleaned !== '' && cleaned !== '-') {
        const num = parseFloat(cleaned);
        if (min !== undefined && num < min) return;
        if (max !== undefined && num > max) return;
      }

      setInternal(cleaned);
      onValueChange(cleaned);
    },
    [mode, decimalScale, min, max, allowEmpty, onValueChange],
  );

  const handleBlur = useCallback(() => {
    if (internal.trim() === '' || internal === '-') {
      if (allowEmpty) {
        setInternal('');
        onValueChange('');
      }
      return;
    }
    const num = parseFloat(internal);
    if (isNaN(num)) return;

    let formatted: string;
    if (mode === 'decimal') {
      formatted = num.toFixed(decimalScale);
    } else {
      formatted = String(Math.round(num));
    }

    setInternal(formatted);
    onValueChange(formatted);
  }, [internal, mode, decimalScale, allowEmpty, onValueChange]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        inputMode={mode === 'decimal' ? 'decimal' : 'numeric'}
        value={internal}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        className={`w-full h-11 ${suffix ? 'pl-12' : 'px-3'} pr-3 rounded-xl border ${
          error
            ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
            : 'border-surface-200 dark:border-surface-700 focus:ring-primary-400/30 focus:border-primary-400'
        } bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 font-semibold text-sm focus:outline-none focus:ring-2 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        dir="ltr"
        style={{ textAlign: suffix ? 'right' : 'center' }}
      />
      {suffix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 pointer-events-none select-none whitespace-nowrap">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Convert any value to a string for use as the `value` prop */
export function toNumStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return '';
}

/** Convert a raw string value to a number, returning `undefined` for empty */
export function toNum(v: string): number | undefined {
  const trimmed = v.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return isNaN(n) ? undefined : n;
}

/** Convert a raw string value to a number, returning 0 for empty */
export function toNum0(v: string): number {
  const trimmed = v.trim();
  if (trimmed === '') return 0;
  const n = Number(trimmed);
  return isNaN(n) ? 0 : n;
}
