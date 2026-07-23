import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, CarFront } from 'lucide-react';
import { BRANDS } from '../utils/carBrands';

interface BrandPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function BrandPicker({ value, onChange }: BrandPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBrand = useMemo(
    () => BRANDS.find((b) => b.nameAr === value || b.aliases.some((a) => a.toLowerCase() === value.toLowerCase())),
    [value]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return BRANDS;
    const q = search.trim().toLowerCase().replace(/[أإآ]/g, 'ا');
    return BRANDS.filter(
      (b) =>
        b.nameAr.includes(search.trim()) ||
        b.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [search]);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="input-field h-14 flex items-center gap-3 w-full text-right"
      >
        {selectedBrand ? (
          <>
            <img src={`/car-brands/${selectedBrand.key}.svg`} alt="" className="h-7 w-7 shrink-0 object-contain" />
            <span className="flex-1 text-right font-semibold">{selectedBrand.nameAr}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="shrink-0 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              <X className="h-4 w-4 text-surface-400" />
            </button>
          </>
        ) : value ? (
          <>
            <CarFront className="h-6 w-6 shrink-0 text-surface-400" />
            <span className="flex-1 text-right font-semibold">{value}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="shrink-0 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"
            >
              <X className="h-4 w-4 text-surface-400" />
            </button>
          </>
        ) : (
          <>
            <CarFront className="h-6 w-6 shrink-0 text-surface-300" />
            <span className="flex-1 text-right text-surface-400">اختر ماركة السيارة</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden animate-scale-in">
          <div className="p-3 border-b border-surface-100 dark:border-surface-800">
            <div className="relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن ماركة..."
                className="w-full bg-surface-50 dark:bg-surface-800 rounded-xl py-2.5 pr-9 pl-3 text-sm text-surface-700 dark:text-surface-200 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-3">
            {filtered.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-surface-400 mb-3">لم يتم العثور على "{search}"</p>
                <button
                  type="button"
                  onClick={() => { onChange(search); setOpen(false); }}
                  className="text-sm font-bold text-brand hover:text-brand/80"
                >
                  استخدام "{search}" كماركة مخصصة
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {filtered.map((brand) => (
                  <button
                    key={brand.key}
                    type="button"
                    onClick={() => { onChange(brand.nameAr); setOpen(false); }}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all ${
                      value === brand.nameAr
                        ? 'bg-brand/10 ring-2 ring-brand'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                  >
                    <img src={`/car-brands/${brand.key}.svg`} alt={brand.nameAr} className="h-8 w-8 object-contain" />
                    <span className="text-[10px] font-bold text-surface-700 dark:text-surface-300 leading-tight text-center line-clamp-2">
                      {brand.nameAr}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
