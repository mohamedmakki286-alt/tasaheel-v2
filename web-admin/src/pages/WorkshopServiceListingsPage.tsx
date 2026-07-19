import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Wrench, Eye, EyeOff, Trash2, Search, X, ChevronLeft, ChevronRight,
  Clock, User, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceListingsAdminApi, type ServiceListing, type AuditLogEntry } from '../api/serviceListings.api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import clsx from 'clsx';

export default function WorkshopServiceListingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState<'listings' | 'audit'>('listings');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['adminServiceListings', search, page],
    queryFn: () => serviceListingsAdminApi.getAll({ search: search || undefined, page, size: 20 }),
  });

  const { data: auditLog, isLoading: auditLoading } = useQuery({
    queryKey: ['adminServiceAuditLog', page],
    queryFn: () => serviceListingsAdminApi.getAuditLog({ page, size: 20 }),
    enabled: activeTab === 'audit',
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: (id: number) => serviceListingsAdminApi.toggleVisibility(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServiceListings'] });
      toast.success(t('toast.success.serviceUpdated', 'تم التحديث'));
    },
    onError: () => toast.error(t('toast.error.failedUpdate', 'فشل في التحديث')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => serviceListingsAdminApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminServiceListings'] });
      toast.success(t('toast.success.serviceDeleted', 'تم الحذف'));
      setDeleteId(null);
    },
    onError: () => toast.error(t('toast.error.failedDelete', 'فشل في الحذف')),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'decimal', minimumFractionDigits: 0 }).format(price);
  };

  const actionLabels: Record<string, string> = {
    CREATE: 'إنشاء',
    UPDATE: 'تعديل',
    SOFT_DELETE: 'حذف',
    DELETE: 'حذف',
    RESTORE: 'استعادة',
    TOGGLE_VISIBILITY: 'تغيير الرؤية',
    TOGGLE_AVAILABILITY: 'تغيير التوفر',
    REORDER: 'إعادة ترتيب',
  };

  const actionColors: Record<string, string> = {
    CREATE: 'success',
    UPDATE: 'info',
    SOFT_DELETE: 'danger',
    DELETE: 'danger',
    RESTORE: 'warning',
    TOGGLE_VISIBILITY: 'info',
    TOGGLE_AVAILABILITY: 'info',
    REORDER: 'gray',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-amber-500" />
          {t('pages.workshopServices.title', 'خدمات الورش')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('pages.workshopServices.subtitle', 'إدارة جميع الخدمات المقدمة من الورش')}</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('listings'); setPage(0); }}
          className={clsx('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'listings' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          {t('pages.workshopServices.tabListings', 'الخدمات')} ({listings?.totalElements ?? 0})
        </button>
        <button
          onClick={() => { setActiveTab('audit'); setPage(0); }}
          className={clsx('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'audit' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Clock size={14} className="inline ml-1" />
          {t('pages.workshopServices.tabAudit', 'سجل التغييرات')}
        </button>
      </div>

      {activeTab === 'listings' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={t('pages.workshopServices.searchPlaceholder', 'بحث بالاسم أو اسم الورشة...')}
              className="input-field pr-10 w-full"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(0); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : !listings?.data?.length ? (
            <div className="text-center py-12 text-gray-400">
              <Wrench size={40} className="mx-auto mb-3 opacity-40" />
              <p>{t('pages.workshopServices.empty', 'لا توجد خدمات')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.data.map((svc) => (
                <div key={svc.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Wrench size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm">{svc.name}</h3>
                        <p className="text-xs text-gray-400">{svc.workshopName} {svc.categoryName ? `· ${svc.categoryName}` : ''}</p>
                      </div>
                      <p className="text-sm font-bold text-amber-600 shrink-0">{formatPrice(svc.price)} ر.س</p>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={svc.isVisible ? 'success' : 'gray'}>
                        {svc.isVisible ? 'مرئية' : 'مخفية'}
                      </Badge>
                      <Badge variant={svc.isAvailable ? 'info' : 'gray'}>
                        {svc.isAvailable ? 'متاحة' : 'غير متاحة'}
                      </Badge>
                      {svc.isDeleted && <Badge variant="danger">محذوفة</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleVisibilityMutation.mutate(svc.id)}
                      className={clsx('p-2 rounded-lg transition-colors',
                        svc.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                      )}
                      title={svc.isVisible ? 'إخفاء' : 'إظهار'}
                    >
                      {svc.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => setDeleteId(svc.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {listings && listings.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                صفحة {page + 1} من {listings.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  icon={<ChevronRight size={16} />}
                >
                  السابق
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= listings.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي <ChevronLeft size={16} className="mr-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'audit' && (
        <>
          {auditLoading ? (
            <LoadingSpinner />
          ) : !auditLog?.data?.length ? (
            <div className="text-center py-12 text-gray-400">
              <Clock size={40} className="mx-auto mb-3 opacity-40" />
              <p>{t('pages.workshopServices.emptyAudit', 'لا يوجد سجل بعد')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLog.data.map((log) => (
                <div key={log.id} className="card p-3 flex items-start gap-3">
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    (actionColors[log.action] === 'danger') && 'bg-red-50',
                    (actionColors[log.action] === 'success') && 'bg-green-50',
                    (actionColors[log.action] === 'info') && 'bg-blue-50',
                    (actionColors[log.action] === 'warning') && 'bg-amber-50',
                    (!actionColors[log.action]) && 'bg-gray-50',
                  )}>
                    <AlertTriangle size={14} className={clsx(
                      (actionColors[log.action] === 'danger') && 'text-red-500',
                      (actionColors[log.action] === 'success') && 'text-green-500',
                      (actionColors[log.action] === 'info') && 'text-blue-500',
                      (actionColors[log.action] === 'warning') && 'text-amber-500',
                      (!actionColors[log.action]) && 'text-gray-500',
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={actionColors[log.action] as any || 'gray'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      {log.serviceName && (
                        <span className="text-sm font-medium text-gray-900">{log.serviceName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {log.workshopName && <span>{log.workshopName}</span>}
                      {log.performedByRole && <span>· بواسطة {log.performedByRole === 'admin' ? 'المدير' : 'الورشة'}</span>}
                      <span>· {new Date(log.performedAt).toLocaleString('ar-SA')}</span>
                    </div>
                    {log.field && log.oldValue && log.newValue && (
                      <p className="text-xs text-gray-500 mt-1">
                        {log.field}: <span className="line-through text-gray-400">{log.oldValue}</span> → <span className="text-gray-700">{log.newValue}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {auditLog && auditLog.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                صفحة {page + 1} من {auditLog.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  icon={<ChevronRight size={16} />}
                >
                  السابق
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= auditLog.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي <ChevronLeft size={16} className="mr-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.services.deleteTitle', 'حذف الخدمة')}
        message={t('pages.services.deleteMessage', 'هل أنت متأكد من حذف هذه الخدمة؟')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
