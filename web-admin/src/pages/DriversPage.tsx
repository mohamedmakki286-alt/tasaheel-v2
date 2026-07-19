import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ToggleLeft, ToggleRight, Eye, Download, CheckCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDrivers, approveDriver, toggleDriverStatus, deleteDriver, createDriver } from '../api/drivers.api';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone } from '../utils/formatters';
import { exportDataToPDF } from '../utils/exportPdf';
import type { Driver } from '../types';

export default function DriversPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', password: '', city: '', vehicleType: '', plateNumber: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, search, sortKey, sortOrder, statusFilter],
    queryFn: () => getDrivers({ page, search, sortBy: sortKey, sortOrder, status: statusFilter || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: approveDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('toast.success.driverApproved'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.driverApproveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleDriverStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('toast.success.statusChanged'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.statusChangeFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('toast.success.driverDeleted'));
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.driverDeleteFailed')),
  });

  const createMutation = useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('toast.success.driverAdded'));
      setShowCreateModal(false);
      setCreateForm({ name: '', phone: '', email: '', password: '', city: '', vehicleType: '', plateNumber: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.driverAddFailed')),
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const columns: Column<Driver>[] = [
    { key: 'id', label: '#', sortable: true, width: '60px' },
    {
      key: 'name', label: t('pages.drivers.table.name'), sortable: true,
      render: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{d.name}</p>
            <p className="text-xs text-gray-400">{d.email || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: t('pages.drivers.table.phone'), render: (d) => <span className="text-sm font-mono" dir="ltr">{formatPhone(d.phone)}</span> },
    { key: 'city', label: t('pages.drivers.table.city'), sortable: true },
    { key: 'vehicleType', label: t('pages.drivers.table.vehicle'), render: (d) => <BadgeVehicle type={d.vehicleType} /> },
    { key: 'isOnline', label: t('pages.drivers.table.connectionStatus'), render: (d) => <StatusBadge status={d.isOnline ? 'online' : 'offline'} /> },
    { key: 'isApproved', label: t('pages.drivers.table.approved'), render: (d) => <StatusBadge status={d.isApproved ? 'approved' : 'pending'} /> },
    {
      key: 'actions', label: t('pages.drivers.table.actions'),
      render: (d) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!d.isApproved && (
            <Button variant="ghost" size="sm" icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} onClick={() => approveMutation.mutate(d.id)} />
          )}
          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/drivers/${d.id}`)} />
          <Button variant="ghost" size="sm" icon={d.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} onClick={() => toggleMutation.mutate({ id: d.id, isActive: !d.isActive })} />
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleteId(d.id)} />
        </div>
      ),
    },
  ];

  if (isLoading) return <CardSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.drivers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.drivers.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
            const items = data?.data || [];
            if (!items.length) { toast.error(t('toast.error.noExportData')); return; }
            exportDataToPDF(items.map((d: Driver) => ({ '#': d.id, [t('pages.drivers.table.name')]: d.name, [t('pages.drivers.table.phone')]: d.phone, [t('pages.drivers.table.city')]: d.city, [t('pages.drivers.table.vehicle')]: d.vehicleType })), t('pages.drivers.title'), t('pages.drivers.subtitle'));
            toast.success(t('toast.success.exportSuccess'));
          }}>{t('common.export')}</Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>{t('pages.drivers.addDriver')}</Button>
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
        onRowClick={(d) => navigate(`/drivers/${d.id}`)}
        keyExtractor={(d) => d.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field text-xs py-1.5 w-auto"
            >
              <option value="">{t('common.allStatuses')}</option>
              <option value="approved">{t('common.approved')}</option>
              <option value="pending">{t('common.pending')}</option>
            </select>
          </div>
        }
      />

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setCreateForm({ name: '', phone: '', email: '', password: '', city: '', vehicleType: '', plateNumber: '' }); }}
        title={t('pages.drivers.addModal.title')}
        size="lg"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); setCreateForm({ name: '', phone: '', email: '', password: '', city: '', vehicleType: '', plateNumber: '' }); }} className="flex-1">{t('common.cancel')}</Button>
            <Button onClick={() => createMutation.mutate(createForm)} isLoading={createMutation.isPending} className="flex-1">{t('pages.drivers.addModal.submit')}</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.drivers.addModal.driverName')}</label>
            <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="input-field w-full" placeholder={t('pages.drivers.addModal.driverNamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label>
            <input type="text" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} className="input-field w-full" dir="ltr" placeholder={t('pages.drivers.addModal.phonePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
            <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} className="input-field w-full" dir="ltr" placeholder={t('pages.drivers.addModal.emailPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.password')}</label>
            <input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} className="input-field w-full" placeholder={t('pages.drivers.addModal.passwordPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.city')}</label>
            <input type="text" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} className="input-field w-full" placeholder={t('pages.drivers.addModal.cityPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.drivers.addModal.vehicleType')}</label>
            <input type="text" value={createForm.vehicleType} onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })} className="input-field w-full" placeholder={t('pages.drivers.addModal.vehicleTypePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.drivers.addModal.plateNumber')}</label>
            <input type="text" value={createForm.plateNumber} onChange={(e) => setCreateForm({ ...createForm, plateNumber: e.target.value })} className="input-field w-full" placeholder={t('pages.drivers.addModal.plateNumberPlaceholder')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.drivers.deleteTitle')}
        message={t('pages.drivers.deleteMessage')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function BadgeVehicle({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/10">
      {type}
    </span>
  );
}
