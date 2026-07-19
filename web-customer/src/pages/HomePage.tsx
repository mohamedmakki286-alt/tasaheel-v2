import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Bell, Car, Star, ChevronLeft, ChevronRight, Wrench, Zap, Gift } from 'lucide-react';
import { useGuestGuard } from '../hooks/useGuestGuard';
import LoginBottomSheet from '../components/LoginBottomSheet';
import { offersApi } from '../api/offers.api';

const PROMO_BANNERS = [
  { id: 1, title: 'خصم 30% على الصيانة الدورية', subtitle: 'العرض ساري هذا الأسبوع', bg: 'from-accent-500 to-accent-600', icon: '🏷️' },
  { id: 2, title: 'شحن بطارية بـ 99 ر.س', subtitle: 'في موقعك خلال 30 دقيقة', bg: 'from-emerald-500 to-emerald-600', icon: '🔋' },
  { id: 3, title: 'فحص شامل مجاني', subtitle: 'مع أي صيانة دورية', bg: 'from-blue-500 to-blue-600', icon: '🔍' },
];

const QUICK_SERVICES = [
  { icon: '🛢️', label: 'تغيير زيت', category: 'periodic' },
  { icon: '🔋', label: 'بطارية', category: 'electrical' },
  { icon: '🛞', label: 'إطارات', category: 'tires' },
  { icon: '🚨', label: 'ونش سحاب', category: 'emergency' },
  { icon: '🔍', label: 'فحص شامل', category: 'inspection' },
  { icon: '🧴', label: 'غسيل', category: 'bodywork', search: 'غسيل' },
  { icon: '🎨', label: 'سمكرة ودهان', category: 'bodywork' },
  { icon: '⚡', label: 'كهرباء', category: 'electrical' },
];

const MOCK_WORKSHOPS = [
  { id: 1, name: 'ورشة التقنية', rating: 4.7, distance: '2.3 كم', city: 'الرياض', price: 'من 150 ر.س', type: 'stationary' },
  { id: 2, name: 'ورشة الإتقان', rating: 4.9, distance: '5.1 كم', city: 'جدة', price: 'من 200 ر.س', type: 'stationary' },
  { id: 3, name: 'ورشة الصيانة السريعة', rating: 4.5, distance: '3.8 كم', city: 'الرياض', price: 'من 120 ر.س', type: 'mobile' },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

export function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { showLoginSheet, closeSheet, requireAuth, pendingMessage } = useGuestGuard();
  const [bannerIdx, setBannerIdx] = useState(0);
  const { data: workshopOffers = [] } = useQuery({ queryKey: ['home-offers'], queryFn: offersApi.getAll });
  const banners = workshopOffers.length ? workshopOffers.map((offer, index) => ({ id: offer.id, title: offer.title, subtitle: `${offer.workshopName} · وفر ${offer.discountPercent}%`, bg: ['from-accent-500 to-accent-600', 'from-emerald-500 to-emerald-600', 'from-blue-500 to-blue-600'][index % 3], icon: index === 0 ? '🏷️' : index === 1 ? '❄️' : '🔋', workshopId: offer.workshopId })) : PROMO_BANNERS;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'صباح الخير' : h < 18 ? 'مساء الخير' : 'مساء الخير';

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx((p) => (p + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="space-y-6">
      {/* Greeting + Location */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-surface-500 dark:text-surface-400 text-sm">{greeting} 👋</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin size={14} className="text-accent-500" />
              <span className="text-surface-900 dark:text-white font-bold">الرياض</span>
            </div>
          </div>
          {isAuthenticated ? (
            <button className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-surface-100 dark:bg-surface-800 text-surface-500 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-500 rounded-full border-2 border-white dark:border-surface-950 flex items-center justify-center text-[8px] font-bold text-white">3</span>
            </button>
          ) : (
            <button onClick={() => { if (!requireAuth('سجل دخولك للوصول إلى حسابك')) return; }} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-600 transition-colors active:scale-95">
              دخول
            </button>
          )}
        </div>
      </motion.div>

      {/* Tasaheel brand hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#171719] via-[#0b0b0d] to-[#56080c] px-5 py-6 text-white shadow-2xl shadow-red-950/20"
      >
        <div className="absolute -left-8 -top-10 h-36 w-36 rounded-full bg-red-500/25 blur-3xl" />
        <div className="absolute -bottom-14 right-16 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-amber-300 ring-1 ring-white/10">كل مشوار أسهل</span>
            <h1 className="mt-3 text-2xl font-black leading-tight">العناية بسيارتك<br /><span className="text-red-400">تبدأ من هنا</span></h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => { if (requireAuth('سجّل دخولك لطلب خدمة لسيارتك')) navigate('/new-request', { state: { quickMode: true } }); }} className="inline-flex items-center gap-2 rounded-xl bg-[#D71920] px-4 py-2.5 text-sm font-extrabold shadow-lg shadow-red-900/40 transition active:scale-95">
                <Zap size={17} /> اطلب عروض بسرعة
              </button>
              <button onClick={() => { if (requireAuth('سجّل دخولك لطلب خدمة لسيارتك')) navigate('/new-request'); }} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95">
                <Wrench size={15} /> طلب مفصل
              </button>
            </div>
          </div>
          <div className="relative h-28 w-32 shrink-0">
            <motion.div animate={{ rotate: [-12, 12, -12] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-2xl bg-amber-400 text-zinc-900 shadow-lg"><Wrench size={21} /></motion.div>
            <motion.div animate={{ x: [8, -8, 8], y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-4 right-0 grid h-16 w-28 place-items-center rounded-[24px] bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-950/40">
              <Car size={46} strokeWidth={1.8} />
            </motion.div>
            <div className="absolute bottom-0 right-1 h-px w-28 bg-gradient-to-l from-transparent via-white/70 to-transparent" />
          </div>
        </div>
      </motion.section>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input type="text" placeholder="ابحث عن خدمة أو ورشة..." className="input-field pr-10 text-sm" />
        </div>
      </motion.div>

      {/* Promo Banner Carousel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="relative">
        <div className="overflow-hidden rounded-2xl">
          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -45) setBannerIdx((value) => (value + 1) % banners.length); if (info.offset.x > 45) setBannerIdx((value) => (value - 1 + banners.length) % banners.length); }} animate={{ x: `${-bannerIdx * 100}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} className="flex cursor-grab active:cursor-grabbing">
            {banners.map((b) => (
              <button key={b.id} onClick={() => 'workshopId' in b && b.workshopId ? navigate(`/workshops/${b.workshopId}`) : navigate('/offers')} className={`min-w-full bg-gradient-to-l ${b.bg} rounded-2xl p-5 flex items-center justify-between text-right`}>
                <div className="text-white">
                  <p className="font-bold text-lg">{b.title}</p>
                  <p className="text-white/80 text-sm mt-1">{b.subtitle}</p>
                </div>
                <span className="text-4xl">{b.icon}</span>
              </button>
            ))}
          </motion.div>
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? 'bg-accent-500 w-5' : 'bg-surface-300 dark:bg-surface-600'}`} />
          ))}
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        onClick={() => navigate('/offers')}
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-l from-red-600 via-red-500 to-amber-400 p-4 text-right text-white shadow-lg shadow-red-500/20 active:scale-[0.99]"
      >
        <div className="absolute -left-5 -top-7 h-24 w-24 rounded-full bg-white/15" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20"><Gift size={25}/></div>
          <div className="flex-1"><h2 className="font-black">العروض والباقات</h2><p className="text-xs text-white/80">وفر أكثر مع باقات الورش المتكاملة</p></div>
          <ChevronLeft size={20}/>
        </div>
      </motion.button>

      {/* Quick Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-surface-900 dark:text-white">خدمات سريعة</h2>
          <button onClick={() => navigate('/services')} className="text-accent-500 text-sm font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_SERVICES.map((s, i) => (
            <motion.button key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp} onClick={() => navigate('/services', { state: { category: s.category, search: s.search } })} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[11px] font-medium text-surface-700 dark:text-surface-300">{s.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Nearby Workshops */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-surface-900 dark:text-white">ورش قريبة</h2>
          <button onClick={() => navigate('/workshops')} className="text-accent-500 text-sm font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {MOCK_WORKSHOPS.map((w, i) => (
            <motion.button key={w.id} custom={i} initial="hidden" animate="visible" variants={fadeUp} onClick={() => navigate(`/workshops/${w.id}`)} className="min-w-[200px] bg-surface-50 dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/30 rounded-2xl p-4 text-right hover:shadow-lg transition-shadow active:scale-[0.98]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                  <Wrench size={20} className="text-accent-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-surface-900 dark:text-white text-sm truncate">{w.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs text-surface-500">{w.rating}</span>
                    <span className="text-surface-300 dark:text-surface-600 mx-0.5">·</span>
                    <span className="text-xs text-surface-500">{w.distance}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-accent-500 font-bold">{w.price}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${w.type === 'mobile' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                  {w.type === 'mobile' ? 'متنقلة' : 'ثابتة'}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <button
          onClick={() => { if (!requireAuth('سجل دخولك لإنشاء طلب صيانة')) return; navigate('/new-request'); }}
          className="w-full py-4 rounded-2xl font-bold bg-accent-500 hover:bg-accent-600 text-white text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-accent-500/20"
        >
          <Wrench size={20} />
          اطلب صيانة الآن
        </button>
      </motion.div>

      <LoginBottomSheet isOpen={showLoginSheet} onClose={closeSheet} message={pendingMessage} />
    </div>
  );
}
