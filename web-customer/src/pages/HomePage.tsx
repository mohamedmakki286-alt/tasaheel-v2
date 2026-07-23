import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Bell, Star, ChevronLeft, Wrench, Gift, Percent } from 'lucide-react';
import { useGuestGuard } from '../hooks/useGuestGuard';
import { offersApi } from '../api/offers.api';
import { workshopsApi } from '../api/workshops.api';
import {
  OilChangeIcon, BatteryIcon, TireIcon, InspectionIcon,
  ACIcon, ElectricIcon, WashIcon, TowIcon
} from '../components/ServiceIcons';

const QUICK_SERVICES = [
  { icon: OilChangeIcon, label: 'تغيير زيت', category: 'periodic' },
  { icon: BatteryIcon, label: 'بطارية', category: 'electrical' },
  { icon: TireIcon, label: 'إطارات', category: 'emergency' },
  { icon: InspectionIcon, label: 'فحص شامل', category: 'periodic' },
  { icon: ElectricIcon, label: 'كهرباء', category: 'electrical' },
  { icon: ACIcon, label: 'مكيف', category: 'ac' },
  { icon: WashIcon, label: 'غسيل', category: 'bodywork' },
  { icon: TowIcon, label: 'سطحة', category: 'emergency' },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const customer = useAuthStore((s) => s.customer);
  const { showLoginSheet, closeSheet, requireAuth, pendingMessage } = useGuestGuard();
  const [bannerIdx, setBannerIdx] = useState(0);
  const { data: workshopOffers = [] } = useQuery({ queryKey: ['home-offers'], queryFn: offersApi.getAll });
  const { data: nearbyWorkshops = [] } = useQuery({ queryKey: ['home-workshops'], queryFn: () => workshopsApi.getAll(undefined, undefined, undefined) });

  const banners = workshopOffers.length
    ? workshopOffers.map((offer, index) => ({
        id: offer.id,
        title: offer.title,
        subtitle: `${offer.workshopName} · وفر ${offer.discountPercent}%`,
        workshopId: offer.workshopId,
      }))
    : [
        { id: 1, title: 'خصم 20% على الصيانة الدورية', subtitle: 'لفترة محدودة على باقات الصيانة الدورية', workshopId: null },
        { id: 2, title: 'شحن بطارية بـ 99 ر.س', subtitle: 'في موقعك خلال 30 دقيقة', workshopId: null },
      ];

  const h = new Date().getHours();
  const greetingTime = h < 12 ? 'صباح الخير' : h < 18 ? 'مساء الخير' : 'مساء الخير';
  const customerName = customer?.name?.split(' ')[0] || '';
  const greeting = customerName ? `${greetingTime} يا ${customerName}` : greetingTime;

  useEffect(() => {
    const timer = setInterval(() => setBannerIdx((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-primary-500 dark:text-white">{greeting}</h2>
            <p className="text-surface-400 text-sm mt-0.5">كيف نقدر نخدم سياراتك اليوم؟</p>
          </div>
          {isAuthenticated ? (
            <button className="relative w-10 h-10 rounded-[12px] flex items-center justify-center bg-surface-50 dark:bg-surface-800 text-surface-400 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand rounded-full border-2 border-white dark:border-surface-950 flex items-center justify-center text-[8px] font-bold text-white">3</span>
            </button>
          ) : (
            <button onClick={() => { if (!requireAuth('سجل دخولك للوصول إلى حسابك')) return; }} className="px-4 py-2 rounded-[12px] bg-brand text-white text-sm font-bold hover:bg-brand-600 transition-colors active:scale-95">
              دخول
            </button>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input type="text" placeholder="ابحث عن خدمة أو ورشة..." className="input-field pr-10 text-sm" />
        </div>
      </motion.div>

      {/* Hero Banner - Car */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative mx-4 overflow-hidden rounded-[24px] shadow-xl"
      >
        <img
          src="/hero-car.jpg"
          alt="صيانة سيارات"
          className="block w-full h-[200px] sm:h-[240px] object-cover object-center"
        />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          <h1 className="text-2xl font-black leading-tight text-white">صيانة سياراتك <span className="text-brand">أسهل</span></h1>
          <p className="text-white/70 text-sm mt-1">اختر الخدمة والورشة المناسبة لك</p>
          <button
            onClick={() => { if (requireAuth('سجّل دخولك لطلب خدمة')) navigate('/new-request'); }}
            className="mt-3 inline-flex items-center gap-2 rounded-[12px] bg-white text-primary-500 px-5 py-2.5 text-sm font-extrabold shadow-lg transition active:scale-95 w-fit"
          >
            اطلب خدمة
          </button>
        </div>
      </motion.div>

      {/* Quick Services - 20px spacing from banner */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary-500 dark:text-white">خدمات سريعة</h2>
          <button onClick={() => navigate('/services')} className="text-brand text-sm font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_SERVICES.map((s, i) => (
            <motion.button key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp} onClick={() => navigate('/services', { state: { category: s.category } })} className="flex flex-col items-center gap-2 p-3 rounded-[14px] bg-white dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/30 hover:shadow-card-hover transition-all active:scale-95">
              <div className="w-12 h-12 rounded-[12px] bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center text-surface-600 dark:text-surface-300">
                <s.icon size={26} />
              </div>
              <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300 text-center leading-tight">{s.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Offers Banner */}
      <motion.button
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        onClick={() => navigate('/offers')}
        className="relative w-full overflow-hidden rounded-[16px] bg-brand p-4 text-right text-white shadow-lg shadow-brand/15 active:scale-[0.99]"
      >
        <div className="absolute -left-5 -top-7 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-3 -bottom-7 h-20 w-20 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-white/20"><Gift size={25}/></div>
          <div className="flex-1">
            <h2 className="font-black text-lg">العروض والباقات</h2>
            <p className="text-xs text-white/80">وفر أكثر مع باقات الورش المتكاملة</p>
          </div>
          <ChevronLeft size={20}/>
        </div>
      </motion.button>

      {/* Promo Banner Carousel */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="relative">
        <div className="overflow-hidden rounded-[16px]">
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -45) setBannerIdx((v) => (v + 1) % banners.length);
              if (info.offset.x > 45) setBannerIdx((v) => (v - 1 + banners.length) % banners.length);
            }}
            animate={{ x: `${-bannerIdx * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            className="flex cursor-grab active:cursor-grabbing"
          >
            {banners.map((b) => (
              <button key={b.id} onClick={() => b.workshopId ? navigate(`/workshops/${b.workshopId}`) : navigate('/offers')} className="min-w-full bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700/30 rounded-[16px] p-4 flex items-center justify-between text-right">
                <div>
                  <p className="font-bold text-sm text-primary-500 dark:text-white">{b.title}</p>
                  <p className="text-surface-400 text-xs mt-1">{b.subtitle}</p>
                </div>
                <div className="w-10 h-10 rounded-[10px] bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Percent size={18} className="text-brand" />
                </div>
              </button>
            ))}
          </motion.div>
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? 'bg-brand w-5' : 'bg-surface-300 dark:bg-surface-600'}`} />
          ))}
        </div>
      </motion.div>

      {/* Nearby Workshops */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary-500 dark:text-white">ورش قريبة</h2>
          <button onClick={() => navigate('/workshops')} className="text-brand text-sm font-medium flex items-center gap-1">
            عرض الكل <ChevronLeft size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {nearbyWorkshops.map((w, i) => (
            <motion.button key={w.id} custom={i} initial="hidden" animate="visible" variants={fadeUp} onClick={() => navigate(`/workshops/${w.id}`)} className="min-w-[220px] bg-white dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/30 rounded-[16px] overflow-hidden text-right hover:shadow-card-hover transition-shadow active:scale-[0.98]">
              <div className="h-28 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center">
                <Wrench size={32} className="text-surface-400 dark:text-surface-500" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm text-primary-500 dark:text-white truncate">{w.name}</p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star size={12} className="fill-gold-400 text-gold-400" />
                    <span className="text-xs font-bold text-surface-500">{w.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-surface-400 mb-2">
                  <MapPin size={11} />
                  <span>{w.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.workshopType === 'mobile' ? 'bg-success-50 text-success-500' : 'bg-blue-50 text-blue-500'}`}>
                    {w.workshopType === 'mobile' ? 'متنقلة' : 'ثابتة'}
                  </span>
                  <span className="text-[10px] text-surface-400">{w.services?.split(',').slice(0, 2).join(' · ')}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <button
          onClick={() => { if (!requireAuth('سجل دخولك لإنشاء طلب صيانة')) return; navigate('/new-request'); }}
          className="w-full py-4 rounded-[16px] font-bold bg-brand hover:bg-brand-600 text-white text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-brand/15"
        >
          <Wrench size={20} />
          اطلب صيانة الآن
        </button>
      </motion.div>
    </div>
  );
}
