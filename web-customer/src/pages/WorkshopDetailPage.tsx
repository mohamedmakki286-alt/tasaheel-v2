import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MapPin, Star, Wrench, Clock, Phone, ArrowRight, CheckCircle2, Timer, Truck, Shield,
  Sparkles, ExternalLink, MessageCircle, Globe, MessageSquare, Instagram, Youtube, Twitter,
  Wifi, Armchair, Coffee, BadgeCheck, ParkingCircle, Droplets, Camera, X, Share2, Video
} from 'lucide-react';
import { workshopsApi } from '../api/workshops.api';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const FEATURE_MAP: Record<string, { label: string; icon: any }> = {
  waiting_area: { label: 'غرفة انتظار', icon: Armchair },
  wifi: { label: 'واي فاي', icon: Wifi },
  coffee: { label: 'قهوة ومشروبات', icon: Coffee },
  warranty: { label: 'ضمان', icon: Shield },
  pickup_delivery: { label: 'استلام وتسليم', icon: Truck },
  original_parts: { label: 'قطع أصلية', icon: BadgeCheck },
  parking: { label: 'موقف سيارات', icon: ParkingCircle },
  car_wash: { label: 'غسيل سيارات', icon: Droplets },
};

function getOpenStatus(workingHours?: string): { text: string; isOpen: boolean } | null {
  if (!workingHours) return null;
  try {
    const hours = JSON.parse(workingHours);
    if (!Array.isArray(hours)) return null;
    const now = new Date();
    const dayIndex = now.getDay() === 6 ? 0 : now.getDay() + 1;
    const today = hours[dayIndex];
    if (!today) return null;
    if (today.closed) return { text: 'مغلق', isOpen: false };
    const [oh, om] = today.open.split(':').map(Number);
    const [ch, cm] = today.close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = oh * 60 + om;
    const closeMinutes = ch * 60 + cm;
    if (closeMinutes === 0 && openMinutes > 0) {
      return currentMinutes >= openMinutes ? { text: 'مفتوح', isOpen: true } : { text: 'مغلق', isOpen: false };
    }
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes ? { text: 'مفتوح', isOpen: true } : { text: 'مغلق', isOpen: false };
  } catch { return null; }
}

export function WorkshopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const formatPrice = (p: number) => p.toLocaleString('ar-SA') + ' ' + t('common.sar');

  const { data: workshop, isLoading: wLoading } = useQuery({
    queryKey: ['workshop', id],
    queryFn: () => workshopsApi.getById(Number(id)),
    enabled: !!id,
  });

  const { data: serviceListings } = useQuery({
    queryKey: ['workshop-service-listings', id],
    queryFn: () => workshopsApi.getServiceListings(Number(id)),
    enabled: !!id,
  });

  const { data: reviews, isLoading: rLoading } = useQuery({
    queryKey: ['workshop-reviews', id],
    queryFn: () => workshopsApi.getReviews(Number(id)),
    enabled: !!id,
  });

  const hasServiceListings = serviceListings && serviceListings.length > 0;
  const serviceList = workshop?.services ? workshop.services.split(',').map((s) => s.trim()) : [];
  const features = workshop?.features ? workshop.features.split(',').filter(Boolean) : [];
  const gallery = workshop?.gallery || [];
  const openStatus = getOpenStatus(workshop?.workingHours);

  const handleRequestService = () => {
    if (workshop) {
      navigate('/new-request', { state: { workshopId: workshop.id } });
    }
  };

  const serviceCount = hasServiceListings ? serviceListings!.length : serviceList.length;

  if (wLoading) {
    return (
      <div className="space-y-5 animate-pulse max-w-3xl mx-auto pb-28">
        <div className="h-56 bg-surface-100 dark:bg-surface-800/50 rounded-3xl" />
        <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-surface-100 dark:bg-surface-800/50 rounded-2xl" />)}</div>
        <div className="h-48 bg-surface-100 dark:bg-surface-800/50 rounded-2xl" />
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="text-center py-16">
        <p className="text-surface-400">{t('pages.workshopDetail.notFound')}</p>
        <button onClick={() => navigate('/workshops')} className="text-accent-400 mt-3 text-sm">{t('pages.workshopDetail.backToList')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-28">
      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 left-4 text-white p-2"><X size={24} /></button>
          <img src={lightboxImage} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}

      {/* Cover Image / Hero */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="relative rounded-3xl overflow-hidden h-56 bg-gradient-to-br from-surface-800 to-surface-900">
          {workshop.coverImageUrl ? (
            <img src={workshop.coverImageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Wrench size={48} className="text-surface-600" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Back button */}
          <button onClick={() => navigate('/workshops')} className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs">
            <ArrowRight size={14} /> {t('pages.workshopDetail.back')}
          </button>

          {/* Workshop Info overlay */}
          <div className="absolute bottom-0 right-0 left-0 p-5">
            <div className="flex items-end gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white">{workshop.name}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  {openStatus && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${openStatus.isOpen ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {openStatus.isOpen ? t('pages.workshopDetail.openNow') : t('pages.workshopDetail.closedNow')}
                    </span>
                  )}
                  {workshop.isApproved && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center gap-1">
                      <Shield size={10} /> {t('pages.workshopDetail.verified')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-white text-sm font-semibold">{workshop.rating?.toFixed(1)}</span>
                  <span className="text-white/60 text-xs">({workshop.reviewCount || 0})</span>
                  <span className="text-white/40">·</span>
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <MapPin size={11} /> {workshop.city}
                  </span>
                </div>
              </div>
              {workshop.logoUrl && (
                <img src={workshop.logoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg shrink-0" />
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Action Buttons */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className="grid grid-cols-4 gap-2">
          {workshop.phone && (
            <a href={`tel:${workshop.phone}`} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/30 hover:border-accent-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Phone size={18} className="text-emerald-500" />
              </div>
              <span className="text-[10px] font-semibold text-surface-600 dark:text-surface-300">{t('pages.workshopDetail.call')}</span>
            </a>
          )}
          {workshop.whatsapp && (
            <a href={`https://wa.me/${workshop.whatsapp}`} target="_blank" rel="noopener" className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/30 hover:border-accent-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <MessageCircle size={18} className="text-green-500" />
              </div>
              <span className="text-[10px] font-semibold text-surface-600 dark:text-surface-300">{t('pages.workshopDetail.whatsapp')}</span>
            </a>
          )}
          {workshop.latitude && workshop.longitude && (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${workshop.latitude},${workshop.longitude}`} target="_blank" rel="noopener" className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/30 hover:border-accent-500/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <MapPin size={18} className="text-blue-500" />
              </div>
              <span className="text-[10px] font-semibold text-surface-600 dark:text-surface-300">{t('pages.workshopDetail.directions')}</span>
            </a>
          )}
          <button onClick={handleRequestService} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-accent-200/60 dark:border-accent-700/30 hover:border-accent-500/30 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center">
              <Sparkles size={18} className="text-accent-500" />
            </div>
            <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400">{t('pages.workshopDetail.requestService', { name: '' }).trim()}</span>
          </button>
        </div>
      </motion.div>

      {/* Description */}
      {workshop.description && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-3">
              <Shield size={16} className="text-accent-400" />
              {t('pages.workshopDetail.description')}
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{workshop.description}</p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-50 dark:bg-surface-800/40 rounded-2xl p-3.5 text-center border border-surface-200 dark:border-surface-700/20">
            <Star size={18} className="text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">{workshop.rating?.toFixed(1)}</p>
            <p className="text-[10px] text-surface-400">{t('pages.workshopDetail.rating')}</p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800/40 rounded-2xl p-3.5 text-center border border-surface-200 dark:border-surface-700/20">
            <CheckCircle2 size={18} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">{workshop.completedJobs || 0}</p>
            <p className="text-[10px] text-surface-400">{t('pages.workshopDetail.completedJobs')}</p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800/40 rounded-2xl p-3.5 text-center border border-surface-200 dark:border-surface-700/20">
            <Timer size={18} className="text-accent-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">{workshop.averageResponseTimeMinutes || '-'}</p>
            <p className="text-[10px] text-surface-400">{t('pages.workshopDetail.responseTime')}</p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800/40 rounded-2xl p-3.5 text-center border border-surface-200 dark:border-surface-700/20">
            <Wrench size={18} className="text-sky-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-surface-900 dark:text-white">{serviceCount}</p>
            <p className="text-[10px] text-surface-400">{t('pages.workshopDetail.services')}</p>
          </div>
        </div>
      </motion.div>

      {/* Services */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
        <div className="card p-5">
          <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
            <Wrench size={16} className="text-accent-400" />
            {t('pages.workshopDetail.allServices')}
          </h3>
          {hasServiceListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {serviceListings!.filter((s) => s.isVisible && s.isAvailable).map((svc) => (
                <div key={svc.id} className="flex items-center justify-between bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 rounded-xl px-4 py-3 hover:border-accent-500/20 transition-colors">
                  <div className="min-w-0">
                    <span className="text-sm text-surface-700 dark:text-surface-200 block truncate">{svc.name}</span>
                    {svc.categoryName && (
                      <span className="text-[10px] text-accent-500 dark:text-accent-400 block truncate mt-0.5">
                        {svc.categoryName}
                      </span>
                    )}
                    {svc.estimatedDuration && (
                      <span className="text-[10px] text-surface-400 flex items-center gap-1"><Clock size={10} /> {svc.estimatedDuration}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-accent-500 dark:text-accent-400 shrink-0 mr-2">
                    {svc.priceType === 'starting' && <span className="text-xs font-normal">من </span>}
                    {formatPrice(svc.price)}
                  </span>
                </div>
              ))}
            </div>
          ) : serviceList.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {serviceList.map((svc) => (
                <span key={svc} className="px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-surface-700/40 text-surface-600 dark:text-surface-300 text-sm border border-surface-200 dark:border-surface-600/20">{svc}</span>
              ))}
            </div>
          ) : (
            <p className="text-surface-400 text-sm">{t('pages.workshopDetail.noServices')}</p>
          )}
        </div>
      </motion.div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
              <Camera size={16} className="text-accent-400" />
              {t('pages.workshopDetail.gallery')} ({gallery.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {gallery.map((item: any) => (
                <div key={item.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxImage(item.mediaUrl)}>
                  <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
              <BadgeCheck size={16} className="text-accent-400" />
              {t('pages.workshopDetail.features')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {features.map((f) => {
                const feat = FEATURE_MAP[f];
                if (!feat) return null;
                const FeatIcon = feat.icon;
                return (
                  <div key={f} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                      <FeatIcon size={16} className="text-primary-500" />
                    </div>
                    <span className="text-[11px] font-semibold text-surface-600 dark:text-surface-300 text-center">{feat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Working Hours */}
      {workshop.workingHours && (() => {
        try {
          const hours = JSON.parse(workshop.workingHours);
          if (!Array.isArray(hours)) return null;
          return (
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
              <div className="card p-5">
                <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-accent-400" />
                  {t('pages.workshopDetail.workingHours')}
                </h3>
                <div className="space-y-1.5">
                  {hours.map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                      <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 w-20">{DAYS_AR[i]}</span>
                      {h.closed ? (
                        <span className="text-sm text-red-400 font-semibold">{t('pages.workshopDetail.closedNow')}</span>
                      ) : (
                        <span className="text-sm text-surface-500 dark:text-surface-400">{h.open} - {h.close}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        } catch { return null; }
      })()}

      {/* Location */}
      {workshop.latitude != null && workshop.longitude != null && workshop.latitude !== 0 && workshop.longitude !== 0 && (
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <MapPin size={16} className="text-accent-400" />
              {t('pages.workshopDetail.location')}
            </h3>
            <div className="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700/20 h-48">
              <iframe
                title={t('pages.workshopDetail.location')}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${workshop.latitude},${workshop.longitude}&z=15&output=embed`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400">{workshop.city}{workshop.address ? ` - ${workshop.address}` : ''}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${workshop.latitude},${workshop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <ExternalLink size={16} />
              {t('pages.workshopDetail.openInMaps')}
            </a>
          </div>
        </motion.div>
      )}

      {/* Contact & Info */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Globe size={16} className="text-accent-400" />
            {t('pages.workshopDetail.info')}
          </h3>
          <div className="space-y-3">
            {workshop.providesPickupDelivery && (
              <div className="flex items-center gap-3 text-sm">
                <Truck size={16} className="text-emerald-400 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-300">{t('pages.workshopDetail.pickupDelivery')}</span>
              </div>
            )}
            {workshop.website && (
              <a href={workshop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:opacity-80 transition-opacity">
                <Globe size={16} className="text-blue-400 shrink-0" />
                <span className="text-blue-500 dark:text-blue-400 underline">{workshop.website}</span>
              </a>
            )}
            {(workshop.tiktokUrl || workshop.snapchatUrl || workshop.facebookUrl || workshop.instagramUrl || workshop.xUrl || workshop.youtubeUrl) && (
              <div className="border-t border-surface-200 dark:border-surface-700/20 pt-4 mt-2">
                <p className="text-xs text-surface-400 mb-3">{t('pages.workshopDetail.socialLinks')}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {workshop.tiktokUrl && (
                    <a href={workshop.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500/30 transition-all text-xs">
                      <Video size={14} className="text-pink-400" /> {t('pages.workshopDetail.tiktok')}
                    </a>
                  )}
                  {workshop.snapchatUrl && (
                    <a href={workshop.snapchatUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500/30 transition-all text-xs">
                      <MessageCircle size={14} className="text-yellow-400" /> {t('pages.workshopDetail.snapchat')}
                    </a>
                  )}
                  {workshop.facebookUrl && (
                    <a href={workshop.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500/30 transition-all text-xs">
                      <Globe size={14} className="text-blue-400" /> {t('pages.workshopDetail.facebook')}
                    </a>
                  )}
                  {workshop.instagramUrl && (
                    <a href={workshop.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500/30 transition-all text-xs">
                      <Instagram size={14} className="text-pink-500" /> {t('pages.workshopDetail.instagram', 'Instagram')}
                    </a>
                  )}
                  {workshop.xUrl && (
                    <a href={workshop.xUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500/30 transition-all text-xs">
                      <Twitter size={14} className="text-surface-600 dark:text-surface-300" /> X
                    </a>
                  )}
                  {workshop.youtubeUrl && (
                    <a href={workshop.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-500/30 transition-all text-xs">
                      <Youtube size={14} className="text-red-500" /> {t('pages.workshopDetail.youtube', 'YouTube')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Reviews */}
      <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Star size={18} className="text-accent-400" />
            <h3 className="font-bold text-surface-900 dark:text-white">{t('pages.workshopDetail.reviews')} ({reviews?.length || 0})</h3>
          </div>
          {rLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 animate-pulse">
                  <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="bg-surface-50 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-xs font-bold text-white">
                        {r.customerName?.charAt(0) || '?'}
                      </div>
                      <span className="text-sm font-medium text-surface-900 dark:text-white">{r.customerName}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300 dark:text-surface-600'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{r.comment}</p>
                  <p className="text-[10px] text-surface-400 dark:text-surface-600 mt-2">{new Date(r.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-400 text-sm text-center py-4">{t('pages.workshopDetail.noReviews')}</p>
          )}
        </div>
      </motion.div>

      {/* Floating Request Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-surface-900 via-white/95 dark:via-surface-900/95 to-transparent z-50">
        <div className="max-w-3xl mx-auto flex gap-2">
          <button onClick={handleRequestService} className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base font-bold">
            <Sparkles size={20} />
            {t('pages.workshopDetail.requestService', { name: workshop.name })}
          </button>
        </div>
      </div>
    </div>
  );
}
