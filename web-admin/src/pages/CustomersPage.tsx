import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ToggleLeft, ToggleRight, Eye, Download, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCustomers, toggleCustomerStatus, deleteCustomer } from '../api/customers.api';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone } from '../utils/formatters';
import { exportDataToPDF } from '../utils/exportPdf';
import type { Customer } from '../types';

export default function CustomersPage() {
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
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, sortKey, sortOrder, statusFilter],
    queryFn: () => getCustomers({ page, search, sortBy: sortKey, sortOrder, status: statusFilter || undefined }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleCustomerStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('toast.success.statusChanged'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.statusChangeFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(t('toast.success.customerDeleted'));
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.customerDeleteFailed')),
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const columns: Column<Customer>[] = [
    { key: 'id', label: '#', sortable: true, width: '60px' },
    {
      key: 'name', label: t('pages.customers.table.name'), sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-400">{c.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone', label: t('pages.customers.table.phone'),
      render: (c) => <span className="text-sm font-mono" dir="ltr">{formatPhone(c.phone)}</span>,
    },
    { key: 'city', label: t('pages.customers.table.city'), sortable: true },
    {
      key: 'carsCount', label: t('pages.customers.table.cars'), sortable: true,
      render: (c) => <BadgeNum value={c.carsCount} />,
    },
    {
      key: 'requestsCount', label: t('pages.customers.table.requests'), sortable: true,
      render: (c) => <BadgeNum value={c.requestsCount} />,
    },
    {
      key: 'joinedAt', label: t('pages.customers.table.registerDate'), sortable: true,
      render: (c) => <span className="text-sm text-gray-500">{formatDate(c.joinedAt)}</span>,
    },
    {
      key: 'isActive', label: t('pages.customers.table.status'),
      render: (c) => <StatusBadge status={c.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions', label: t('pages.customers.table.actions'),
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => navigate(`/customers/${c.id}`)} />
          <Button variant="ghost" size="sm" icon={c.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })} />
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleteId(c.id)} />
        </div>
      ),
    },
  ];

  if (isLoading) return <CardSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.customers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.customers.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
              const items = data?.data || [];
              if (!items.length) { toast.error(t('toast.error.noExportData')); return; }
              exportDataToPDF(items.map((c: Customer) => ({ '#': c.id, [t('pages.customers.table.name')]: c.name, [t('pages.customers.table.phone')]: c.phone, [t('pages.customers.table.city')]: c.city, [t('pages.customers.table.cars')]: c.carsCount })), t('pages.customers.title'), t('pages.customers.subtitle'));
              toast.success(t('toast.success.exportSuccess'));
            }}>
              {t('common.export')}
            </Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />}>
            {t('pages.customers.addCustomer')}
          </Button>
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
        onRowClick={(c) => navigate(`/customers/${c.id}`)}
        keyExtractor={(c) => c.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        filters={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {t('common.filter')}
            </button>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field text-xs py-1.5 w-auto"
            >
              <option value="">{t('common.allStatuses')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>
        }
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.customers.deleteTitle')}
        message={t('pages.customers.deleteMessage')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function BadgeNum({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
      {value}
    </span>
  );
}
