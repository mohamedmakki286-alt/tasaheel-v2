import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Star, ChevronLeft, Wrench, Gift } from 'lucide-react';
import { useGuestGuard } from '../hooks/useGuestGuard';
import { workshopsApi, type ServiceCatalogCategory } from '../api/workshops.api';
import {
  OilChangeIcon, BatteryIcon, TireIcon, InspectionIcon,
  ACIcon, ElectricIcon, WashIcon, TowIcon
} from '../components/ServiceIcons';

const QUICK_SERVICES = [
  { icon: OilChangeIcon, label: 'تغيير زيت', labelEn: 'Oil Change', category: 'periodic', templateNameEn: 'Oil Change' },
  { icon: BatteryIcon, label: 'تغيير بطارية', labelEn: 'Battery', category: 'electrical', templateNameEn: 'Battery Replacement' },
  { icon: TireIcon, label: 'تغيير إطار', labelEn: 'Tire Change', category: 'emergency', templateNameEn: 'Tire Change' },
  { icon: InspectionIcon, label: 'فحص شامل', labelEn: 'Inspection', category: 'periodic', templateNameEn: 'Periodic Inspection' },
  { icon: ElectricIcon, label: 'كهرباء', labelEn: 'Electrical', category: 'electrical' },
  { icon: ACIcon, label: 'مكيف', labelEn: 'A/C', category: 'ac' },
  { icon: WashIcon, label: 'تلميع', labelEn: 'Polishing', category: 'bodywork', templateNameEn: 'Car Polishing' },
  { icon: TowIcon, label: 'سطحة', labelEn: 'Tow Truck', category: 'emergency', templateNameEn: 'Tow Truck' },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function HomePage() {
  const { t, i18n } = useTranslation();
  const tr = (ar: string, en: string) => i18n.language.startsWith('en') ? en : ar;
  const navigate = useNavigate();
  const customer = useAuthStore((s) => s.customer);
  const { showLoginSheet, closeSheet, requireAuth, pendingMessage } = useGuestGuard();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const { data: nearbyWorkshops = [] } = useQuery({ queryKey: ['home-workshops'], queryFn: () => workshopsApi.getAll(undefined, undefined, undefined) });
  const { data: serviceCatalog = [] } = useQuery<ServiceCatalogCategory[]>({
    queryKey: ['serviceCatalog'],
    queryFn: () => workshopsApi.getCatalog(),
  });
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setPosition([coords.latitude, coords.longitude]),
      () => setPosition(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);
  const orderedNearbyWorkshops = useMemo(() => nearbyWorkshops
    .map((workshop) => ({
      ...workshop,
      distanceKm: position && workshop.latitude != null && workshop.longitude != null
        && workshop.latitude !== 0 && workshop.longitude !== 0
        ? distanceKm(position[0], position[1], workshop.latitude, workshop.longitude)
        : null,
    }))
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
    .slice(0, 8), [nearbyWorkshops, position]);

  const h = new Date().getHours();
  const greetingTime = h < 12 ? tr('صباح الخير', 'Good morning') : tr('مساء الخير', 'Good evening');
  const customerName = customer?.name?.split(' ')[0] || '';
  const greeting = customerName ? (i18n.language.startsWith('en') ? `${greetingTime}, ${customerName}` : `${greetingTime} يا ${customerName}`) : greetingTime;

  const openQuickService = (service: typeof QUICK_SERVICES[number]) => {
    if (service.templateNameEn) {
      const template = serviceCatalog
        .flatMap(category => category.templates)
        .find(item => item.nameEn?.trim().toLowerCase() === service.templateNameEn?.toLowerCase());
      if (template) {
        navigate(`/services/${template.id}`);
        return;
      }
    }
    navigate('/services', { state: { category: service.category } });
  };

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div>
          <h2 className="text-xl font-black text-primary-500 dark:text-white">{greeting}</h2>
          <p className="text-surface-400 text-sm mt-0.5">{tr('كيف نقدر نخدم سياراتك اليوم؟', 'How can we help your car today?')}</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
          <input type="text" placeholder={tr('ابحث عن خدمة أو ورشة...', 'Search for a service or workshop...')} className="input-field pr-10 text-sm" />
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
          alt={tr('صيانة سيارات', 'Car maintenance')}
          className="block w-full h-[200px] sm:h-[240px] object-cover object-center"
        />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          <h1 className="text-2xl font-black leading-tight text-white">{tr('صيانة سياراتك', 'Car maintenance made')} <span className="text-brand">{tr('أسهل', 'easier')}</span></h1>
          <p className="text-white/70 text-sm mt-1">{tr('اختر الخدمة والورشة المناسبة لك', 'Choose the right service and workshop')}</p>
          <button
            onClick={() => { if (requireAuth('سجّل دخولك لطلب خدمة')) navigate('/new-request'); }}
            className="mt-3 inline-flex items-center gap-2 rounded-[12px] bg-white text-primary-500 px-5 py-2.5 text-sm font-extrabold shadow-lg transition active:scale-95 w-fit"
          >
            {tr('اطلب خدمة', 'Request Service')}
          </button>
        </div>
      </motion.div>

      {/* Quick Services - 20px spacing from banner */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary-500 dark:text-white">{tr('خدمات سريعة', 'Quick Services')}</h2>
          <button onClick={() => navigate('/services')} className="text-brand text-sm font-medium flex items-center gap-1">
            {tr('عرض الكل', 'View All')} <ChevronLeft size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK_SERVICES.map((s, i) => (
            <motion.button key={s.label} custom={i} initial="hidden" animate="visible" variants={fadeUp} onClick={() => openQuickService(s)} className="flex flex-col items-center gap-2 p-3 rounded-[14px] bg-white dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/30 hover:shadow-card-hover transition-all active:scale-95">
              <div className="w-12 h-12 rounded-[12px] bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center text-surface-600 dark:text-surface-300">
                <s.icon size={26} />
              </div>
              <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300 text-center leading-tight">{i18n.language.startsWith('en') ? s.labelEn : s.label}</span>
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
            <h2 className="font-black text-lg">{tr('العروض والباقات', 'Offers and Packages')}</h2>
            <p className="text-xs text-white/80">{tr('وفر أكثر مع باقات الورش المتكاملة', 'Save more with workshop packages')}</p>
          </div>
          <ChevronLeft size={20}/>
        </div>
      </motion.button>

      {/* Nearby Workshops */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary-500 dark:text-white">{tr('ورش قريبة', 'Nearby Workshops')}</h2>
          <button onClick={() => navigate('/workshops')} className="text-brand text-sm font-medium flex items-center gap-1">
            {tr('عرض الكل', 'View All')} <ChevronLeft size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {orderedNearbyWorkshops.map((w, i) => (
            <motion.button key={w.id} custom={i} initial="hidden" animate="visible" variants={fadeUp} onClick={() => navigate(`/workshops/${w.id}`)} className="min-w-[220px] bg-white dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/30 rounded-[16px] overflow-hidden text-right hover:shadow-card-hover transition-shadow active:scale-[0.98]">
              <div className="relative h-28 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-800 flex items-center justify-center">
                {w.coverImageUrl || w.logoUrl ? (
                  <img src={w.coverImageUrl || w.logoUrl} alt={w.name} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                ) : <span className="text-3xl font-black text-surface-400">{w.name?.trim()?.[0] || <Wrench size={32} />}</span>}
                {w.logoUrl && w.coverImageUrl && <img src={w.logoUrl} alt="" className="absolute bottom-2 right-2 h-10 w-10 rounded-xl border-2 border-white bg-white object-cover shadow" />}
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
                  {w.distanceKm != null && <span>• {w.distanceKm < 1 ? `${Math.round(w.distanceKm * 1000)} م` : `${w.distanceKm.toFixed(1)} كم`}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${w.workshopType === 'mobile' ? 'bg-success-50 text-success-500' : 'bg-blue-50 text-blue-500'}`}>
                  {w.workshopType === 'mobile' ? tr('متنقلة', 'Mobile') : tr('ثابتة', 'Workshop')}
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
          {tr('اطلب صيانة الآن', 'Request Maintenance Now')}
        </button>
      </motion.div>
    </div>
  );
}
