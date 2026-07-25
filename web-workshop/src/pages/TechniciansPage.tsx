import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createTechnician, deleteTechnician, getTechnicians, updateTechnician } from '../api/technicians.api';
import type { Technician, TechnicianPayload } from '../types';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const specialties = [
  ['mechanic', 'ميكانيكا عامة'],
  ['electrician', 'كهرباء السيارات'],
  ['bodywork', 'سمكرة'],
  ['painter', 'دهان'],
  ['ac', 'تكييف'],
  ['tires', 'إطارات'],
  ['glass', 'زجاج'],
  ['battery', 'بطاريات'],
  ['general', 'فني عام'],
] as const;

function statusOf(technician: Technician): 'available' | 'busy' | 'offline' {
  if (!technician.isOnline) return 'offline';
  return technician.availabilityStatus === 'busy' ? 'busy' : 'available';
}

function TechnicianForm({ technician, onClose }: { technician?: Technician | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const editing = !!technician;
  const [form, setForm] = useState<TechnicianPayload>({
    name: technician?.name || '',
    phone: technician?.phone || '',
    email: technician?.email || '',
    password: '',
    specialty: technician?.specialty || '',
  });
  const mutation = useMutation({
    mutationFn: () => editing ? updateTechnician(technician.id, form) : createTechnician(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success(editing ? 'تم تحديث بيانات الفني' : 'تمت إضافة الفني');
      onClose();
    },
    onError: () => toast.error('تعذر حفظ بيانات الفني'),
  });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-200 p-5 dark:border-surface-700">
          <div><h2 className="font-bold text-surface-900 dark:text-white">{editing ? 'تعديل الفني' : 'إضافة فني'}</h2><p className="text-xs text-surface-400">بيانات الحساب والتخصص</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={19} /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="space-y-4 p-5">
          <div><label className="label">اسم الفني</label><input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">رقم الجوال</label><input required className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xxxxxxxx" /></div>
            <div><label className="label">التخصص</label><select required className="input-field" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}><option value="">اختر</option>{specialties.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          </div>
          <div><label className="label">البريد الإلكتروني</label><input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          {!editing && <div><label className="label">كلمة المرور</label><input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>}
          <div className="flex gap-3"><button disabled={mutation.isPending} className="btn-primary flex-1">{mutation.isPending ? 'جاري الحفظ…' : 'حفظ'}</button><button type="button" onClick={onClose} className="btn-secondary">إلغاء</button></div>
        </form>
      </div>
    </div>
  );
}

export default function TechniciansPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [editing, setEditing] = useState<Technician | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Technician | null>(null);
  const { data: technicians = [], isLoading } = useQuery({ queryKey: ['technicians'], queryFn: getTechnicians });
  const remove = useMutation({
    mutationFn: deleteTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setDeleting(null);
      toast.success('تم حذف الفني');
    },
    onError: () => toast.error('تعذر حذف الفني'),
  });

  const filtered = useMemo(() => technicians.filter((technician) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${technician.name} ${technician.phone} ${technician.specialty}`.toLowerCase().includes(query);
    return matchesSearch && (filter === 'all' || statusOf(technician) === filter);
  }), [technicians, search, filter]);
  const counts = {
    available: technicians.filter((item) => statusOf(item) === 'available').length,
    busy: technicians.filter((item) => statusOf(item) === 'busy').length,
    offline: technicians.filter((item) => statusOf(item) === 'offline').length,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-surface-900 dark:text-white">الفنيون</h1><p className="mt-1 text-sm text-surface-500 dark:text-surface-400">إدارة الفريق ومعرفة الجاهزية التشغيلية</p></div>
        <button onClick={() => setEditing(null)} className="btn-primary shrink-0"><Plus size={17} /> إضافة فني</button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card p-4"><p className="text-2xl font-bold">{technicians.length}</p><p className="text-xs text-surface-400">إجمالي الفريق</p></div>
        <div className="stat-card p-4"><p className="text-2xl font-bold text-success-500">{counts.available}</p><p className="text-xs text-surface-400">متاح الآن</p></div>
        <div className="stat-card p-4"><p className="text-2xl font-bold text-primary-500">{counts.busy}</p><p className="text-xs text-surface-400">مشغول</p></div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" placeholder="ابحث بالاسم أو التخصص…" /></div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            ['all', 'الكل', technicians.length],
            ['available', 'متاح', counts.available],
            ['busy', 'مشغول', counts.busy],
            ['offline', 'غير متصل', counts.offline],
          ] as const).map(([value, label, count]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'tab-item-active whitespace-nowrap' : 'tab-item whitespace-nowrap'}>{label} <span className="text-xs">{count}</span></button>)}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="card flex items-center gap-3 p-4"><Skeleton variant="circular" width={40} height={40} /><div className="flex-1"><Skeleton variant="text" width="35%" /><Skeleton variant="text" width="55%" /></div></div>)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="لا توجد نتائج" description="غيّر البحث أو أضف فنيًا جديدًا." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((technician) => {
            const status = statusOf(technician);
            const label = status === 'available' ? 'متاح الآن' : status === 'busy' ? 'مشغول' : 'غير متصل';
            return (
              <article key={technician.id} className="card grid gap-3 p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(150px,.7fr)_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold text-white">{technician.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
                  <div className="min-w-0"><p className="truncate font-semibold">{technician.name}</p><p className="truncate text-xs text-surface-400">{specialties.find(([value]) => value === technician.specialty)?.[1] || technician.specialty} · {technician.phone}</p></div>
                </div>
                <div><span className={`badge ${status === 'available' ? 'badge-success' : status === 'busy' ? 'badge-pending' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>{label}</span><p className="mt-1 text-xs text-surface-400">{technician.isActive ? 'الحساب نشط' : 'الحساب موقوف'}</p></div>
                <div className="flex justify-end gap-1 border-t border-surface-100 pt-3 sm:border-0 sm:pt-0 dark:border-surface-800"><button onClick={() => setEditing(technician)} className="btn-secondary px-3 py-2 text-xs"><Pencil size={14} /> تعديل</button><button onClick={() => setDeleting(technician)} className="rounded-lg p-2 text-surface-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10"><Trash2 size={16} /></button></div>
              </article>
            );
          })}
        </div>
      )}

      {editing !== undefined && <TechnicianForm technician={editing} onClose={() => setEditing(undefined)} />}
      {deleting && <div className="modal-overlay" onClick={() => setDeleting(null)}><div className="modal-content max-w-sm p-5 text-center" onClick={(e) => e.stopPropagation()}><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-danger-50 text-danger-500 dark:bg-danger-500/10"><AlertCircle /></div><h2 className="font-bold">حذف الفني؟</h2><p className="mt-1 text-sm text-surface-500">{deleting.name}</p><div className="mt-5 flex gap-3"><button onClick={() => remove.mutate(deleting.id)} className="btn-danger flex-1">حذف</button><button onClick={() => setDeleting(null)} className="btn-secondary flex-1">إلغاء</button></div></div></div>}
    </div>
  );
}
