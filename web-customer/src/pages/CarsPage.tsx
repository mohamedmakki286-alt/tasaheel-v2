import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { carsApi } from '../api/cars.api';
import type { Car } from '../types';
import { CarCard } from '../components/CarCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowRight, CarFront, Check, ChevronDown, Plus, X } from 'lucide-react';
import NumberInput from '../components/NumberInput';
import BrandPicker from '../components/BrandPicker';

const currentYear = new Date().getFullYear();
const emptyForm = { make: '', model: '', year: currentYear, color: '', plateNumber: '', mileage: 0 };
const safePlateLetters: Record<string, string> = {
  '\u0627': 'A', '\u0623': 'A', '\u0628': 'B', '\u062D': 'J', '\u062F': 'D', '\u0631': 'R',
  '\u0633': 'S', '\u0635': 'X', '\u0637': 'T', '\u0639': 'E', '\u0642': 'G', '\u0643': 'K',
  '\u0644': 'L', '\u0645': 'Z', '\u0646': 'N', '\u0647': 'H', '\u0648': 'U', '\u0649': 'V', '\u064A': 'V',
};
const safeArabicDigits = '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669';
const normalizePlateDigit = (char: string) => {
  const arabic = safeArabicDigits.indexOf(char);
  const eastern = '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9'.indexOf(char);
  return arabic >= 0 ? String(arabic) : eastern >= 0 ? String(eastern) : char;
};

const saudiPlateLetters: Record<string, string> = {
  ا: 'A', أ: 'A', ب: 'B', ح: 'J', د: 'D', ر: 'R', س: 'S', ص: 'X',
  ط: 'T', ع: 'E', ق: 'G', ك: 'K', ل: 'L', م: 'Z', ن: 'N', ه: 'H', هـ: 'H',
  و: 'U', ى: 'V', ي: 'V',
};

function parsePlate(value: string) {
  const normalized = [...value].map(normalizePlateDigit).join('');
  const numbers = normalized.replace(/\D/g, '').slice(0, 4).split('');
  const letters = [...normalized]
    .map((char) => char === 'ة' ? 'ه' : char)
    .map((char) => ({ '\u0622': '\u0627', '\u0623': '\u0627', '\u0625': '\u0627', '\u0629': '\u0647', '\u064A': '\u0649' }[char] || char))
    .filter((char) => safePlateLetters[char])
    .slice(0, 3);
  return { numbers, letters };
}

function formatPlateInput(value: string) {
  const { numbers, letters } = parsePlate(value);
  return [...letters, ...numbers].join(' ');
}

function SaudiPlatePreview({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const parsed = parsePlate(value);
  const arabicNumbers = parsed.numbers.map((digit) => safeArabicDigits[Number(digit)] || digit).join(' ');
  const englishNumbers = parsed.numbers.length ? parsed.numbers.join('  ') : '1  2  3  4';
  const arabicLetters = parsed.letters.join(' ');
  const englishLetters = parsed.letters.length ? parsed.letters.map((letter) => safePlateLetters[letter]).join('  ') : 'A  B  J';

  const updatePlate = (letters: string[], numbers: string[]) => {
    onChange([...letters, ...numbers].join(' '));
  };

  return (
    <div className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-[20px] border-[3px] border-black bg-white shadow-lg sm:rounded-[28px] sm:border-[4px]">
      <div className="grid aspect-[2.12/1] min-h-[132px] grid-cols-[1fr_58px] sm:min-h-[190px] sm:grid-cols-[1fr_82px]" dir="ltr">
        <div className="grid grid-rows-2 divide-y-[4px] divide-black text-black">
          <div className="grid grid-cols-2 divide-x-[4px] divide-black">
            <div className="flex items-center justify-center px-3">
              <input
                value={parsed.numbers.join('')}
                onChange={(e) => updatePlate(parsed.letters, parsePlate(e.target.value).numbers)}
                inputMode="numeric"
                style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}
                aria-label="أرقام اللوحة"
                placeholder="١ ٢ ٣ ٤"
                dir="ltr"
                className="w-full bg-transparent text-center text-lg font-extrabold tracking-[0.12em] text-primary-500 outline-none placeholder:text-surface-300 sm:text-2xl sm:tracking-[0.18em]"
              />
            </div>
            <div className="flex items-center justify-center px-3">
              <input
                value={arabicLetters}
                onChange={(e) => updatePlate(parsePlate(e.target.value).letters, parsed.numbers)}
                aria-label="حروف اللوحة"
                placeholder="أ ب ح"
                dir="rtl"
                className="w-full bg-transparent text-center text-lg font-extrabold tracking-[0.12em] text-primary-500 outline-none placeholder:text-surface-300 sm:text-2xl sm:tracking-[0.18em]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x-[4px] divide-black">
            <div className="flex items-center justify-center text-xl font-extrabold text-surface-600">{englishNumbers}</div>
            <div className="flex items-center justify-center text-xl font-extrabold text-surface-600">{englishLetters}</div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-around border-l-[4px] border-black py-3 text-black">
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 48 40" className="h-9 w-10 fill-none stroke-black stroke-[2.3]" aria-hidden="true">
              <path d="M24 21V7m0 4c-4-5-8-5-11-3 5 0 7 3 8 6m3-3c4-5 8-5 11-3-5 0-7 3-8 6m-3-6c-1-5 1-7 3-8 0 4-1 7-3 9m0 0c1-5-1-7-3-8 0 4 1 7 3 9" />
              <path d="M9 25c8 7 21 8 30 0M39 25c-8 7-21 8-30 0" />
            </svg>
            <span className="text-[10px] font-bold leading-none">السعودية</span>
          </div>
          <span className="text-xl font-extrabold leading-none">K</span>
          <span className="text-xl font-extrabold leading-none">S</span>
          <span className="text-xl font-extrabold leading-none">A</span>
          <span className="h-6 w-6 rounded-full bg-black" />
        </div>
      </div>
    </div>
  );
}

export function CarsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { openAdd?: boolean; editId?: string; returnTo?: string; requestState?: Record<string, unknown> } | null;
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const years = useMemo(() => Array.from({ length: 45 }, (_, index) => currentYear + 1 - index), []);

  const load = () => {
    setLoading(true);
    carsApi.getAll().then((res: any) => {
      setCars(res.data || res || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (routeState?.openAdd) {
      setEditingId(null);
      setForm(emptyForm);
      setShowForm(true);
    }
  }, [routeState?.openAdd]);

  useEffect(() => {
    if (routeState?.editId && cars.length) {
      const car = cars.find((item) => String(item.id) === String(routeState.editId));
      if (car) openEdit(car);
    }
  }, [routeState?.editId, cars]);

  const closeForm = () => {
    if (routeState?.returnTo && !editingId) {
      navigate(routeState.returnTo, { replace: true, state: routeState.requestState });
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (car: Car) => {
    setEditingId(car.id);
    setForm({ make: car.make, model: car.model, year: car.year, color: car.color || '', plateNumber: car.plateNumber || '', mileage: car.mileage || 0 });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.mileage) delete payload.mileage;
      if (!payload.color) delete payload.color;
      if (!payload.plateNumber) delete payload.plateNumber;
      if (editingId) {
        await carsApi.update(editingId, payload);
        toast.success(t('toast.success.carUpdated'));
      } else {
        const response: any = await carsApi.create(payload);
        const created = response?.data || response;
        toast.success(t('toast.success.carAdded'));
        if (routeState?.returnTo && created?.id) {
          navigate(routeState.returnTo, {
            replace: true,
            state: { ...routeState.requestState, selectedCarId: created.id },
          });
          return;
        }
      }
      closeForm();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.carSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('pages.cars.deleteConfirm'))) return;
    try {
      await carsApi.delete(id);
      toast.success(t('toast.success.carDeleted'));
      load();
    } catch {
      toast.error(t('toast.error.carDeleteFailed'));
    }
  };

  if (loading && !showForm) return <LoadingSpinner />;

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 pb-28 animate-fade-in" dir="rtl">
        <div className="flex items-center justify-between border-b border-surface-100 pb-4 dark:border-surface-800">
          <button type="button" onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-[12px] text-surface-400 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800" aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-bold text-brand">تساهيل</p>
            <h2 className="text-xl font-extrabold text-primary-500 dark:text-white">{editingId ? 'تعديل السيارة' : 'إضافة سيارة'}</h2>
          </div>
          <button type="button" onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-[12px] text-surface-400 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <SaudiPlatePreview value={form.plateNumber} onChange={(plateNumber) => setForm({ ...form, plateNumber: formatPlateInput(plateNumber) })} />
          <p className="mt-3 text-center text-xs text-surface-400">أدخل الحروف والأرقام داخل اللوحة، وستظهر الترجمة الإنجليزية تلقائيًا</p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-primary-500 dark:text-surface-100">ماركة السيارة</label>
              <BrandPicker value={form.make} onChange={(make) => setForm({ ...form, make })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-primary-500 dark:text-surface-100">موديل السيارة</label>
              <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required className="input-field h-14 font-semibold" placeholder="مثال: كامري" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-primary-500 dark:text-surface-100">سنة الصنع</label>
              <div className="relative">
                <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required className="input-field h-14 appearance-none pl-10 text-center text-lg font-bold">
                  {years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-surface-400" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-primary-500 dark:text-surface-100">لون السيارة</label>
              <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="input-field h-14 font-semibold" placeholder="مثال: أبيض لؤلؤي" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-primary-500 dark:text-surface-100">ممشى السيارة</label>
            <NumberInput
              value={String(form.mileage || '')}
              onValueChange={(v) => setForm({ ...form, mileage: Number(v) || 0 })}
              mode="integer"
              placeholder="مثال: 150000"
              suffix="كم"
            />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-[72px] z-30 mx-auto max-w-2xl px-4 lg:bottom-4">
          <button type="submit" disabled={saving || !form.make || !form.model} className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-[16px] text-base font-extrabold shadow-lg shadow-brand/20">
            {saving ? 'جارٍ الحفظ...' : <><Check className="h-5 w-5" />{editingId ? 'حفظ التعديلات' : 'إضافة السيارة'}</>}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-6 pb-24 pt-2 animate-fade-in sm:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-black tracking-tight text-primary-500 dark:text-white">{t('pages.cars.title')}</h2>
        </div>
        <button
          onClick={openAdd}
          className="flex h-11 items-center gap-2 rounded-[12px] bg-brand px-4 text-white shadow-md shadow-brand/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
          aria-label="إضافة سيارة جديدة"
        >
          <Plus className="h-5 w-5" strokeWidth={2.6} />
          <span className="text-sm font-extrabold">إضافة سيارة</span>
        </button>
      </div>

      {cars.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-surface-300 bg-surface-50/80 p-7 text-center dark:border-surface-700 dark:bg-surface-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[16px] bg-brand-50 text-brand dark:bg-brand-500/10">
            <CarFront className="h-8 w-8" />
          </div>
          <EmptyState title={t('pages.cars.emptyTitle')} description={t('pages.cars.emptyDesc')} />
        </div>
      ) : (
        <div className="space-y-4">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} onDelete={() => handleDelete(car.id)} onEdit={() => openEdit(car)} />
          ))}
        </div>
      )}
    </div>
  );
}
