import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Wrench, Building2, ChevronLeft, Truck, Shield, Clock, Phone, MessageCircle } from 'lucide-react';
import { workshopsApi } from '../api/workshops.api';
import type { Workshop } from '../types';

const CITIES = [
  { value: 'الرياض', key: 'riyadh' },
  { value: 'جدة', key: 'jeddah' },
  { value: 'الدمام', key: 'dammam' },
  { value: 'مكة', key: 'makkah' },
  { value: 'المدينة المنورة', key: 'madinah' },
];

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

function isOpenNow(workingHours?: string): boolean | null {
  if (!workingHours) return null;
  try {
    const hours = JSON.parse(workingHours);
    if (!Array.isArray(hours)) return null;
    const now = new Date();
    const dayIndex = now.getDay() === 6 ? 0 : now.getDay() + 1;
    const today = hours[dayIndex];
    if (!today || today.closed) return false;
    const [oh, om] = today.open.split(':').map(Number);
    const [ch, cm] = today.close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    if (closeMinutes === 0 && openMinutes > 0) return currentMinutes >= openMinutes;
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch { return null; }
}

export function WorkshopsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const { data: workshops, isLoading } = useQuery({
    queryKey: ['workshops', city, search],
    queryFn: () => workshopsApi.getAll(city || undefined, undefined, search || undefined),
  });

  const getServiceList = (services: string) => {
    return services.split(',').slice(0, 3).map((s) => s.trim());
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={12} className={star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-300 dark:text-surface-600'} />
        ))}
        <span className="text-xs text-surface-400 mr-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getWorkshopTypeLabel = (type: string) => {
    if (type === 'mobile') return t('constants.workshopTypes.mobile');
    if (type === 'both') return t('constants.workshopTypes.both', 'ثابتة ومتنقلة');
    return t('constants.workshopTypes.stationary');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t('pages.workshops.title')}</h1>
        <p className="text-surface-400 text-sm mt-1">{t('pages.workshops.subtitle')}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('pages.workshops.searchPlaceholder')} className="input-field pr-9" />
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field w-auto sm:w-auto">
            <option value="">{t('pages.workshops.allCities')}</option>
            {CITIES.map((c) => (
              <option key={c.value} value={c.value}>{t(`constants.cities.${c.key}`)}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-100 dark:bg-surface-800/50 rounded-2xl p-5 animate-pulse border border-surface-200 dark:border-surface-700/20">
              <div className="h-32 bg-surface-200 dark:bg-surface-700 rounded-xl mb-3" />
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : workshops && workshops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workshops.map((w, i) => (
            <motion.div
              key={w.id}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => navigate(`/workshops/${w.id}`)}
              className="group bg-white dark:bg-surface-800/60 backdrop-blur-sm border border-surface-200/60 dark:border-surface-700/30 rounded-2xl overflow-hidden hover:border-accent-500/30 hover:shadow-lg hover:shadow-accent-500/5 transition-all duration-300 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="h-32 bg-gradient-to-br from-accent-500/10 via-surface-100 to-surface-200 dark:from-surface-800 dark:via-surface-800 dark:to-surface-700 relative">
                {w.coverImageUrl ? (
                  <img src={w.coverImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={36} className="text-accent-400/40 dark:text-accent-400/20" />
                  </div>
                )}
                {/* Open/Closed badge */}
                {isOpenNow(w.workingHours) !== null && (
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${isOpenNow(w.workingHours) ? 'bg-emerald-500 text-white' : 'bg-surface-800/70 text-white backdrop-blur-sm'}`}>
                    {isOpenNow(w.workingHours) ? t('pages.workshopDetail.openNow') : t('pages.workshopDetail.closedNow')}
                  </div>
                )}
                {/* Verified badge */}
                {w.isApproved && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center gap-1">
                    <Shield size={10} /> {t('pages.workshopDetail.verified')}
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {/* Name & Type */}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-surface-900 dark:text-white group-hover:text-accent-500 transition-colors truncate">{w.name}</h3>
                    {w.logoUrl && (
                      <img src={w.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-surface-200 dark:border-surface-700 shrink-0 ml-2" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-surface-400">
                      <MapPin size={11} />
                      <span className="truncate">{w.city}</span>
                    </div>
                    <span className="text-surface-300 dark:text-surface-600">·</span>
                    <span className="text-[10px] text-surface-400">{getWorkshopTypeLabel(w.workshopType)}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  {renderStars(w.rating)}
                  {w.reviewCount !== undefined && w.reviewCount > 0 && (
                    <span className="text-[10px] text-surface-400">({w.reviewCount})</span>
                  )}
                </div>

                {/* Services tags */}
                {w.services && (
                  <div className="flex flex-wrap gap-1.5">
                    {getServiceList(w.services).map((svc) => (
                      <span key={svc} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-600/30">
                        {svc}
                      </span>
                    ))}
                    {w.services.split(',').length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700/50 text-surface-400">
                        +{w.services.split(',').length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Quick actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-surface-100 dark:border-surface-700/30">
                  {w.phone && (
                    <a href={`tel:${w.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-700/30 text-surface-500 hover:text-emerald-500 transition-colors text-[10px]">
                      <Phone size={10} /> {t('pages.workshopDetail.call')}
                    </a>
                  )}
                  {w.whatsapp && (
                    <a href={`https://wa.me/${w.whatsapp}`} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-700/30 text-surface-500 hover:text-emerald-500 transition-colors text-[10px]">
                      <MessageCircle size={10} /> WA
                    </a>
                  )}
                  <div className="flex-1" />
                  <ChevronLeft size={14} className="text-surface-300 dark:text-surface-600 group-hover:text-accent-500 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Building2 size={48} className="text-surface-300 dark:text-surface-600 mx-auto mb-4" />
          <p className="text-surface-400">{t('pages.workshops.empty')}</p>
        </div>
      )}
    </div>
  );
}
