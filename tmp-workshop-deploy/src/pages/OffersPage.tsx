import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Gift, Plus, Trash2, Tag } from 'lucide-react';
import { offersApi, type OfferInput } from '../api/offers.api';
import NumberInput from '../components/NumberInput';

const empty: OfferInput = { title: '', description: '', type: 'package', serviceNames: '', originalPrice: 0, offerPrice: 0, startDate: '', endDate: '', isActive: true };

export default function OffersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<OfferInput>(empty);
  const { data: offers = [], isLoading } = useQuery({ queryKey: ['my-offers'], queryFn: offersApi.getMine });
  const create = useMutation({ mutationFn: offersApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-offers'] }); setForm(empty); setShowForm(false); toast.success('تم نشر العرض'); }, onError: () => toast.error('تعذر حفظ العرض') });
  const remove = useMutation({ mutationFn: offersApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: ['my-offers'] }) });

  return <div className="space-y-5 pb-24">
    <div className="flex items-center justify-between gap-3">
      <div><h1 className="text-xl font-black text-surface-900 dark:text-white">الباقات والعروض</h1><p className="text-sm text-surface-500">اجمع خدماتك في باقة أو قدم خصمًا للعملاء</p></div>
      <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={17}/> إنشاء</button>
    </div>

    {showForm && <form onSubmit={e => { e.preventDefault(); create.mutate({ ...form, startDate: form.startDate || undefined, endDate: form.endDate || undefined }); }} className="card p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">نوع المنشور</label><select className="input-field" value={form.type} onChange={e => setForm({...form,type:e.target.value})}><option value="package">باقة متكاملة</option><option value="offer">عرض وخصم</option></select></div>
        <div><label className="label">اسم الباقة أو العرض</label><input required className="input-field" value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="مثال: باقة الصيانة الدورية"/></div>
      </div>
      <div><label className="label">الخدمات المشمولة</label><input className="input-field" value={form.serviceNames} onChange={e => setForm({...form,serviceNames:e.target.value})} placeholder="تغيير زيت، فلتر، فحص فرامل"/><p className="text-xs text-surface-400 mt-1">افصل بين الخدمات بفاصلة</p></div>
      <div><label className="label">الوصف والشروط</label><textarea rows={3} className="input-field" value={form.description} onChange={e => setForm({...form,description:e.target.value})}/></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="label">السعر قبل العرض</label><NumberInput value={form.originalPrice || 0} onChange={v => setForm({...form,originalPrice:v})} step={0.5} precision={2} /></div><div><label className="label">سعر العرض</label><NumberInput value={form.offerPrice || 0} onChange={v => setForm({...form,offerPrice:v})} step={0.5} precision={2} required /></div></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="label">من تاريخ</label><input type="date" className="input-field" value={form.startDate} onChange={e => setForm({...form,startDate:e.target.value})}/></div><div><label className="label">حتى تاريخ</label><input type="date" className="input-field" value={form.endDate} onChange={e => setForm({...form,endDate:e.target.value})}/></div></div>
      <button disabled={create.isPending} className="btn-primary w-full">{create.isPending ? 'جاري النشر...' : 'نشر للعملاء'}</button>
    </form>}

    {isLoading ? <div className="card h-32 animate-pulse"/> : offers.length === 0 ? <div className="card p-10 text-center"><Gift className="mx-auto text-primary-500" size={42}/><h2 className="mt-3 font-bold">لا توجد باقات بعد</h2><p className="text-sm text-surface-500">أنشئ أول باقة لتظهر للعملاء</p></div> : <div className="grid md:grid-cols-2 gap-4">{offers.map(o => <div key={o.id} className="card p-5 relative overflow-hidden"><div className="flex justify-between gap-3"><div><span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600"><Tag size={13}/>{o.type === 'package' ? 'باقة' : 'عرض'}</span><h2 className="font-black text-lg mt-1">{o.title}</h2><p className="text-sm text-surface-500 mt-1">{o.serviceNames}</p></div>{o.discountPercent > 0 && <span className="h-fit rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">-{o.discountPercent}%</span>}</div><div className="mt-4 flex items-end justify-between"><div><span className="text-xl font-black text-primary-600">{o.offerPrice} ر.س</span>{o.originalPrice ? <span className="mr-2 text-sm text-surface-400 line-through">{o.originalPrice}</span>:null}</div><button onClick={() => confirm('حذف العرض؟') && remove.mutate(o.id)} className="p-2 text-red-500"><Trash2 size={17}/></button></div></div>)}</div>}
  </div>;
}
