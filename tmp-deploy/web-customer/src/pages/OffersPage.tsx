import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Gift, MapPin, Star, Tag } from 'lucide-react';
import { offersApi } from '../api/offers.api';
import { useGuestGuard } from '../hooks/useGuestGuard';

export default function OffersPage() {
  const navigate = useNavigate();
  const { requireAuth } = useGuestGuard();
  const { data: offers = [], isLoading } = useQuery({ queryKey:['public-offers'], queryFn:offersApi.getAll });
  return <div className="space-y-5 pb-24">
    <div className="rounded-3xl bg-gradient-to-l from-red-700 via-red-600 to-amber-500 p-6 text-white shadow-xl"><Gift size={34}/><h1 className="mt-3 text-2xl font-black">العروض والباقات</h1><p className="mt-1 text-sm text-white/80">خدمات متكاملة وأسعار خاصة من ورش موثوقة</p></div>
    {isLoading ? <div className="grid sm:grid-cols-2 gap-4">{[1,2,3,4].map(i=><div key={i} className="card h-44 animate-pulse"/>)}</div> : offers.length===0 ? <div className="card p-10 text-center"><Gift size={42} className="mx-auto text-surface-300"/><h2 className="mt-3 font-bold">لا توجد عروض نشطة حاليًا</h2><p className="text-sm text-surface-500">ستظهر هنا عروض الورش الجديدة</p></div> : <div className="grid sm:grid-cols-2 gap-4">{offers.map(o=><article key={o.id} className="card overflow-hidden p-0"><div className="h-2 bg-gradient-to-l from-red-500 to-amber-400"/><div className="p-5"><div className="flex justify-between gap-3"><div><span className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><Tag size={13}/>{o.type==='package'?'باقة متكاملة':'عرض خاص'}</span><h2 className="mt-1 text-lg font-black text-surface-900 dark:text-white">{o.title}</h2></div>{o.discountPercent>0&&<span className="h-fit rounded-full bg-red-500 px-2.5 py-1 text-xs font-black text-white">وفر {o.discountPercent}%</span>}</div><p className="mt-2 text-sm text-surface-600 dark:text-surface-300">{o.serviceNames}</p><div className="mt-3 flex items-center gap-3 text-xs text-surface-500"><span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400"/>{o.workshopRating?.toFixed(1)}</span><span className="flex items-center gap-1"><MapPin size={13}/>{o.workshopCity}</span></div><button onClick={()=>navigate(`/workshops/${o.workshopId}`)} className="mt-2 text-sm font-bold text-accent-600">{o.workshopName}</button><div className="mt-4 flex items-end justify-between"><div><strong className="text-2xl text-red-600">{o.offerPrice} ر.س</strong>{o.originalPrice?<span className="mr-2 text-sm text-surface-400 line-through">{o.originalPrice}</span>:null}</div><button onClick={()=>{if(requireAuth('سجل دخولك لطلب الباقة')) navigate('/new-request',{state:{workshopId:o.workshopId,offerName:o.title}})}} className="btn-primary px-5">اطلبها</button></div>{o.description&&<p className="mt-3 border-t border-surface-200 pt-3 text-xs text-surface-500 dark:border-surface-700">{o.description}</p>}</div></article>)}</div>}
  </div>;
}
