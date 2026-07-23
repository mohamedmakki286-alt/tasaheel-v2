import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BellRing, CalendarDays, CarFront, CheckCircle2, Droplets, FileText, Gauge } from 'lucide-react';
import client from '../api/client';
import { carsApi } from '../api/cars.api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import NumberInput from '../components/NumberInput';
import type { Car } from '../types';
import { CarBrandLogo } from '../components/CarBrandLogo';

interface CarHistoryItem {
  requestId: number;
  status: string;
  serviceTypeName: string | null;
  workshopName: string | null;
  grandTotal: number | null;
  invoiceStatus: string | null;
  reportStatus: string | null;
  createdAt: string;
}

function MiniPlate({ plate = '' }: { plate?: string }) {
  const parts = plate.trim().split(/\s+/);
  const letters = parts.filter((part) => /[A-Za-z\u0600-\u06ff]/.test(part)).join(' ');
  const numbers = parts.filter((part) => /\d/.test(part)).join(' ');
  return (
    <div className="grid h-[66px] w-[126px] shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-lg border border-surface-300 bg-white text-center text-[11px] font-black text-surface-800 shadow-sm" dir="ltr">
      <span className="flex items-center justify-center border-b border-r border-surface-300">{numbers || '١ ٢ ٣ ٤'}</span>
      <span className="flex items-center justify-center border-b border-surface-300" dir="rtl">{letters || 'أ ب ج'}</span>
      <span className="flex items-center justify-center border-r border-surface-300">{numbers || '1 2 3 4'}</span>
      <span className="flex items-center justify-center">{letters.toUpperCase() || 'A B J'}</span>
    </div>
  );
}

export default function CarHistoryPage() {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'profile' | 'orders'>('orders');
  const [mileage, setMileage] = useState('');

  const { data: car, isLoading: carLoading } = useQuery({
    queryKey: ['car-profile', carId],
    queryFn: async () => {
      const response: any = await carsApi.getAll();
      const cars = (response.data || response || []) as Car[];
      return cars.find((item) => String(item.id) === String(carId));
    },
    enabled: !!carId,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['car-history', carId],
    queryFn: async () => {
      const response = await client.get(`/customers/cars/${carId}/history`);
      return (response.data?.data || response.data || []) as CarHistoryItem[];
    },
    enabled: !!carId,
  });

  const reminderMutation = useMutation({
    mutationFn: (values: { nextOilChangeDate?: string; nextOilChangeMileage?: number; nextAppointmentDate?: string }) => carsApi.update(carId!, {
      make: car!.make,
      model: car!.model,
      year: car!.year,
      color: car!.color || '',
      plateNumber: car!.plateNumber || '',
      mileage: car!.mileage || 0,
      ...values,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-profile', carId] });
      toast.success('تم حفظ تذكيرات السيارة');
    },
    onError: () => toast.error('تعذر حفظ التذكيرات'),
  });

  if (carLoading || historyLoading) return <LoadingSpinner />;
  if (!car) return <div className="py-20 text-center text-surface-500">تعذر العثور على السيارة</div>;

  return (
    <div className="mx-auto w-full max-w-[620px] space-y-5 pb-24 pt-2" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-[25px] font-black tracking-tight text-surface-900 dark:text-white">ملف السيارة</h1>
        <button onClick={() => navigate('/vehicles', { state: { editId: car.id } })} className="text-sm font-black text-accent-500">تعديل</button>
      </div>

      <section className="rounded-[25px] border border-surface-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.035)] dark:border-surface-700 dark:bg-surface-900">
        <div className="flex min-h-[126px] items-center gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1"><CarBrandLogo make={car.make} className="h-14 w-14 rounded-xl p-2" /><span className="text-[9px] font-black tracking-wide text-accent-600">{car.make?.toUpperCase()}</span></div>
          <div className="min-w-0 flex-1 text-right">
            <h2 className="truncate text-lg font-black text-surface-900 dark:text-white">{car.make}، {car.model}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-surface-600 dark:text-surface-300">
              <span className="flex items-center gap-1.5"><CalendarDays size={17} className="text-surface-400" />{car.year}</span>
              <span className="flex items-center gap-1.5"><Gauge size={18} className="text-surface-400" />{(car.mileage || 0).toLocaleString('ar-SA')} كم</span>
            </div>
          </div>
          <div className="shrink-0"><MiniPlate plate={car.plateNumber} /></div>
        </div>
      </section>

      <div className="grid grid-cols-2 rounded-2xl bg-surface-100 p-1 dark:bg-surface-800">
        <button onClick={() => setTab('profile')} className={`rounded-xl py-3 text-sm font-black transition ${tab === 'profile' ? 'bg-white text-accent-500 shadow-sm dark:bg-surface-700' : 'text-surface-500'}`}>ملف السيارة</button>
        <button onClick={() => setTab('orders')} className={`rounded-xl py-3 text-sm font-black transition ${tab === 'orders' ? 'bg-white text-accent-500 shadow-sm dark:bg-surface-700' : 'text-surface-500'}`}>الطلبات</button>
      </div>

      {tab === 'profile' ? (
        <div className="space-y-5">
        <form
          key={`${car.nextOilChangeDate}-${car.nextOilChangeMileage}-${car.nextAppointmentDate}`}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            reminderMutation.mutate({
              nextOilChangeDate: String(data.get('nextOilChangeDate') || '') || undefined,
              nextOilChangeMileage: Number(mileage) || undefined,
              nextAppointmentDate: String(data.get('nextAppointmentDate') || '') || undefined,
            });
          }}
          className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-500/20 dark:bg-amber-500/5"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><BellRing size={22}/></div>
            <div><h3 className="font-black text-surface-900 dark:text-white">تذكيرات السيارة</h3><p className="text-xs text-surface-500">لن يفوتك تغيير الزيت أو موعد الصيانة</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-surface-600 dark:text-surface-300"><span className="mb-2 flex items-center gap-1"><Droplets size={15}/>تغيير الزيت القادم</span><input name="nextOilChangeDate" type="date" defaultValue={car.nextOilChangeDate || ''} className="input-field h-12" /></label>
            <label className="text-xs font-bold text-surface-600 dark:text-surface-300"><span className="mb-2 flex items-center gap-1"><Gauge size={15}/>عند ممشى</span><NumberInput value={mileage} onValueChange={setMileage} mode="integer" min={1} placeholder="مثال: 155000" suffix="كم" className="h-12" /></label>
            <label className="text-xs font-bold text-surface-600 dark:text-surface-300 sm:col-span-2"><span className="mb-2 flex items-center gap-1"><CalendarDays size={15}/>موعد الصيانة القادم</span><input name="nextAppointmentDate" type="date" defaultValue={car.nextAppointmentDate || ''} className="input-field h-12" /></label>
          </div>
          <button disabled={reminderMutation.isPending} className="mt-4 h-12 w-full rounded-xl bg-amber-500 font-black text-white transition hover:bg-amber-600 disabled:opacity-60">{reminderMutation.isPending ? 'جاري الحفظ...' : 'حفظ التذكيرات'}</button>
        </form>

        <section>
          <div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-black text-surface-900 dark:text-white">التقارير السابقة</h3><FileText size={20} className="text-accent-500"/></div>
          {(history || []).filter((item) => item.reportStatus).length ? (
            <div className="space-y-3">{(history || []).filter((item) => item.reportStatus).map((item) => <Link key={item.requestId} to={`/inspection-report/${item.requestId}`} className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"><div><p className="font-black text-surface-900 dark:text-white">تقرير {item.serviceTypeName || 'فحص السيارة'}</p><p className="mt-1 text-xs text-surface-400">{item.workshopName || 'الورشة'} · {new Date(item.createdAt).toLocaleDateString('ar-SA')}</p></div><FileText size={22} className="text-accent-500"/></Link>)}</div>
          ) : <div className="rounded-2xl border border-dashed border-surface-300 p-7 text-center text-sm text-surface-500 dark:border-surface-700">لا توجد تقارير سابقة لهذه السيارة</div>}
        </section>
        </div>
      ) : history?.length ? (
        <div className="space-y-3">
          {history.map((item) => (
            <Link key={item.requestId} to={`/orders/${item.requestId}`} className="block rounded-2xl border border-surface-200 bg-white p-4 transition hover:border-accent-300 dark:border-surface-700 dark:bg-surface-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-surface-900 dark:text-white">{item.serviceTypeName || 'طلب صيانة'}</p>
                  <p className="mt-1 text-xs text-surface-400">{item.workshopName || 'بانتظار اختيار الورشة'} · {new Date(item.createdAt).toLocaleDateString('ar-SA')}</p>
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 size={12} />مكتمل</span>
                </div>
                {item.grandTotal != null && <strong className="text-sm text-accent-600">{item.grandTotal.toLocaleString('ar-SA')} ر.س</strong>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent-50 text-accent-500 dark:bg-accent-500/10"><CarFront size={34} /></div>
          <h3 className="text-xl font-black text-surface-900 dark:text-white">لا توجد طلبات للسيارة</h3>
          <p className="mt-2 text-sm font-medium text-surface-500">عند وجود طلبات ستعرض هنا</p>
        </div>
      )}
    </div>
  );
}
