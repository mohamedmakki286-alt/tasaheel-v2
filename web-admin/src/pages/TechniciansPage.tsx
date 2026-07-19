import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getTechnicians, toggleTechnicianStatus, deleteTechnician } from '../api/technicians.api';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatPhone } from '../utils/formatters';
import { exportDataToPDF } from '../utils/exportPdf';
import type { Technician } from '../types';

export default function TechniciansPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [workshopFilter, setWorkshopFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['technicians', page, search, sortKey, sortOrder, workshopFilter],
    queryFn: () => getTechnicians({ page, search, sortBy: sortKey, sortOrder, workshopId: workshopFilter || undefined }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => toggleTechnicianStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success(t('toast.success.technicianStatusChanged'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.technicianStatusFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTechnician,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success(t('toast.success.technicianDeleted'));
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.technicianDeleteFailed')),
  });

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const columns: Column<Technician>[] = [
    { key: 'id', label: '#', sortable: true, width: '60px' },
    {
      key: 'name', label: t('pages.technicians.table.name'), sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-400">{item.email || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: t('pages.technicians.table.phone'), render: (item) => <span className="text-sm font-mono" dir="ltr">{formatPhone(item.phone)}</span> },
    { key: 'specialty', label: t('pages.technicians.table.specialty') },
    {
      key: 'workshopName', label: t('pages.technicians.table.workshop'), sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-600/10">
          {item.workshopName}
        </span>
      ),
    },
    { key: 'isOnline', label: t('pages.technicians.table.connectionStatus'), render: (item) => <StatusBadge status={item.isOnline ? 'online' : 'offline'} /> },
    { key: 'isActive', label: t('pages.technicians.table.status'), render: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: t('pages.technicians.table.actions'),
      render: (item) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" icon={item.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} onClick={() => toggleMutation.mutate({ id: item.id, isActive: !item.isActive })} />
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleteId(item.id)} />
        </div>
      ),
    },
  ];

  if (isLoading) return <CardSkeleton count={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.technicians.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.technicians.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
            const items = data?.data || [];
            if (!items.length) { toast.error(t('toast.error.noExportData')); return; }
            exportDataToPDF(items.map((tech: Technician) => ({ '#': tech.id, [t('pages.technicians.table.name')]: tech.name, [t('pages.technicians.table.phone')]: tech.phone, [t('pages.technicians.table.specialty')]: tech.specialty, [t('pages.technicians.table.workshop')]: tech.workshopName, [t('common.date')]: formatDate(tech.createdAt) })), t('pages.technicians.title'), t('pages.technicians.title'));
            toast.success(t('toast.success.exportSuccess'));
          }}>{t('common.export')}</Button>
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
        keyExtractor={(item) => item.id}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        filters={
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t('pages.technicians.workshopIdPlaceholder')}
              value={workshopFilter}
              onChange={(e) => { setWorkshopFilter(e.target.value); setPage(1); }}
              className="select-field text-xs py-1.5 w-24"
            />
          </div>
        }
      />

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('pages.technicians.deleteTitle')}
        message={t('pages.technicians.deleteMessage')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
