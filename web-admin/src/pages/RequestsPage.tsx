import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Download, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getRequests, deleteRequest } from '../api/requests.api';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate } from '../utils/formatters';
import { exportDataToPDF } from '../utils/exportPdf';
import type { MaintenanceRequest } from '../types';
import { REQUEST_STATUSES } from '../utils/constants';

export default function RequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['requests', page, search, statusFilter, sortKey, sortOrder],
    queryFn: () => getRequests({ page, search, status: statusFilter || undefined, sortBy: sortKey, sortOrder }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success(t('toast.success.requestDeleted'));
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.requestDeleteFailed')),
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'id', label: '#', sortable: true, width: '60px' },
    {
      key: 'customerName', label: t('pages.requests.table.customer'), sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.customerName} size="sm" />
          <span className="font-medium text-gray-900">{r.customerName}</span>
        </div>
      ),
    },
    { key: 'carMake', label: t('pages.requests.table.car'), render: (r) => <span className="text-sm text-gray-700">{r.carMake} {r.carModel} ({r.carYear})</span> },
    { key: 'serviceType', label: t('pages.requests.table.service') },
    { key: 'workshopName', label: t('pages.requests.table.workshop') },
    { key: 'status', label: t('pages.requests.table.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'city', label: t('pages.requests.table.city'), sortable: true },
    { key: 'createdAt', label: t('pages.requests.table.createdAt'), sortable: true, render: (r) => <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', label: t('pages.requests.table.actions'),
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/requests/${r.id}`)} />
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleteId(r.id)} />
        </div>
      ),
    },
  ];

  if (isLoading) return <CardSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.requests.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.requests.subtitle')}</p>
        </div>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
            const items = data?.data || [];
            if (!items.length) { toast.error(t('toast.error.noExportData')); return; }
            exportDataToPDF(items.map((r: MaintenanceRequest) => ({ '#': r.id, [t('pages.requests.table.customer')]: r.customerName, [t('pages.requests.table.car')]: `${r.carMake} ${r.carModel}`, [t('pages.requests.table.service')]: r.serviceType, [t('pages.requests.table.status')]: r.status, [t('pages.requests.table.createdAt')]: formatDate(r.createdAt) })), t('pages.requests.title'), t('pages.requests.title'));
            toast.success(t('toast.success.exportSuccess'));
          }}>{t('common.export')}</Button>
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
        onRowClick={(r) => navigate(`/requests/${r.id}`)}
        keyExtractor={(r) => r.id}
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
              {REQUEST_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{t(`constants.statusLabels.${s.value}`)}</option>
              ))}
            </select>
          </div>
        }
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.requests.deleteTitle')}
        message={t('pages.requests.deleteMessage')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
