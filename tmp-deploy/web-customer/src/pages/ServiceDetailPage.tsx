import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { workshopsApi, type ServiceTemplateItem, type TemplateWorkshop } from '../api/workshops.api';
import { ArrowLeft, Star, MapPin, Clock, Wrench, DollarSign, Navigation } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

export function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [showAllWorkshops, setShowAllWorkshops] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  const templateId = Number(id);

  const { data: template, isLoading: templateLoading } = useQuery<ServiceTemplateItem>({
    queryKey: ['serviceTemplate', templateId],
    queryFn: () => workshopsApi.getTemplate(templateId),
    enabled: !!templateId,
  });

  const { data: rawWorkshops = [], isLoading: workshopsLoading } = useQuery<TemplateWorkshop[]>({
    queryKey: ['templateWorkshops', templateId, userPosition],
    queryFn: () => workshopsApi.getTemplateWorkshops(
      templateId,
      userPosition?.[0],
      userPosition?.[1],
    ),
    enabled: !!templateId,
  });

  const workshops = rawWorkshops.sort((a, b) => {
    if (b.workshopRating !== a.workshopRating) return b.workshopRating - a.workshopRating;
    return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
  });

  const loading = templateLoading || workshopsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-20 text-surface-400">
        <p>{t('pages.serviceDetail.notFound')}</p>
        <button onClick={() => navigate('/')} className="text-accent-400 mt-2">{t('pages.serviceDetail.backToHome')}</button>
      </div>
    );
  }

  const displayWorkshops = showAllWorkshops ? workshops : workshops.slice(0, 5);

  return (
    <div className="space-y-6">
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-900 dark:text-white">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Link to="/" className="hover:text-surface-700 dark:hover:text-surface-200 transition-colors">{t('pages.serviceDetail.home')}</Link>
            <span>/</span>
            <span className="text-surface-700 dark:text-surface-200 font-medium">{template.name}</span>
          </div>
        </div>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <div className="card bg-surface-50 dark:bg-gradient-to-br dark:from-surface-800 dark:to-surface-850 border border-surface-200/60 dark:border-surface-700/40 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-500/10 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
              <Wrench className="h-7 w-7 text-accent-500 dark:text-accent-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-1">{template.name}</h1>
              {template.description && (
                <p className="text-surface-500 dark:text-surface-400 text-sm">{template.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {template.defaultDuration && (
              <div className="flex items-center gap-1.5 text-sm bg-surface-100 dark:bg-surface-700/40 rounded-xl px-4 py-2">
                <Clock className="h-4 w-4 text-accent-500 dark:text-accent-400" />
                <span className="text-surface-700 dark:text-surface-200">{template.defaultDuration}</span>
              </div>
            )}
            {template.categoryName && (
              <div className="flex items-center gap-1.5 text-sm bg-surface-100 dark:bg-surface-700/40 rounded-xl px-4 py-2">
                <Wrench className="h-4 w-4 text-accent-500 dark:text-accent-400" />
                <span className="text-surface-700 dark:text-surface-200">{template.categoryName}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div>
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent-500 dark:text-accent-400" />
            {t('pages.serviceDetail.availableWorkshops')} ({workshops.length})
          </h2>
        </motion.div>

        {workshops.length === 0 ? (
          <div className="card text-center py-10 text-surface-400">
            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('pages.serviceDetail.noWorkshops')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayWorkshops.map((w, i) => (
              <motion.div
                key={w.listingId}
                custom={i + 2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="card bg-surface-50 dark:bg-surface-800/50 border border-surface-200/60 dark:border-surface-700/40 p-5 hover:border-surface-300 dark:hover:border-surface-600/60 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-surface-900 dark:text-white text-base">{w.workshopName}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-surface-900 dark:text-white">{w.workshopRating.toFixed(1)}</span>
                      </div>
                      <span className="text-surface-300 dark:text-surface-600">|</span>
                      <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="font-bold">{w.price} {t('common.sar')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-surface-400">
                      {w.distanceKm != null && w.distanceKm > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {w.distanceKm < 1
                            ? `${Math.round(w.distanceKm * 1000)} ${t('common.m')}`
                            : `${w.distanceKm.toFixed(1)} ${t('common.km')}`}
                        </span>
                      )}
                      {w.workshopCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {w.workshopCity}
                        </span>
                      )}
                      {w.estimatedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {w.estimatedDuration}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/workshops/${w.workshopId}`)}
                      className="btn-secondary px-4 py-2 text-sm whitespace-nowrap"
                    >
                      {t('pages.serviceDetail.viewWorkshop')}
                    </button>
                    <button
                      onClick={() => navigate('/new-request', {
                        state: { serviceId: templateId, listingId: w.listingId, workshopId: w.workshopId },
                      })}
                      className="px-4 py-2 text-sm rounded-xl bg-accent-500 text-white font-bold hover:bg-accent-600 transition-colors whitespace-nowrap"
                    >
                      {t('pages.serviceDetail.requestService')}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {!showAllWorkshops && workshops.length > 5 && (
              <button
                onClick={() => setShowAllWorkshops(true)}
                className="w-full py-3 text-sm text-accent-500 dark:text-accent-400 hover:text-accent-600 dark:hover:text-accent-300 transition-colors"
              >
                {t('pages.serviceDetail.viewAll')} ({workshops.length})
              </button>
            )}
          </div>
        )}
      </div>

      {workshops.length > 0 && (
        <div className="sticky bottom-4">
          <button
            onClick={() => navigate('/new-request', {
              state: { serviceId: templateId },
            })}
            className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-accent-500/20 flex items-center justify-center gap-2"
          >
            <Navigation className="h-5 w-5" />
            {t('pages.serviceDetail.requestWithoutWorkshop')}
          </button>
        </div>
      )}
    </div>
  );
}
