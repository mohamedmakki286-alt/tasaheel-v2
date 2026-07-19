import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ToggleLeft, ToggleRight, Eye, Download, CheckCircle, XCircle, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getWorkshops, approveWorkshop, rejectWorkshop, toggleWorkshopStatus, deleteWorkshop, createWorkshop, sendWorkshopInvitation } from '../api/workshops.api';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone } from '../utils/formatters';
import { exportDataToPDF } from '../utils/exportPdf';
import { WORKSHOP_TYPES } from '../utils/constants';
import type { Workshop } from '../types';

function getWStatus(w: Workshop): string {
  if (w.isApproved) return 'approved';
  if (w.rejectionReason) return 'rejected';
  return 'pending';
}

function getServicesCount(w: Workshop): number {
  return w.services ? w.services.split(',').filter(Boolean).length : 0;
}

export default function WorkshopsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [workshopTypeFilter, setWorkshopTypeFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const emptyForm = { name: '', ownerName: '', phone: '', whatsapp: '', email: '', password: '', city: '', address: '', workshopType: 'stationary', beneficiaryName: '', bankName: '', iban: '', taxNumber: '', commissionPercentage: '10', adminNotes: '', contractSignedAt: '', contractExpiresAt: '', isApproved: false, isActive: false, sendInvitation: true };
  const [createForm, setCreateForm] = useState(emptyForm);
  const [contractFile, setContractFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['workshops', page, search, sortKey, sortOrder, statusFilter, workshopTypeFilter],
    queryFn: () => getWorkshops({ page, search, sortBy: sortKey, sortOrder, status: statusFilter || undefined, workshopType: workshopTypeFilter || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: approveWorkshop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success(t('toast.success.workshopApproved'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.workshopApproveFailed')),
  });

  const rejectMutation = useMutation({
    mutationFn: (params: { id: number; reason: string }) => rejectWorkshop(params.id, params.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success(t('toast.success.workshopRejected'));
      setRejectId(null);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.workshopRejectFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (params: { id: number; isActive: boolean }) => toggleWorkshopStatus(params.id, params.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success(t('toast.success.statusChanged'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.statusChangeFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkshop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success(t('toast.success.workshopDeleted'));
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.workshopDeleteFailed')),
  });

  const createMutation = useMutation({
    mutationFn: (form: typeof createForm) => {
      const fd = new FormData();
      fd.append('workshop', JSON.stringify({
        name: form.name, ownerName: form.ownerName, phone: form.phone,
        email: form.email, password: form.password, city: form.city,
        address: form.address, workshopType: form.workshopType, whatsapp: form.whatsapp,
        beneficiaryName: form.beneficiaryName, bankName: form.bankName, iban: form.iban,
        taxNumber: form.taxNumber, commissionPercentage: Number(form.commissionPercentage || 0),
        adminNotes: form.adminNotes, contractSignedAt: form.contractSignedAt || null,
        contractExpiresAt: form.contractExpiresAt || null, isApproved: form.isApproved, isActive: form.isActive,
      }));
      if (contractFile) fd.append('contract', contractFile);
      return createWorkshop(fd);
    },
    onSuccess: async (created) => {
      if (createForm.sendInvitation && !createForm.password && created?.id) {
        try {
          const invite = await sendWorkshopInvitation(created.id);
          await navigator.clipboard?.writeText(invite.invitationUrl);
          toast.success('تم إنشاء الورشة ونسخ رابط إعداد كلمة المرور');
        } catch { toast.error('تم إنشاء الورشة، لكن تعذر إرسال الدعوة'); }
      }
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      if (!createForm.sendInvitation || createForm.password) toast.success(t('toast.success.workshopAdded'));
      setShowCreateModal(false);
      setCreateForm(emptyForm); setContractFile(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.workshopAddFailed')),
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const columns: Column<Workshop>[] = [
    { key: 'id', label: '#', sortable: true, width: '60px' },
    {
      key: 'name', label: t('pages.workshops.table.name'), sortable: true,
      render: (w) => (
        <div className="flex items-center gap-3">
          <Avatar name={w.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{w.name}</p>
            <p className="text-xs text-gray-400">{w.ownerName}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: t('pages.workshops.table.phone'), render: (w) => <span className="text-sm font-mono" dir="ltr">{formatPhone(w.phone)}</span> },
    { key: 'city', label: t('pages.workshops.table.city'), sortable: true },
    {
      key: 'workshopType', label: t('pages.workshops.table.type'), sortable: false,
      render: (w) => {
        const colors: Record<string, string> = {
          stationary: 'bg-blue-100 text-blue-700',
          mobile: 'bg-amber-100 text-amber-700',
          both: 'bg-purple-100 text-purple-700',
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[w.workshopType] || 'bg-gray-100 text-gray-700'}`}>
            {t(`constants.workshopTypes.${w.workshopType}`)}
          </span>
        );
      },
    },
    {
      key: 'rating', label: t('pages.workshops.table.rating'), sortable: true,
      render: (w) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
          {w.rating.toFixed(1)} ★
        </span>
      ),
    },
    { key: 'servicesCount', label: t('pages.workshops.table.services'), sortable: true, render: (w) => `${getServicesCount(w)}` },
    { key: 'status', label: t('pages.workshops.table.status'), render: (w) => <StatusBadge status={getWStatus(w)} /> },
    {
      key: 'actions', label: t('pages.workshops.table.actions'),
      render: (w) => {
        const wStatus = getWStatus(w);
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {wStatus === 'pending' && (
              <>
                <Button variant="ghost" size="sm" icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} onClick={() => approveMutation.mutate(w.id)} title={t('pages.workshops.approve')} />
                <Button variant="ghost" size="sm" icon={<XCircle className="w-4 h-4 text-red-500" />} onClick={() => { setRejectId(w.id); setRejectReason(''); }} title={t('pages.workshops.reject')} />
              </>
            )}
            <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/workshops/${w.id}`)} title={t('common.view')} />
            <Button variant="ghost" size="sm" icon={w.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} onClick={() => toggleMutation.mutate({ id: w.id, isActive: !w.isActive })} title={w.isActive ? t('pages.workshops.disable') : t('pages.workshops.enable')} />
            <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleteId(w.id)} title={t('common.delete')} />
          </div>
        );
      },
    },
  ];

  if (isLoading) return <CardSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.workshops.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.workshops.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
            const items = data?.data || [];
            if (!items.length) { toast.error(t('toast.error.noExportData')); return; }
            exportDataToPDF(items.map((w: Workshop) => ({ '#': w.id, [t('pages.workshops.table.name')]: w.name, [t('pages.workshops.detail.owner')]: w.ownerName, [t('pages.workshops.table.phone')]: w.phone, [t('pages.workshops.table.city')]: w.city, [t('pages.workshops.table.rating')]: w.rating.toFixed(1) })), t('pages.workshops.title'), t('pages.workshops.subtitle'));
            toast.success(t('toast.success.exportSuccess'));
          }}>{t('common.export')}</Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>{t('pages.workshops.addWorkshop')}</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={data?.meta ? {
          currentPage: data.meta.currentPage,
          lastPage: data.meta.lastPage,
          total: data.meta.total,
          onPageChange: setPage,
        } : undefined}
        onRowClick={(w) => navigate(`/workshops/${w.id}`)}
        keyExtractor={(w) => w.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field text-xs py-1.5 w-auto"
            >
              <option value="">{t('pages.workshops.filterStatuses.all')}</option>
              <option value="approved">{t('pages.workshops.filterStatuses.approved')}</option>
              <option value="pending">{t('pages.workshops.filterStatuses.pending')}</option>
              <option value="rejected">{t('pages.workshops.filterStatuses.rejected')}</option>
            </select>
            <select
              value={workshopTypeFilter}
              onChange={(e) => { setWorkshopTypeFilter(e.target.value); setPage(1); }}
              className="select-field text-xs py-1.5 w-auto"
            >
              <option value="">{t('pages.workshops.filterTypes.all')}</option>
              {WORKSHOP_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>{t(`constants.workshopTypes.${wt.value}`)}</option>
              ))}
            </select>
          </div>
        }
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.workshops.deleteTitle')}
        message={t('pages.workshops.deleteMessage')}
        isLoading={deleteMutation.isPending}
      />

      {/* Create workshop modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateForm(emptyForm); setContractFile(null); }}
        title={t('pages.workshops.addModal.title')}
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); setCreateForm(emptyForm); setContractFile(null); }} className="flex-1">{t('common.cancel')}</Button>
            <Button onClick={() => createMutation.mutate(createForm)} isLoading={createMutation.isPending} className="flex-1">{t('pages.workshops.addModal.submit')}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.workshops.addModal.workshopName')}</label>
            <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="input-field w-full" placeholder={t('pages.workshops.addModal.workshopNamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.workshops.addModal.ownerName')}</label>
            <input type="text" value={createForm.ownerName} onChange={(e) => setCreateForm({ ...createForm, ownerName: e.target.value })} className="input-field w-full" placeholder={t('pages.workshops.addModal.ownerNamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label>
            <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="input-field w-full" dir="ltr" placeholder={t('pages.workshops.addModal.phonePlaceholder')} />
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">رقم واتساب</label><input value={createForm.whatsapp} onChange={(e) => setCreateForm({ ...createForm, whatsapp: e.target.value })} className="input-field w-full" dir="ltr" /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
            <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="input-field w-full" dir="ltr" placeholder={t('pages.workshops.addModal.emailPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.password')}</label>
            <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="input-field w-full" placeholder={t('pages.workshops.addModal.passwordPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.city')}</label>
            <input type="text" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className="input-field w-full" placeholder={t('pages.workshops.addModal.cityPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.workshops.addModal.workshopType')}</label>
            <select
              value={createForm.workshopType}
              onChange={(e) => setCreateForm({ ...createForm, workshopType: e.target.value })}
              className="input-field w-full"
            >
              {WORKSHOP_TYPES.map((wt) => (
                <option key={wt.value} value={wt.value}>{t(`constants.workshopTypes.${wt.value}`)}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.address')}</label>
            <input type="text" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} className="input-field w-full" placeholder={t('pages.workshops.addModal.addressPlaceholder')} />
          </div>
          <div className="sm:col-span-2 border-t pt-4"><h3 className="font-bold text-gray-900">بيانات استلام المستحقات</h3><p className="text-xs text-gray-500">بيانات داخلية لا تظهر للعميل أو الورشة.</p></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم المستفيد</label><input value={createForm.beneficiaryName} onChange={(e) => setCreateForm({ ...createForm, beneficiaryName: e.target.value })} className="input-field w-full" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">اسم البنك</label><input value={createForm.bankName} onChange={(e) => setCreateForm({ ...createForm, bankName: e.target.value })} className="input-field w-full" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label><input value={createForm.iban} onChange={(e) => setCreateForm({ ...createForm, iban: e.target.value.toUpperCase().replace(/\s/g, '') })} className="input-field w-full" dir="ltr" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي</label><input value={createForm.taxNumber} onChange={(e) => setCreateForm({ ...createForm, taxNumber: e.target.value })} className="input-field w-full" dir="ltr" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">عمولة المنصة %</label><input type="number" min="0" max="100" value={createForm.commissionPercentage} onChange={(e) => setCreateForm({ ...createForm, commissionPercentage: e.target.value })} className="input-field w-full" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">العقد الورقي (PDF اختياري)</label><label className="input-field w-full flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4" />{contractFile?.name || 'اختيار ملف'}<input type="file" accept="application/pdf" className="hidden" onChange={(e) => setContractFile(e.target.files?.[0] || null)} /></label></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">تاريخ توقيع العقد</label><input type="date" value={createForm.contractSignedAt} onChange={(e) => setCreateForm({ ...createForm, contractSignedAt: e.target.value })} className="input-field w-full" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">انتهاء العقد (اختياري)</label><input type="date" value={createForm.contractExpiresAt} onChange={(e) => setCreateForm({ ...createForm, contractExpiresAt: e.target.value })} className="input-field w-full" /></div>
          <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات الإدارة</label><textarea value={createForm.adminNotes} onChange={(e) => setCreateForm({ ...createForm, adminNotes: e.target.value })} className="input-field w-full" rows={2} /></div>
          <div className="sm:col-span-2 border-t pt-4 space-y-3">
            <label className="flex items-center gap-3"><input type="checkbox" checked={createForm.sendInvitation} onChange={(e) => setCreateForm({ ...createForm, sendInvitation: e.target.checked })} /><span className="text-sm font-medium">إرسال رابط إعداد كلمة المرور ونسخه (إذا تركت كلمة المرور فارغة)</span></label>
            <label className="flex items-center gap-3"><input type="checkbox" checked={createForm.isActive} onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })} /><span className="text-sm font-medium">تفعيل دخول الورشة الآن</span></label>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.isApproved}
                onChange={(e) => setCreateForm({ ...createForm, isApproved: e.target.checked })}
                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">{t('pages.workshops.addModal.autoApprove', 'تفعيل الورشة فوراً (بدون انتظار الموافقة)')}</span>
            </label>
            <p className="text-xs text-gray-400 mt-1 mr-7">{t('pages.workshops.addModal.autoApproveHint', 'إذا لم يتم التفعيل، ستظهر الورشة كـ "قيد المراجعة" وتنتظر موافقتكم')}</p>
          </div>
        </div>
      </Modal>

      {/* Reject dialog */}
      <Modal
        isOpen={rejectId !== null}
        onClose={() => { setRejectId(null); setRejectReason(''); }}
        title={t('pages.workshops.rejectModal.title')}
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1">{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, reason: rejectReason || t('pages.workshops.rejectModal.defaultReason') })} isLoading={rejectMutation.isPending} className="flex-1">{t('pages.workshops.rejectModal.confirm')}</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-red-100">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 mb-3">{t('pages.workshops.rejectModal.message')}</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('pages.workshops.rejectModal.reasonPlaceholder')}
            className="input-field w-full text-sm"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
