import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Wrench, Plus, Pencil, Trash2, Copy, Eye, EyeOff, CheckCircle2,
  XCircle, Loader2, Search, X, AlertCircle, Package, ChevronLeft, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceListingsApi, type ServiceListing, type ServiceCategory, type ServiceTemplate, type ServiceCatalogCategory, type CreateServiceListingRequest } from '../api/serviceListings.api';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

type AddStep = 'category' | 'template' | 'custom' | 'price';

function AddServiceModal({ catalog, onClose }: { catalog: ServiceCatalogCategory[]; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<AddStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCatalogCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [customName, setCustomName] = useState('');

  const [form, setForm] = useState({
    price: 0,
    priceType: 'fixed',
    estimatedDuration: '',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateServiceListingRequest = {
        name: selectedTemplate?.name || customName,
        price: form.price,
        priceType: form.priceType,
        categoryId: selectedCategory?.categoryId,
        estimatedDuration: form.estimatedDuration || selectedTemplate?.defaultDuration || '',
        description: form.description || selectedTemplate?.description || '',
        serviceTemplateId: selectedTemplate?.id,
        isVisible: true,
        isAvailable: true,
      };
      return serviceListingsApi.createService(payload);
    },
    onSuccess: () => {
      toast.success(t('toast.success.serviceAdded', 'تمت إضافة الخدمة'));
      queryClient.invalidateQueries({ queryKey: ['myServiceListings'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.failedSaveServices', 'فشل في حفظ الخدمة')),
  });

  if (step === 'category') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h2 className="text-lg font-bold text-surface-900">{t('pages.services.addService', 'إضافة خدمة جديدة')}</h2>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-surface-500 mb-3">{t('pages.services.selectCategory', 'اختر الفئة')}</p>
            {catalog.map((cat) => (
                <button
                  key={cat.categoryId}
                  onClick={async () => {
                    try {
                      if (cat.templates.length > 0) {
                        setSelectedCategory(cat);
                        setStep('template');
                        return;
                      }

                      const fullCategory = await serviceListingsApi.getCatalogCategory(cat.categoryId);
                      setSelectedCategory(fullCategory);
                      setStep('template');
                    } catch {
                      toast.error(t('toast.error.failedLoad', 'فشل في تحميل التصنيفات'));
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                      <Wrench size={18} className="text-accent-400" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900 dark:text-surface-100 text-sm">{cat.categoryName}</p>
                      <p className="text-xs text-surface-400">{cat.templates.length} {t('pages.services.templateCount', 'خدمة متاحة')}</p>
                    </div>
                  </div>
                  <ChevronLeft size={16} className="text-surface-400" />
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'template' && selectedCategory) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('category')} className="text-surface-400 hover:text-surface-600">
                <ChevronLeft size={20} className="rotate-180" />
              </button>
              <h2 className="text-lg font-bold text-surface-900">{selectedCategory.categoryName}</h2>
            </div>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
            {selectedCategory.templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => { setSelectedTemplate(tpl); setStep('price'); }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all text-right"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-surface-900 dark:text-surface-100 text-sm">{tpl.name}</p>
                  {tpl.nameEn && <p className="text-xs text-surface-400">{tpl.nameEn}</p>}
                  {tpl.defaultDuration && (
                    <p className="text-[10px] text-surface-500 mt-0.5">{tpl.defaultDuration}</p>
                  )}
                </div>
                <Plus size={16} className="text-surface-400 shrink-0" />
              </button>
            ))}
            <button
              onClick={() => setStep('custom')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-surface-300 dark:border-surface-600 hover:border-accent-400 transition-all text-right"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center">
                <Plus size={18} className="text-surface-400" />
              </div>
              <div>
                <p className="font-bold text-surface-500 text-sm">{t('pages.services.customService', 'خدمة مخصصة')}</p>
                <p className="text-xs text-surface-400">{t('pages.services.customServiceDesc', 'أضف خدمة غير موجودة في القائمة')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'custom' && selectedCategory) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('template')} className="text-surface-400 hover:text-surface-600">
                <ChevronLeft size={20} className="rotate-180" />
              </button>
              <h2 className="text-lg font-bold text-surface-900">{t('pages.services.customService', 'خدمة مخصصة')}</h2>
            </div>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-surface-400">{selectedCategory.categoryName}</p>
            <div>
              <label className="label">{t('pages.services.name', 'اسم الخدمة')}</label>
              <input
                className="input-field"
                placeholder={t('pages.services.namePlaceholder', 'مثال: تغيير زيت المحرك')}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <button
              onClick={() => { if (customName.trim()) setStep('price'); }}
              disabled={!customName.trim()}
              className="btn-primary w-full"
            >
              {t('common.next', 'التالي')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'price') {
    const serviceName = selectedTemplate?.name || customName;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectedTemplate(null); setStep(selectedTemplate ? 'template' : 'custom'); }} className="text-surface-400 hover:text-surface-600">
                <ChevronLeft size={20} className="rotate-180" />
              </button>
              <h2 className="text-lg font-bold text-surface-900">{serviceName}</h2>
            </div>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100">
              <X size={20} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {selectedTemplate?.description && (
              <p className="text-xs text-surface-500 bg-surface-50 dark:bg-surface-800 rounded-xl p-3">{selectedTemplate.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('pages.services.price', 'السعر')} (ر.س)</label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.price || ''}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">{t('pages.services.priceType', 'نوع السعر')}</label>
                <select
                  className="input-field"
                  value={form.priceType}
                  onChange={(e) => setForm({ ...form, priceType: e.target.value })}
                >
                  <option value="fixed">{t('pages.services.fixedPrice', 'ثابت')}</option>
                  <option value="starting">{t('pages.services.startingPrice', 'يبدأ من')}</option>
                  <option value="negotiable">{t('pages.services.negotiable', 'قابل للتفاوض')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t('pages.services.duration', 'المدة التقديرية')}</label>
              <input
                className="input-field"
                placeholder={selectedTemplate?.defaultDuration || t('pages.services.durationPlaceholder', 'مثال: 30-45 دقيقة')}
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
              />
            </div>

            <div>
              <label className="label">{t('pages.services.description', 'الوصف')}</label>
              <textarea
                className="input-field min-h-[80px] resize-none"
                placeholder={t('pages.services.descriptionPlaceholder', 'وصف مختصر للخدمة...')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary w-full"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> {t('pages.services.saving', 'جاري الحفظ...')}</span>
              ) : (
                <span className="flex items-center gap-2 justify-center"><Check size={16} /> {t('pages.services.add', 'إضافة الخدمة')}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function EditServiceModal({ service, categories, onClose }: { service: ServiceListing; categories: ServiceCategory[]; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: service.name,
    description: service.description || '',
    price: service.price,
    priceType: service.priceType,
    categoryId: service.categoryId || undefined,
    estimatedDuration: service.estimatedDuration || '',
  });

  const mutation = useMutation({
    mutationFn: () => serviceListingsApi.updateService(service.id, form),
    onSuccess: () => {
      toast.success(t('toast.success.serviceUpdated', 'تم تحديث الخدمة'));
      queryClient.invalidateQueries({ queryKey: ['myServiceListings'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.failedSaveServices', 'فشل في حفظ الخدمة')),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Pencil size={20} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-surface-900">{t('pages.services.editService', 'تعديل الخدمة')}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1 rounded-lg hover:bg-surface-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          <div>
            <label className="label">{t('pages.services.name', 'اسم الخدمة')}</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">{t('pages.services.description', 'الوصف')}</label>
            <textarea className="input-field min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('pages.services.price', 'السعر')}</label>
              <input className="input-field" type="number" min="0" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="label">{t('pages.services.priceType', 'نوع السعر')}</label>
              <select className="input-field" value={form.priceType} onChange={(e) => setForm({ ...form, priceType: e.target.value })}>
                <option value="fixed">{t('pages.services.fixedPrice', 'ثابت')}</option>
                <option value="starting">{t('pages.services.startingPrice', 'يبدأ من')}</option>
                <option value="negotiable">{t('pages.services.negotiable', 'قابل للتفاوض')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('pages.services.category', 'الفئة')}</label>
            <select className="input-field" value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">{t('pages.services.selectCategory', 'اختر الفئة')}</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('pages.services.duration', 'المدة التقديرية')}</label>
            <input className="input-field" placeholder={t('pages.services.durationPlaceholder', 'مثال: 30-45 دقيقة')} value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t('pages.services.saving', 'جاري الحفظ...')}</span> : t('pages.services.update', 'تحديث')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">{t('pages.services.cancel', 'إلغاء')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ service, onClose }: { service: ServiceListing; onClose: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => serviceListingsApi.deleteService(service.id),
    onSuccess: () => {
      toast.success(t('toast.success.serviceDeleted', 'تم حذف الخدمة'));
      queryClient.invalidateQueries({ queryKey: ['myServiceListings'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.failedDelete', 'فشل في حذف الخدمة')),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-danger-500" />
          </div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">{t('pages.services.deleteConfirm.title', 'حذف الخدمة')}</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">{t('pages.services.deleteConfirm.message', 'هل أنت متأكد من حذف هذه الخدمة؟')}</p>
          <p className="font-semibold text-surface-800 dark:text-surface-200">{service.name}</p>
        </div>
        <div className="flex items-center gap-3 px-5 pb-5">
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-danger flex-1">
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('pages.services.deleteConfirm.confirm', 'حذف')}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">{t('pages.services.deleteConfirm.cancel', 'إلغاء')}</button>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceListing | null>(null);

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['serviceCategories'],
    queryFn: () => serviceListingsApi.getCategories(),
  });

  const { data: catalog = [] } = useQuery<ServiceCatalogCategory[]>({
    queryKey: ['serviceCatalog'],
    queryFn: () => serviceListingsApi.getCatalog(),
  });

  
  const { data: services = [], isLoading } = useQuery<ServiceListing[]>({
    queryKey: ['myServiceListings'],
    queryFn: () => serviceListingsApi.getMyServices(),
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (svc: ServiceListing) =>
      serviceListingsApi.patchService(svc.id, { isVisible: !svc.isVisible }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myServiceListings'] }),
    onError: () => toast.error(t('toast.error.failedUpdate', 'فشل في التحديث')),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (svc: ServiceListing) =>
      serviceListingsApi.patchService(svc.id, { isAvailable: !svc.isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myServiceListings'] }),
    onError: () => toast.error(t('toast.error.failedUpdate', 'فشل في التحديث')),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => serviceListingsApi.duplicateService(id),
    onSuccess: () => {
      toast.success(t('toast.success.serviceDuplicated', 'تم نسخ الخدمة'));
      queryClient.invalidateQueries({ queryKey: ['myServiceListings'] });
    },
    onError: () => toast.error(t('toast.error.failedSaveServices', 'فشل في نسخ الخدمة')),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => serviceListingsApi.restoreService(id),
    onSuccess: () => {
      toast.success(t('toast.success.serviceRestored', 'تم استعادة الخدمة'));
      queryClient.invalidateQueries({ queryKey: ['myServiceListings'] });
    },
    onError: () => toast.error(t('toast.error.failedUpdate', 'فشل في الاستعادة')),
  });

  const filtered = services.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== '' && s.categoryId !== categoryFilter) return false;
    return true;
  });

  const activeServices = filtered.filter((s) => !s.isDeleted);
  const deletedServices = filtered.filter((s) => s.isDeleted);

  const formatPrice = (price: number) => new Intl.NumberFormat('ar-SA', { style: 'decimal', minimumFractionDigits: 0 }).format(price);

  const priceTypeLabels: Record<string, string> = {
    fixed: t('pages.services.fixedPrice', 'ثابت'),
    starting: t('pages.services.startingPrice', 'يبدأ من'),
    negotiable: t('pages.services.negotiable', 'قابل للتفاوض'),
  };

  const groupByCategory = (items: ServiceListing[]) => {
    const groups: { [key: string]: ServiceListing[] } = {};
    items.forEach((s) => {
      const key = s.categoryName || t('pages.services.uncategorized', 'غير مصنف');
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-surface-900 dark:text-surface-100">
          <Wrench className="h-6 w-6 text-accent-400" />
          {t('pages.services.manageServices', 'إدارة الخدمات')}
        </h1>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('pages.services.addService', 'إضافة خدمة')}
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.services.searchPlaceholder', 'بحث في الخدمات...')}
            className="input-field pr-10 w-full"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
              <X size={16} />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="">{t('pages.services.allCategories', 'جميع الفئات')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
        <div className="card p-3 dark:bg-surface-900">
          <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{activeServices.length}</p>
          <p className="text-xs text-surface-400">{t('pages.services.totalServices', 'إجمالي الخدمات')}</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-green-400">{activeServices.filter((s) => s.isVisible).length}</p>
          <p className="text-xs text-surface-400">{t('pages.services.visible', 'مرئية')}</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-accent-400">{activeServices.filter((s) => s.isAvailable).length}</p>
          <p className="text-xs text-surface-400">{t('pages.services.available', 'متاحة')}</p>
        </div>
      </div>

      {activeServices.length === 0 && !search && categoryFilter === '' ? (
        <EmptyState
          icon={Wrench}
          title={t('pages.services.emptyTitle', 'لا توجد خدمات بعد')}
          description={t('pages.services.emptyDescription', 'أضف خدماتك ليرىها العملاء')}
          action={{ label: t('pages.services.addService', 'إضافة خدمة'), onClick: () => setShowAddForm(true) }}
        />
      ) : activeServices.length === 0 ? (
        <EmptyState icon={Search} title={t('pages.services.noResults', 'لا توجد نتائج')} description={t('pages.services.noResultsDesc', 'جرّب تغيير معايير البحث')} />
      ) : (
        <div className="space-y-5">
          {Object.entries(groupByCategory(activeServices)).map(([catName, catServices]) => (
            <div key={catName} className="space-y-2">
              <h3 className="text-sm font-bold text-surface-400 flex items-center gap-2">
                <Package size={14} />
                {catName}
                <span className="text-[10px] font-normal text-surface-500">({catServices.length})</span>
              </h3>
              {catServices.map((svc) => (
                <div key={svc.id} className="card p-4 group relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center shrink-0">
                      <Wrench size={18} className="text-accent-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-surface-900 dark:text-surface-100 text-sm leading-tight">{svc.name}</h3>
                          {svc.templateName && svc.templateName !== svc.name && (
                            <span className="text-[10px] text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded-full">{svc.templateName}</span>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <p className="font-bold text-accent-400 text-lg leading-tight">{formatPrice(svc.price)} <span className="text-xs text-surface-400">ر.س</span></p>
                          {svc.priceType !== 'fixed' && (
                            <p className="text-[10px] text-surface-500">{priceTypeLabels[svc.priceType] || svc.priceType}</p>
                          )}
                        </div>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-surface-500 mt-1 line-clamp-2">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {svc.estimatedDuration && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700/50 text-surface-500">{svc.estimatedDuration}</span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${svc.isVisible ? 'bg-green-500/10 text-green-400' : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500'}`}>
                          {svc.isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                          {svc.isVisible ? t('pages.services.visible', 'مرئية') : t('pages.services.hidden', 'مخفية')}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${svc.isAvailable ? 'bg-blue-500/10 text-blue-400' : 'bg-surface-100 dark:bg-surface-700/50 text-surface-500'}`}>
                          {svc.isAvailable ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {svc.isAvailable ? t('pages.services.available', 'متاحة') : t('pages.services.unavailable', 'غير متاحة')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleVisibilityMutation.mutate(svc)} className="p-1.5 rounded-lg bg-surface-800/90 hover:bg-surface-700 text-surface-400 hover:text-white transition-colors" title={svc.isVisible ? 'إخفاء' : 'إظهار'}>
                      {svc.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => toggleAvailabilityMutation.mutate(svc)} className={`p-1.5 rounded-lg bg-surface-800/90 hover:bg-surface-700 transition-colors ${svc.isAvailable ? 'text-green-400 hover:text-red-400' : 'text-red-400 hover:text-green-400'}`} title={svc.isAvailable ? 'غير متاحة' : 'متاحة'}>
                      {svc.isAvailable ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                    <button onClick={() => setEditingService(svc)} className="p-1.5 rounded-lg bg-surface-800/90 hover:bg-surface-700 text-surface-400 hover:text-white transition-colors" title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => duplicateMutation.mutate(svc.id)} className="p-1.5 rounded-lg bg-surface-800/90 hover:bg-surface-700 text-surface-400 hover:text-white transition-colors" title="نسخ">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setDeletingService(svc)} className="p-1.5 rounded-lg bg-surface-800/90 hover:bg-danger-500/20 text-surface-400 hover:text-danger-400 transition-colors" title="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {deletedServices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-surface-400 flex items-center gap-2">
            <Trash2 size={14} />
            {t('pages.services.deletedServices', 'الخدمات المحذوفة')} ({deletedServices.length})
          </h2>
          {deletedServices.map((svc) => (
            <div key={svc.id} className="card p-4 opacity-50 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench size={16} className="text-surface-500" />
                  <div>
                    <h3 className="font-medium text-surface-400 dark:text-surface-500 text-sm line-through">{svc.name}</h3>
                    <p className="text-xs text-surface-500 dark:text-surface-500">{svc.categoryName}</p>
                  </div>
                </div>
                <button onClick={() => restoreMutation.mutate(svc.id)} className="btn-secondary text-xs py-1.5 px-3">
                  {t('pages.services.restore', 'استعادة')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && <AddServiceModal catalog={catalog} onClose={() => setShowAddForm(false)} />}
      {editingService && <EditServiceModal service={editingService} categories={categories} onClose={() => setEditingService(null)} />}
      {deletingService && <DeleteConfirmModal service={deletingService} onClose={() => setDeletingService(null)} />}
    </div>
  );
}
