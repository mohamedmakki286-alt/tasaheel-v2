import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, DollarSign, TrendingUp, CreditCard, Banknote, Smartphone, Wallet, Download, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getPayments, refundPayment } from '../api/payments.api';
import { getStats } from '../api/stats.api';
import DataTable, { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/Button';
import { CardSkeleton, TableSkeleton } from '../components/Skeleton';
import { formatDate, formatCurrency } from '../utils/formatters';
import { exportDataToPDF } from '../utils/exportPdf';
import type { Payment } from '../types';

const methodIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  wallet: <Wallet className="w-4 h-4" />,
  bank_transfer: <Smartphone className="w-4 h-4" />,
  moyasar: <CreditCard className="w-4 h-4" />,
};

const methodBg: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-600',
  card: 'bg-blue-50 text-blue-600',
  wallet: 'bg-purple-50 text-purple-600',
  bank_transfer: 'bg-cyan-50 text-cyan-600',
  moyasar: 'bg-blue-50 text-blue-600',
};

export default function PaymentsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refundId, setRefundId] = useState<number | null>(null);

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', page, search, statusFilter],
    queryFn: () => getPayments({ page, search, status: statusFilter || undefined }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const refundMutation = useMutation({
    mutationFn: refundPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success(t('toast.success.paymentRefunded'));
      setRefundId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || err?.message || t('toast.error.paymentRefundFailed')),
  });

  const sar = t('pages.payments.summary.sar');
  const summaryCards = [
    { label: t('pages.payments.summary.totalRevenue'), value: stats?.totalRevenue ?? 0, color: 'from-emerald-500 to-green-500', icon: DollarSign, suffix: sar },
    { label: t('pages.payments.summary.pending'), value: stats?.pendingPaymentsTotal ?? 0, color: 'from-amber-500 to-orange-500', icon: TrendingUp, suffix: sar },
    { label: t('pages.payments.summary.completed'), value: stats?.completedPaymentsTotal ?? 0, color: 'from-blue-500 to-indigo-500', icon: CreditCard, suffix: sar },
    { label: t('pages.payments.summary.refunded'), value: stats?.refundedPaymentsTotal ?? 0, color: 'from-red-500 to-rose-500', icon: ArrowLeftRight, suffix: sar },
  ];

  const columns: Column<Payment>[] = [
    { key: 'id', label: '#', width: '60px' },
    { key: 'requestId', label: t('pages.payments.table.requestId') },
    { key: 'customerName', label: t('pages.payments.table.customer'), render: (p) => <span className="font-medium text-gray-900">{p.customerName}</span> },
    { key: 'amount', label: t('pages.payments.table.amount'), render: (p) => <span className="font-bold text-gray-900">{formatCurrency(p.amount)}</span> },
    {
      key: 'method', label: t('pages.payments.table.method'),
      render: (p) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${methodBg[p.method] || 'bg-gray-100 text-gray-600'}`}>
          {methodIcons[p.method]}
          <StatusBadge status={p.method} dot={false} />
        </span>
      ),
    },
    { key: 'status', label: t('pages.payments.table.status'), render: (p) => <StatusBadge status={p.status} /> },
    { key: 'createdAt', label: t('pages.payments.table.date'), render: (p) => <span className="text-sm text-gray-500">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions', label: t('pages.payments.table.actions'),
      render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {p.status === 'completed' && (
            <Button variant="ghost" size="sm" icon={<ArrowLeftRight className="w-4 h-4 text-orange-500" />} onClick={() => setRefundId(p.id)} />
          )}
        </div>
      ),
    },
  ];

  const isLoading = paymentsLoading || statsLoading;
  if (isLoading) return <CardSkeleton count={4} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.payments.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('pages.payments.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => {
            const items = payments?.data || [];
            if (!items.length) { toast.error(t('toast.error.noExportData')); return; }
            exportDataToPDF(items.map((p: Payment) => ({ '#': p.id, [t('pages.payments.table.customer')]: p.customerName, [t('pages.payments.table.amount')]: p.amount, [t('pages.payments.table.status')]: p.status, [t('pages.payments.table.date')]: formatDate(p.createdAt) })), t('pages.payments.title'), t('pages.payments.title'));
            toast.success(t('toast.success.exportSuccess'));
          }}>{t('pages.payments.exportReport')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {summaryCards.map((card) => (
          <div key={card.label} className="card relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gray-50 to-transparent" />
            <div className="relative z-10">
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg mb-3`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(card.value)}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={payments?.data || []}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        pagination={payments?.meta ? {
          currentPage: payments.meta.currentPage,
          lastPage: payments.meta.lastPage,
          total: payments.meta.total,
          onPageChange: setPage,
        } : undefined}
        keyExtractor={(p) => p.id}
        filters={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="select-field text-xs py-1.5 w-auto"
            >
              <option value="">{t('pages.payments.filterStatuses.all')}</option>
              <option value="completed">{t('pages.payments.filterStatuses.paid')}</option>
              <option value="pending">{t('pages.payments.filterStatuses.pending')}</option>
              <option value="failed">{t('pages.payments.filterStatuses.failed')}</option>
              <option value="refunded">{t('pages.payments.filterStatuses.refunded')}</option>
            </select>
          </div>
        }
      />

      <ConfirmDialog
        isOpen={refundId !== null}
        onClose={() => setRefundId(null)}
        onConfirm={() => refundId && refundMutation.mutate(refundId)}
        title={t('pages.payments.refundTitle')}
        message={t('pages.payments.refundMessage')}
        confirmText={t('pages.payments.refund')}
        variant="warning"
        isLoading={refundMutation.isPending}
      />
    </div>
  );
}
