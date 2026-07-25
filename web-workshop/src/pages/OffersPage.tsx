import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BadgePercent, CalendarDays, MoreHorizontal, Gift, Package, Pencil, Plus,
  Search, Tag, Trash2, X,
} from 'lucide-react';
import { offersApi, type OfferInput, type WorkshopOffer } from '../api/offers.api';
import NumberInput from '../components/NumberInput';

const empty: OfferInput = {
  title: '', description: '', type: 'package', serviceNames: '',
  originalPrice: 0, offerPrice: 0, startDate: '', endDate: '', isActive: true,
};

function toInput(offer: WorkshopOffer): OfferInput {
  return {
    title: offer.title,
    description: offer.description || '',
    type: offer.type,
    serviceNames: offer.serviceNames || '',
    originalPrice: offer.originalPrice || 0,
    offerPrice: offer.offerPrice,
    startDate: offer.startDate || '',
    endDate: offer.endDate || '',
    isActive: offer.isActive,
  };
}

function offerState(offer: WorkshopOffer): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (!offer.isActive) return 'inactive';
  const today = new Date().toISOString().slice(0, 10);
  if (offer.startDate && offer.startDate > today) return 'scheduled';
  if (offer.endDate && offer.endDate < today) return 'expired';
  return 'active';
}

const stateLabels = {
  active: 'نشط',
  scheduled: 'مجدول',
  expired: 'منتهي',
  inactive: 'متوقف',
};

export default function OffersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WorkshopOffer | null>(null);
  const [form, setForm] = useState<OfferInput>(empty);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'package' | 'offer'>('all');
  const [menuId, setMenuId] = useState<number | null>(null);
  const { data: offers = [], isLoading } = useQuery({ queryKey: ['my-offers'], queryFn: offersApi.getMine });

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(empty);
  };
  const save = useMutation({
    mutationFn: (data: OfferInput) => editing ? offersApi.update(editing.id, data) : offersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-offers'] });
      toast.success(editing ? 'تم تحديث الباقة بنجاح' : 'تم نشر العرض بنجاح');
      closeForm();
    },
    onError: () => toast.error('تعذر حفظ الباقة أو العرض'),
  });
  const remove = useMutation({
    mutationFn: offersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-offers'] });
      toast.success('تم حذف العرض');
    },
    onError: () => toast.error('تعذر حذف العرض'),
  });

  const filtered = useMemo(() => offers.filter((offer) => {
    const typeMatches = filter === 'all' || offer.type === filter;
    const query = search.trim().toLowerCase();
    const searchMatches = !query || `${offer.title} ${offer.serviceNames || ''}`.toLowerCase().includes(query);
    return typeMatches && searchMatches;
  }), [offers, filter, search]);
  const activeCount = offers.filter((offer) => offerState(offer) === 'active').length;
  const scheduledCount = offers.filter((offer) => offerState(offer) === 'scheduled').length;

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  };
  const openEdit = (offer: WorkshopOffer) => {
    setEditing(offer);
    setForm(toInput(offer));
    setShowForm(true);
    setMenuId(null);
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">الباقات والعروض</h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">أنشئ عروضاً واضحة وتابع صلاحيتها وإدارتها</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex shrink-0 items-center gap-2">
          <Plus size={17} /> إنشاء جديد
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card p-4"><p className="text-2xl font-bold">{offers.length}</p><p className="text-xs text-surface-400">الإجمالي</p></div>
        <div className="stat-card p-4"><p className="text-2xl font-bold text-success-500">{activeCount}</p><p className="text-xs text-surface-400">نشطة الآن</p></div>
        <div className="stat-card p-4"><p className="text-2xl font-bold text-primary-500">{scheduledCount}</p><p className="text-xs text-surface-400">مجدولة</p></div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="input-field pr-10" placeholder="ابحث في الباقات والعروض…" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            ['all', 'الكل', offers.length],
            ['package', 'الباقات', offers.filter((o) => o.type === 'package').length],
            ['offer', 'العروض', offers.filter((o) => o.type === 'offer').length],
          ] as const).map(([value, label, count]) => (
            <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'tab-item-active whitespace-nowrap' : 'tab-item whitespace-nowrap'}>
              {label} <span className="text-xs">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ ...form, startDate: form.startDate || undefined, endDate: form.endDate || undefined });
          }}
          className="card relative space-y-4 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-surface-900 dark:text-white">{editing ? 'تعديل الباقة أو العرض' : 'إنشاء باقة أو عرض'}</h2>
              <p className="text-xs text-surface-400">أكمل البيانات التي ستظهر للعملاء</p>
            </div>
            <button type="button" onClick={closeForm} className="rounded-xl p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18} /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">النوع</label><select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="package">باقة متكاملة</option><option value="offer">عرض وخصم</option></select></div>
            <div><label className="label">الاسم</label><input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: باقة الصيانة الدورية" /></div>
          </div>
          <div><label className="label">الخدمات المشمولة</label><input className="input-field" value={form.serviceNames} onChange={(e) => setForm({ ...form, serviceNames: e.target.value })} placeholder="تغيير زيت، فلتر زيت، فحص فرامل" /></div>
          <div><label className="label">الوصف والشروط</label><textarea rows={3} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">السعر السابق</label><NumberInput value={String(form.originalPrice)} onValueChange={(v) => setForm({ ...form, originalPrice: Number(v) || 0 })} mode="decimal" decimalScale={2} /></div>
            <div><label className="label">سعر العرض</label><NumberInput value={String(form.offerPrice)} onValueChange={(v) => setForm({ ...form, offerPrice: Number(v) || 0 })} mode="decimal" decimalScale={2} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">من تاريخ</label><input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="label">حتى تاريخ</label><input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> متاحة للعملاء</label>
          <button disabled={save.isPending} className="btn-primary w-full">{save.isPending ? 'جاري الحفظ…' : editing ? 'حفظ التعديلات' : 'نشر للعملاء'}</button>
        </form>
      )}

      {isLoading ? (
        <div className="card h-32 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center"><Gift className="mx-auto text-primary-500" size={42} /><h2 className="mt-3 font-bold">لا توجد نتائج</h2><p className="text-sm text-surface-500">أنشئ باقة جديدة أو غيّر البحث.</p></div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((offer) => {
            const state = offerState(offer);
            return (
              <article key={offer.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                      {offer.type === 'package' ? <Package size={19} /> : <BadgePercent size={19} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{offer.title}</h2><span className="badge badge-pending">{stateLabels[state]}</span></div>
                      <p className="mt-0.5 text-xs text-surface-400">{offer.type === 'package' ? 'باقة' : 'عرض خصم'}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuId(menuId === offer.id ? null : offer.id)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="المزيد"><MoreHorizontal size={18} /></button>
                    {menuId === offer.id && (
                      <div className="absolute left-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-surface-200 bg-white py-1 shadow-xl dark:border-surface-700 dark:bg-surface-900">
                        <button onClick={() => openEdit(offer)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800"><Pencil size={14} /> تعديل</button>
                        <button onClick={() => { if (confirm('حذف العرض؟')) remove.mutate(offer.id); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"><Trash2 size={14} /> حذف</button>
                      </div>
                    )}
                  </div>
                </div>
                {offer.serviceNames && <p className="mt-3 line-clamp-2 text-sm text-surface-500 dark:text-surface-400">{offer.serviceNames}</p>}
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{offer.offerPrice} ر.س</span>
                  {!!offer.originalPrice && <span className="text-sm text-surface-400 line-through">{offer.originalPrice} ر.س</span>}
                  {offer.discountPercent > 0 && <span className="badge badge-danger">خصم {offer.discountPercent}%</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-100 pt-3 text-xs text-surface-400 dark:border-surface-800">
                  <span className="flex items-center gap-1"><CalendarDays size={13} />{offer.startDate || 'من الآن'} — {offer.endDate || 'بدون نهاية'}</span>
                  <button onClick={() => openEdit(offer)} className="btn-secondary px-3 py-1.5 text-xs"><Pencil size={13} /> تعديل</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
