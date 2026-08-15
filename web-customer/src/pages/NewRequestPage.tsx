import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { carsApi } from '../api/cars.api';
import { workshopsApi } from '../api/workshops.api';
import type { ServiceCatalogCategory } from '../api/workshops.api';
import { requestsApi } from '../api/requests.api';
import { mediaApi } from '../api/media.api';
import { reverseGeocode } from '../api/geocoding.api';
import type { Car, Workshop } from '../types';
import { useRequestStore } from '../stores/requestStore';
import { MapPicker } from '../components/MapPicker';
import { MediaUploader } from '../components/MediaUploader';
import { ArrowLeft, Send, Star, MapPin, Wrench, Navigation, CheckCircle, Loader2, Car as CarIcon, Plus, Save, Clock, CheckCircle2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SAUDI_CITIES = [
  { value: 'الرياض', key: 'riyadh' },
  { value: 'جدة', key: 'jeddah' },
  { value: 'مكة', key: 'makkah' },
  { value: 'المدينة المنورة', key: 'madinah' },
  { value: 'الدمام', key: 'dammam' },
  { value: 'الأحساء', key: 'ahsa' },
  { value: 'تبوك', key: 'tabuk' },
  { value: 'بريدة', key: 'buraidah' },
  { value: 'خميس مشيط', key: 'khamis' },
  { value: 'الهفوف', key: 'ahsa' },
  { value: 'المبرز', key: 'ahsa' },
  { value: 'الطائف', key: 'taif' },
  { value: 'حائل', key: 'hail' },
  { value: 'نجران', key: 'najran' },
  { value: 'حفر الباطن', key: 'hafr' },
  { value: 'الجبيل', key: 'jubail' },
  { value: 'الخبر', key: 'khobar' },
  { value: 'عرعر', key: 'arar' },
  { value: 'سكاكا', key: 'sakaka' },
  { value: 'جازان', key: 'jazan' },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CITY_ALIASES: Record<string, string> = {
  riyadh: 'الرياض',
  'ar riyad': 'الرياض',
  jeddah: 'جدة',
  jiddah: 'جدة',
  makkah: 'مكة',
  mecca: 'مكة',
  madinah: 'المدينة المنورة',
  medina: 'المدينة المنورة',
  dammam: 'الدمام',
  khobar: 'الخبر',
  'al khobar': 'الخبر',
  'khamis mushait': 'خميس مشيط',
  'khamis musheit': 'خميس مشيط',
  أبها: 'ابها',
};

function normalizeCity(value?: string | null): string {
  const normalized = (value || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliased = CITY_ALIASES[normalized] || normalized;
  return aliased
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NewRequestPage() {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language.startsWith('en');
  const tr = (ar: string, en: string) => isEnglish ? en : ar;
  const navigate = useNavigate();
  const location = useLocation();
  const store = useRequestStore();

  const EXECUTION_METHODS = [
    { key: 'mobile', icon: '🔧', label: tr('خدمة متنقلة', 'Mobile service'), desc: tr('الفني يجيك لموقعك', 'A technician comes to your location') },
    { key: 'workshop', icon: '🏪', label: tr('ورشة', 'At workshop'), desc: tr('روح لأقرب ورشة', 'Take your car to the workshop') },
    { key: 'pickup_delivery', icon: '🚚', label: tr('استلام وتسليم', 'Pickup and delivery'), desc: tr('نستلم السيارة ونرجعلك', 'We collect and return your car') },
  ];
  const presetServiceId = (location.state as any)?.serviceId || null;
  const presetWorkshopId = (location.state as any)?.workshopId || null;
  const returnedCarId = (location.state as any)?.selectedCarId || null;
  const quickMode = (location.state as any)?.quickMode === true;
  const presetOfferName = (location.state as any)?.offerName || '';

  // اختيار السيارة هو البداية دائماً، حتى عند الوصول من خدمة أو ورشة محددة.
  const [step, setStep] = useState(1);

  // Step 1: Car
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  // Step 2: Service + description
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showCustomService, setShowCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState(presetOfferName);

  const { data: catalog = [], isLoading: catalogLoading } = useQuery<ServiceCatalogCategory[]>({
    queryKey: ['serviceCatalog'],
    queryFn: () => workshopsApi.getCatalog(),
  });

  const { data: presetWorkshopListings = [], isLoading: workshopListingsLoading } = useQuery({
    queryKey: ['workshop-service-listings', presetWorkshopId],
    queryFn: () => workshopsApi.getServiceListings(Number(presetWorkshopId)),
    enabled: !!presetWorkshopId,
  });

  const requestCatalog = useMemo(() => {
    if (!presetWorkshopId || workshopListingsLoading) return catalog;

    const offeredTemplateIds = new Set(
      presetWorkshopListings
        .filter(listing => listing.isVisible && listing.isAvailable && listing.serviceTemplateId)
        .map(listing => Number(listing.serviceTemplateId))
    );

    if (offeredTemplateIds.size === 0) return catalog;

    return catalog
      .map(category => ({
        ...category,
        templates: category.templates.filter(template => offeredTemplateIds.has(template.id)),
      }))
      .filter(category => category.templates.length > 0);
  }, [catalog, presetWorkshopId, presetWorkshopListings, workshopListingsLoading]);

  const categoryTemplates = useMemo(() => {
    if (!selectedCategoryId) return [];
    const cat = requestCatalog.find(c => c.categoryId === selectedCategoryId);
    return cat?.templates || [];
  }, [requestCatalog, selectedCategoryId]);

  const searchResults = useMemo(() => {
    if (!serviceSearch.trim()) return [];
    const q = serviceSearch.trim().toLowerCase();
    return requestCatalog.flatMap(cat =>
      cat.templates
        .filter(t => t.name.toLowerCase().includes(q) || (t.nameEn?.toLowerCase().includes(q)))
        .map(t => ({ ...t, categoryName: cat.categoryName, categoryNameEn: cat.categoryNameEn, categoryIcon: cat.categoryIcon }))
    );
  }, [requestCatalog, serviceSearch]);

  // Step 3: Location
  const [position, setPosition] = useState<[number, number]>([24.7136, 46.6753]);
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [locating, setLocating] = useState(false);

  // Step 4: Execution method
  const [executionMethod, setExecutionMethod] = useState<string | null>(null);

  // Step 5: Workshop
  const [allWorkshops, setAllWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<number | null>(presetWorkshopId);
  const [saving, setSaving] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    carsApi.getAll().then((res: any) => {
      const list = res.data || res || [];
      const normalizedCars = Array.isArray(list) ? list : [];
      setCars(normalizedCars);
      if (returnedCarId && normalizedCars.some((car: Car) => car.id === returnedCarId)) {
        setSelectedCarId(returnedCarId);
      } else if (normalizedCars.length === 1) {
        setSelectedCarId(normalizedCars[0].id);
      }
    }).catch(() => {});
    workshopsApi.getAll().then((res: any) => {
      const list = res.data || res || [];
      setAllWorkshops(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [returnedCarId]);

  useEffect(() => {
    if (presetServiceId) {
      const numId = Number(presetServiceId);
      if (!isNaN(numId) && numId > 0) {
        setSelectedTemplateIds(prev => prev.includes(numId) ? prev : [...prev, numId]);
      }
    }
    if (presetWorkshopId) setSelectedWorkshopId(presetWorkshopId);
  }, [presetServiceId, presetWorkshopId]);

  useEffect(() => {
    if (presetWorkshopId && allWorkshops.length > 0) {
      const ws = allWorkshops.find(w => w.id === presetWorkshopId);
      if (ws) {
        if (ws.city) setCity(ws.city);
        if (ws.latitude && ws.longitude) setPosition([ws.latitude, ws.longitude]);
      }
    }
  }, [presetWorkshopId, allWorkshops]);

  const toggleTemplate = (id: number) => {
    setSelectedTemplateIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCarClick = (id: string) => {
    setSelectedCarId(id);
  };

  const goToAddCar = () => {
    navigate('/vehicles', {
      state: {
        openAdd: true,
        returnTo: '/new-request',
        requestState: location.state || {},
      },
    });
  };

  const handleDetectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        try {
          const result = await reverseGeocode(lat, lng);
          if (result.city) setCity(result.city);
          if (result.district) setDistrict(result.district);
        } catch {
          toast.error(tr('تعذر تحديد الموقع', 'Unable to detect location'));
        }
        setLocating(false);
      },
      () => {
        toast.error(tr('يرجى تفعيل خدمات الموقع', 'Please enable location services'));
        setLocating(false);
      }
    );
  };

  const getExecutionMethodLabel = (key: string | null) => {
    return EXECUTION_METHODS.find(m => m.key === key)?.label || key || '';
  };

  const getSelectedServiceNames = () => {
    const names: string[] = [];
    for (const tid of selectedTemplateIds) {
      for (const cat of requestCatalog) {
        const tpl = cat.templates.find(t => t.id === tid);
        if (tpl) { names.push(isEnglish && tpl.nameEn ? tpl.nameEn : tpl.name); break; }
      }
    }
    if (customServiceName.trim()) names.push(customServiceName.trim());
    return names;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!selectedCarId) { toast.error(tr('اختر سيارة', 'Select a car')); return; }
    if (!description.trim()) { toast.error(tr('اكتب وصف المشكلة', 'Describe the problem')); return; }
    if (!city) { toast.error(tr('اختر المدينة', 'Select a city')); return; }

    setSaving(true);
    try {
      const serviceTypeIds = selectedTemplateIds.length > 0 ? selectedTemplateIds.map(String) : undefined;
      const finalDescription = customServiceName.trim()
        ? `${description}\n\n${tr('الخدمة المطلوبة', 'Requested service')}: ${customServiceName.trim()}`
        : description;
      const res: any = await requestsApi.create({
        carIdInput: selectedCarId,
        serviceTypeIdsInput: serviceTypeIds,
        description: finalDescription,
        city,
        locationLat: position[0],
        locationLng: position[1],
        locationAddress: district || undefined,
        executionMethod: executionMethod || undefined,
        workshopIds: selectedWorkshopId ? [selectedWorkshopId] : undefined,
      }, isDraft);
      const created = res.data || res;
      const requestId = created?.id;

      let failedUploads = 0;
      if (requestId && mediaFiles.length > 0) {
        const uploadResults = await Promise.allSettled(
          mediaFiles.map((file) => mediaApi.upload(file, requestId))
        );
        failedUploads = uploadResults.filter(result => result.status === 'rejected').length;
      }

      if (isDraft) {
        toast.success(tr('تم حفظ المسودة', 'Draft saved'));
        navigate('/orders');
      } else {
        if (failedUploads > 0) {
          toast.error(tr(`تم إنشاء الطلب، لكن فشل رفع ${failedUploads} من المرفقات`, `Request created, but ${failedUploads} attachment(s) failed to upload`));
        } else {
          toast.success(tr('تم إنشاء الطلب', 'Request created'));
        }
        navigate(`/orders/${requestId}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr('فشل إنشاء الطلب', 'Failed to create request'));
    } finally {
      setSaving(false);
    }
  };

  const filteredByMethod = allWorkshops.filter(w => {
    if (!executionMethod) return true;
    const workshopType = (w.workshopType || '').toLowerCase();
    if (executionMethod === 'mobile') return workshopType === 'mobile' || workshopType === 'both';
    if (executionMethod === 'workshop') return workshopType === 'stationary' || workshopType === 'both';
    if (executionMethod === 'pickup_delivery') return w.providesPickupDelivery === true;
    return true;
  });

  const filteredWorkshops = city
    ? filteredByMethod.filter(w => {
        if (normalizeCity(w.city) === normalizeCity(city)) return true;
        if (w.latitude == null || w.longitude == null) return false;
        return getDistance(position[0], position[1], w.latitude, w.longitude) <= 80;
      })
    : filteredByMethod;

  const candidateWorkshops = presetWorkshopId
    ? allWorkshops.filter(w => w.id === Number(presetWorkshopId))
    : filteredWorkshops;

  const workshopsWithDist = candidateWorkshops.map(w => {
    let dist: number | null = null;
    if (w.latitude && w.longitude && position) {
      dist = getDistance(position[0], position[1], w.latitude, w.longitude);
    }
    return { ...w, distanceKm: dist !== null ? Math.round(dist * 10) / 10 : null };
  }).sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  const topWorkshops = workshopsWithDist.slice(0, 5);

  const selectedCar = cars.find(c => c.id === selectedCarId);
  const selectedServiceNames = getSelectedServiceNames();

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 hover:bg-surface-800 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">{tr('طلب جديد', 'New Request')}</h2>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-accent-500' : 'bg-surface-700'}`} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-surface-400">
        {[tr('السيارة', 'Car'), tr('الخدمة', 'Service'), tr('التنفيذ والموقع', 'Method & Location'), tr('المراجعة', 'Review')].map((label, index) => (
          <span key={label} className={index + 1 === step ? 'text-accent-500' : ''}>{label}</span>
        ))}
      </div>

      {/* ===== STEP 1: CAR ===== */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-surface-900 dark:text-white">
            <CarIcon className="h-5 w-5 text-accent-400" />
            {tr('اختر السيارة', 'Select a Car')}
          </h3>
          {cars.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-accent-500/40 bg-accent-500/5 p-7 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
                <CarIcon className="h-8 w-8" />
              </div>
              <h4 className="font-extrabold text-surface-900 dark:text-white">{tr('أضف سيارتك للبدء', 'Add your car to begin')}</h4>
              <p className="mx-auto mt-2 max-w-sm text-sm text-surface-500 dark:text-surface-400">{tr('نحتاج بيانات السيارة مرة واحدة فقط لنربط بها طلباتك وسجل الصيانة.', 'We only need your car details once to link requests and maintenance history.')}</p>
              <button onClick={goToAddCar} className="btn-primary mt-5 inline-flex items-center justify-center gap-2 px-7">
                <Plus className="h-5 w-5" /> {tr('إضافة السيارة', 'Add Car')}
              </button>
            </div>
          ) : <div className="space-y-2">
            {cars.map(car => (
              <button
                key={car.id}
                onClick={() => handleCarClick(car.id)}
                className={`card w-full text-right transition-all flex items-center gap-3 ${selectedCarId === car.id ? 'border-accent-500 bg-accent-500/10' : 'hover:bg-surface-700/80'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-surface-700/50 flex items-center justify-center shrink-0">
                  <CarIcon className="h-6 w-6 text-accent-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{car.make} {car.model}</p>
                  <p className="text-sm text-surface-400">{car.year}{car.plateNumber ? ` · ${car.plateNumber}` : ''}</p>
                </div>
                {selectedCarId === car.id && <CheckCircle className="h-5 w-5 text-accent-400 shrink-0" />}
              </button>
            ))}
            <button onClick={goToAddCar} className="btn-secondary mt-3 flex w-full items-center justify-center gap-2"><Plus className="h-5 w-5" /> {tr('إضافة سيارة أخرى', 'Add Another Car')}</button>
          </div>}
          <button onClick={() => selectedCarId && setStep(2)} disabled={!selectedCarId} className="btn-primary w-full py-4 disabled:opacity-40">{t('common.next')}</button>
        </div>
      )}

      {/* ===== STEP 2: SERVICE ===== */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-surface-900 dark:text-white">
            <Wrench className="h-5 w-5 text-accent-400" />
            {quickMode ? tr('صف المشكلة باختصار', 'Briefly describe the problem') : tr('وش مشكلة سيارتك؟', 'What is wrong with your car?')}
          </h3>

          {quickMode && (
            <div className="rounded-2xl border border-accent-500/20 bg-accent-500/10 p-4 text-sm text-surface-700 dark:text-surface-200">
              {tr('لا تحتاج لاختيار الخدمة أو الورشة؛ اكتب المشكلة وسنرسلها للورش المناسبة لتستقبل عروض الأسعار.', 'Describe the problem and we will send it to suitable workshops to receive quotes.')}
            </div>
          )}

          {!quickMode && <>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 pointer-events-none" />
            <input
              type="text"
              value={serviceSearch}
              onChange={e => setServiceSearch(e.target.value)}
              placeholder={tr('ابحث عن خدمة ...', 'Search for a service...')}
              className="input-field pr-10"
            />
          </div>

          {catalogLoading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-surface-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : serviceSearch.trim() ? (
            <div className="space-y-1">
              {searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-accent-500/30 bg-accent-500/5 p-5 text-center">
                  <p className="text-surface-700 dark:text-surface-300 text-sm">{tr(`لم نجد خدمة باسم «${serviceSearch}»`, `No service found for “${serviceSearch}”`)}</p>
                  <button
                    onClick={() => { setCustomServiceName(serviceSearch.trim()); setServiceSearch(''); }}
                    className="mt-3 rounded-xl bg-accent-500 px-4 py-2 text-sm font-bold text-white transition active:scale-95"
                  >
                    {tr('اطلبها كخدمة أخرى', 'Request as another service')}
                  </button>
                </div>
              ) : (
                searchResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleTemplate(s.id)}
                    className={`card text-right p-3 transition-all flex items-center justify-between ${selectedTemplateIds.includes(s.id) ? 'border-accent-500 bg-accent-500/10' : 'hover:bg-surface-700/80'}`}
                  >
                    <div>
                      <p className="text-sm font-bold text-surface-900 dark:text-white">{isEnglish && s.nameEn ? s.nameEn : s.name}</p>
                      <p className="text-[10px] text-surface-600 dark:text-surface-400 mt-0.5">{s.categoryIcon} {isEnglish && s.categoryNameEn ? s.categoryNameEn : s.categoryName}</p>
                    </div>
                    {selectedTemplateIds.includes(s.id) && <CheckCircle className="h-4 w-4 text-accent-400 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          ) : !selectedCategoryId ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {requestCatalog.map(cat => (
                <button
                  key={cat.categoryId}
                  onClick={() => setSelectedCategoryId(cat.categoryId)}
                  className={`rounded-2xl p-4 text-center transition-all border ${selectedCategoryId === cat.categoryId ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500' : 'border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700/80'}`}
                >
                  <div className="text-2xl mb-1">{cat.categoryIcon || '🔧'}</div>
                  <p className="text-xs font-bold text-surface-900 dark:text-white">{isEnglish && cat.categoryNameEn ? cat.categoryNameEn : cat.categoryName}</p>
                  <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-0.5">{cat.templates.length} {tr('خدمة', 'services')}</p>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedCategoryId(null); setServiceSearch(''); }} className="flex items-center gap-1 text-sm text-accent-400 hover:underline p-1 rounded-lg hover:bg-accent-500/10 transition">
                  <ArrowLeft className="h-4 w-4" /> {tr('رجوع للأقسام', 'Back to categories')}
                </button>
                <span className="text-xs text-surface-500">|</span>
                <span className="text-xs font-medium text-surface-600 dark:text-surface-300">{catalog.find(c => c.categoryId === selectedCategoryId)?.categoryName}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {categoryTemplates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => toggleTemplate(tpl.id)}
                    className={`card text-right p-3 transition-all flex items-center justify-between ${selectedTemplateIds.includes(tpl.id) ? 'border-accent-500 bg-accent-500/10' : 'hover:bg-surface-700/80'}`}
                  >
                    <div>
                      <p className="text-sm font-bold text-surface-900 dark:text-white">{isEnglish && tpl.nameEn ? tpl.nameEn : tpl.name}</p>
                      {tpl.defaultDuration && (
                        <p className="text-xs text-surface-600 dark:text-surface-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {tpl.defaultDuration}
                        </p>
                      )}
                    </div>
                    {selectedTemplateIds.includes(tpl.id) && <CheckCircle className="h-4 w-4 text-accent-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-surface-700/30 pt-3 mt-3">
                {!showCustomService ? (
                  <button onClick={() => setShowCustomService(true)} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-accent-600 dark:hover:text-accent-400 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800/50 transition">
                    <Plus className="h-4 w-4" /> {tr('خدمة غير موجودة؟ أضفها يدوياً', 'Service not listed? Add it manually')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customServiceName}
                      onChange={e => setCustomServiceName(e.target.value)}
                      placeholder={tr('اسم الخدمة المطلوبة', 'Requested service name')}
                      className="input-field flex-1"
                      autoFocus
                    />
                    <button onClick={() => { setShowCustomService(false); setCustomServiceName(''); }} className="px-3 py-2 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white">{t('common.cancel')}</button>
                  </div>
                )}
              </div>
            </>
          )}

          {(selectedTemplateIds.length > 0 || customServiceName.trim()) && (
            <div className="bg-accent-500/10 border border-accent-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-bold text-accent-700 dark:text-accent-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>{tr('الخدمات المحددة', 'Selected Services')}</span>
                </div>
                <button onClick={() => { setSelectedTemplateIds([]); setCustomServiceName(''); }} className="text-xs font-medium text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white transition">{tr('مسح الكل', 'Clear All')}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedServiceNames.map((name, index) => (
                  <span key={`${name}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-bold text-surface-800 dark:text-surface-100 shadow-sm">
                    {name}
                    <button
                      type="button"
                      aria-label={tr(`إزالة ${name}`, `Remove ${name}`)}
                      onClick={() => index < selectedTemplateIds.length
                        ? toggleTemplate(selectedTemplateIds[index])
                        : setCustomServiceName('')}
                      className="grid h-4 w-4 place-items-center rounded-full text-surface-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          </>}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={quickMode ? tr('مثال: السيارة تصدر صوتًا عند الفرملة وأحتاج فحصها...', 'Example: The car makes a noise when braking and needs inspection...') : tr('صف مشكلة السيارة بطريقتك، حتى لو لم تجد اسم الخدمة...', 'Describe the car problem, even if the service is not listed...')}
            rows={5}
            className="input-field resize-none"
          />
          {selectedTemplateIds.length === 0 && !customServiceName.trim() && description.trim() && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-700 dark:text-blue-300">
              <Wrench className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{tr('سيُرسل طلبك كطلب صيانة عام، وستحدد الورشة الخدمة المناسبة بعد التشخيص.', 'Your request will be sent as general maintenance and the workshop will determine the service after diagnosis.')}</span>
            </div>
          )}
          <MediaUploader files={mediaFiles} onAdd={f => setMediaFiles(prev => [...prev, f])} onRemove={i => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))} />
          <button onClick={() => description.trim() && setStep(3)} disabled={!description.trim()} className="btn-primary w-full py-4 disabled:opacity-40">{t('common.next')}</button>
        </div>
      )}

      {/* ===== STEP 3: LOCATION ===== */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-surface-900 dark:text-white">
            <MapPin className="h-5 w-5 text-accent-400" />
            {tr('الموقع', 'Location')}
          </h3>
          <button onClick={handleDetectLocation} disabled={locating} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
            {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
            {locating ? tr('جاري التحديد...', 'Detecting...') : tr('حدد موقعي تلقائياً', 'Use My Location')}
          </button>
          <div className="text-center text-surface-500 text-sm">{t('common.or')}</div>
          <select value={city} onChange={e => setCity(e.target.value)} className="input-field">
            <option value="">{tr('اختر المدينة', 'Select City')}</option>
            {SAUDI_CITIES.map(c => <option key={c.value} value={c.value}>{isEnglish ? t(`constants.cities.${c.key}`, c.value) : c.value}</option>)}
          </select>
          <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder={tr('الحي (اختياري)', 'District (optional)')} className="input-field" />
          {city && (
            <div className="mt-2">
              <p className="text-xs text-surface-400 mb-2">{tr('حدد موقعك على الخريطة', 'Select your location on the map')}</p>
              <MapPicker position={position} onPositionChange={(lat, lng) => setPosition([lat, lng])} />
            </div>
          )}
        </div>
      )}

      {/* Execution method is part of step 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-accent-400" />
            {tr('طريقة التنفيذ', 'Execution Method')}
          </h3>
          <div className="space-y-3">
            {EXECUTION_METHODS.map(m => (
              <button
                key={m.key}
                onClick={() => setExecutionMethod(m.key)}
                className={`card w-full text-right p-4 transition-all ${executionMethod === m.key ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500' : 'hover:bg-surface-700/80'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">{m.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-surface-900 dark:text-white mb-1">{m.label}</p>
                    <p className="text-xs text-surface-400 leading-relaxed">{m.desc}</p>
                  </div>
                  {executionMethod === m.key && <CheckCircle className="h-5 w-5 text-accent-400 shrink-0 mt-1" />}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => city && executionMethod && setStep(4)} disabled={!city || !executionMethod} className="btn-primary w-full py-4 disabled:opacity-40">{t('common.next')}</button>
        </div>
      )}

      {/* ===== STEP 4: WORKSHOP + REVIEW ===== */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-accent-400" />
            {presetWorkshopId ? tr('الورشة المختارة', 'Selected Workshop') : tr('اختر الورشة', 'Select a Workshop')}
            <span className="text-xs text-surface-400 font-normal mr-2">({getExecutionMethodLabel(executionMethod)})</span>
          </h3>
          <div className="space-y-2">
            {topWorkshops.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-5 text-center">
                <Wrench className="mx-auto mb-2 h-7 w-7 text-amber-500" />
                <p className="font-bold text-surface-900 dark:text-white">{tr('لا توجد ورشة متاحة حالياً', 'No workshop is currently available')}</p>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{tr('يمكنك إرسال الطلب الآن بدون اختيار ورشة، وسنبحث عن ورشة مناسبة.', 'You can submit without selecting a workshop and we will find a suitable one.')}</p>
              </div>
            ) : (
              topWorkshops.map(w => {
                const isSelected = selectedWorkshopId === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => { if (!presetWorkshopId) setSelectedWorkshopId(isSelected ? null : w.id); }}
                    className={`card w-full text-right transition-all ${isSelected ? 'border-accent-500 bg-accent-500/5' : 'hover:bg-surface-700/80'} ${presetWorkshopId ? 'cursor-default' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{w.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm">{w.rating.toFixed(1)}</span>
                          {w.reviewCount ? <span className="text-xs text-surface-400">({w.reviewCount})</span> : null}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-surface-400">
                          {w.distanceKm !== null && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {w.distanceKm < 1 ? `${Math.round(w.distanceKm * 1000)} ${t('common.m')}` : `${w.distanceKm} ${t('common.km')}`}
                            </span>
                          )}
                          {w.completedJobs ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {w.completedJobs}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="h-5 w-5 text-accent-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>



          <button onClick={() => setStep(3)} className="btn-secondary w-full py-3">{tr('تغيير الطريقة أو الموقع', 'Change Method or Location')}</button>

          {workshopsWithDist.length > 5 && (
            <p className="text-xs text-surface-500 text-center">
              {tr(`عرض ${topWorkshops.length} من ${workshopsWithDist.length} ورشة`, `Showing ${topWorkshops.length} of ${workshopsWithDist.length} workshops`)}
            </p>
          )}
        </div>
      )}

      {/* Review is part of step 4 */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-surface-900 dark:text-white">
            <CheckCircle2 className="h-5 w-5 text-accent-400" />
            {tr('مراجعة الطلب', 'Review Request')}
          </h3>
          <div className="card bg-white dark:bg-surface-800/30 border border-surface-200 dark:border-surface-700/40 p-5 space-y-3">
            <h4 className="font-bold text-sm text-surface-900 dark:text-surface-100 flex items-center gap-2">{tr('ملخص الطلب', 'Request Summary')}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CarIcon className="h-4 w-4 text-accent-400 shrink-0" />
                <div>
                  <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('السيارة', 'Car')}</p>
                  <p className="font-medium text-surface-900 dark:text-white">{selectedCar?.make} {selectedCar?.model} {selectedCar?.year}</p>
                </div>
              </div>
              {selectedServiceNames.length > 0 && (
                <div className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-accent-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('الخدمات', 'Services')}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedServiceNames.map((name, i) => (
                        <span key={i} className="text-xs bg-accent-50 dark:bg-accent-500/20 text-accent-700 dark:text-accent-300 px-2 py-0.5 rounded-full">{name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {selectedServiceNames.length === 0 && (
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-accent-400 shrink-0" />
                  <div>
                    <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('الخدمة', 'Service')}</p>
                    <p className="font-medium text-surface-900 dark:text-white">{tr('طلب صيانة عام — تحدد بعد التشخيص', 'General maintenance — determined after diagnosis')}</p>
                  </div>
                </div>
              )}
              {executionMethod && (
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-accent-400 shrink-0" />
                  <div>
                    <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('طريقة التنفيذ', 'Execution Method')}</p>
                    <p className="font-medium text-surface-900 dark:text-white">{getExecutionMethodLabel(executionMethod)}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent-400 shrink-0" />
                <div>
                  <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('الموقع', 'Location')}</p>
                  <p className="font-medium text-surface-900 dark:text-white">{city}{district ? ` - ${district}` : ''}</p>
                </div>
              </div>
              {selectedWorkshopId && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent-400 shrink-0" />
                  <div>
                    <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('الورشة', 'Workshop')}</p>
                    <p className="font-medium text-surface-900 dark:text-white">{workshopsWithDist.find(w => w.id === selectedWorkshopId)?.name || ''}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-accent-400 shrink-0" />
                <div>
                    <p className="text-surface-500 dark:text-surface-400 text-xs">{tr('الوصف', 'Description')}</p>
                  <p className="text-surface-900 dark:text-white text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-surface-200 dark:border-surface-700/30">
              <p className="text-xs text-surface-600 dark:text-surface-400">{tr('السعر المتوقع يتم تحديده من الورشة', 'The workshop will determine the expected price')}</p>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
                {presetWorkshopId
                  ? tr('سيتم إرسال طلبك مباشرة إلى الورشة المختارة لتراجع الطلب وترسل عرضها.', 'Your request will be sent directly to the selected workshop for review and quotation.')
                  : tr('سيتم إرسال طلبك للورش المناسبة وستتلقى عروض أسعار للمقارنة.', 'Your request will be sent to suitable workshops and you will receive quotes to compare.')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-3">{t('common.edit')}</button>
            <button onClick={() => handleSubmit(true)} disabled={saving} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
              <Save className="h-5 w-5" /> {tr('حفظ كمسودة', 'Save Draft')}
            </button>
            <button onClick={() => handleSubmit(false)} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {tr('إرسال الطلب', 'Submit Request')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
