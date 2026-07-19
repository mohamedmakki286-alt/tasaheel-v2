import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Search, Wrench, Star, Users } from 'lucide-react';
import { workshopsApi, type ServiceCatalogCategory, type ServiceTemplateItem } from '../api/workshops.api';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const } }) };

const CATEGORY_ICONS: Record<string, string> = {
  periodic: '🔧', mechanical: '⚙️', electrical: '⚡', ac: '❄️',
  tires: '🛞', bodywork: '🎨', emergency: '🚨', inspection: '🔍',
};

export function BrowseServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const navigationState = location.state as { categoryId?: number; category?: string; search?: string } | null;
  const requestedCategory = navigationState?.category?.trim().toLowerCase();
  const hasAppliedNavigationCategory = useRef(false);
  const [search, setSearch] = useState(navigationState?.search || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    navigationState?.categoryId || null
  );

  const { data: catalog = [], isLoading } = useQuery<ServiceCatalogCategory[]>({
    queryKey: ['serviceCatalog', search],
    queryFn: () => workshopsApi.getCatalog(search || undefined),
  });

  useEffect(() => {
    if (hasAppliedNavigationCategory.current || !requestedCategory || catalog.length === 0) return;

    hasAppliedNavigationCategory.current = true;
    const requestedCatalogCategory = catalog.find(
      category => category.categoryNameEn?.trim().toLowerCase() === requestedCategory
    );

    if (requestedCatalogCategory) {
      setSelectedCategoryId(requestedCatalogCategory.categoryId);
    }
  }, [catalog, requestedCategory]);

  const selectedCategory = selectedCategoryId
    ? catalog.find(c => c.categoryId === selectedCategoryId) || null
    : null;

  const displayCategories = selectedCategory ? [selectedCategory] : catalog;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3">
          {selectedCategory ? (
            <button onClick={() => { setSelectedCategoryId(null); setSearch(''); }} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-900 dark:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">{t('pages.browseServices.title')}</h2>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('pages.browseServices.searchPlaceholder')}
            className="input-field pr-10"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-10 h-10 bg-surface-200 dark:bg-surface-700 rounded-xl mx-auto mb-2" />
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mx-auto mb-1" />
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : !selectedCategory && !search ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {catalog.map((cat, i) => (
            <motion.button
              key={cat.categoryId}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => setSelectedCategoryId(cat.categoryId)}
              className="card text-center p-5 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
            >
              <div className="text-3xl mb-2">{CATEGORY_ICONS[cat.categoryNameEn || ''] || '🔧'}</div>
              <p className="font-bold text-sm text-surface-900 dark:text-white mb-1">{cat.categoryName}</p>
              <p className="text-xs text-surface-400 dark:text-surface-500">{cat.templates.length} {t('pages.browseServices.servicesCount', 'خدمة')}</p>
            </motion.button>
          ))}
        </div>
      ) : selectedCategory && !search ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{CATEGORY_ICONS[selectedCategory.categoryNameEn || ''] || '🔧'}</span>
            <h3 className="font-bold text-sm text-surface-900 dark:text-white">{selectedCategory.categoryName}</h3>
            <span className="text-xs text-surface-400">({selectedCategory.templates.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedCategory.templates.map((svc, i) => (
              <motion.button
                key={svc.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                onClick={() => navigate(`/services/${svc.id}`)}
                className="card text-right p-4 transition-all hover:bg-surface-100 dark:hover:bg-surface-700/80 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-surface-900 dark:text-white">{svc.name}</p>
                    {svc.defaultDuration && (
                      <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {svc.defaultDuration}
                      </p>
                    )}
                  </div>
                  <Star className="h-4 w-4 text-accent-400 shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {displayCategories.map((cat, ci) => {
            const matching = cat.templates.filter(svc =>
              search && svc.name.includes(search)
            );
            if (search && matching.length === 0) return null;
            const displayServices = search ? matching : cat.templates;

            return (
              <motion.div key={cat.categoryId} custom={ci} variants={fadeUp} initial="hidden" animate="visible">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_ICONS[cat.categoryNameEn || ''] || '🔧'}</span>
                  <h3 className="font-bold text-sm text-surface-900 dark:text-white">{cat.categoryName}</h3>
                  <button onClick={() => { setSelectedCategoryId(cat.categoryId); setSearch(''); }} className="text-xs text-accent-400 mr-auto">{t('pages.browseServices.viewAll')}</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayServices.map((svc, i) => (
                    <button
                      key={svc.id}
                      onClick={() => navigate(`/services/${svc.id}`)}
                      className="card text-right p-3 transition-all hover:bg-surface-100 dark:hover:bg-surface-700/80 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-white">{svc.name}</p>
                          {svc.defaultDuration && (
                            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{svc.defaultDuration}</p>
                          )}
                        </div>
                        <ArrowLeft className="h-3.5 w-3.5 text-surface-500 shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
          {search && displayCategories.every(cat => cat.templates.filter(s => s.name.includes(search)).length === 0) && (
            <p className="text-surface-400 text-center py-8">{t('pages.browseServices.noResults')}</p>
          )}
        </div>
      )}

      {!selectedCategory && !search && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="text-center py-6">
          <button onClick={() => navigate('/new-request')} className="btn-primary inline-flex items-center gap-2 text-sm">
            <Wrench className="h-4 w-4" />
            {t('pages.browseServices.requestService')}
          </button>
        </motion.div>
      )}
    </div>
  );
}
