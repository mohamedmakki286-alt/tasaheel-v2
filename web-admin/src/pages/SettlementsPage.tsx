import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, CheckCircle, XCircle, Building2, ExternalLink,
  Percent, FileText, Search, AlertCircle, ChevronLeft, Plus
} from 'lucide-react';
import {
  getPendingSettlements, getPendingInvoicesForWorkshop,
  createSettlement, completeSettlement, cancelSettlement,
  getSettlements
} from '../api/financial.api';
import { formatCurrency } from '../utils/formatters';
import Modal from '../components/Modal';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { CardSkeleton } from '../components/Skeleton';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function SettlementsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [page, setPage] = useState(1);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any>(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [invoiceCommissions, setInvoiceCommissions] = useState<Record<number, number>>({});
  const [settlementNote, setSettlementNote] = useState('');
  const [completeId, setCompleteId] = useState<number | null>(null);

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-settlements'],
    queryFn: getPendingSettlements,
    enabled: activeTab === 'pending',
  });

  const { data: settlementsData, isLoading: loadingHistory } = useQuery({
    queryKey: ['settlements', page],
    queryFn: () => getSettlements({ page, size: 20 }),
    enabled: activeTab === 'history',
  });

  const { data: workshopInvoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['workshop-pending-invoices', selectedWorkshop?.workshopId],
    queryFn: () => getPendingInvoicesForWorkshop(selectedWorkshop.workshopId),
    enabled: !!selectedWorkshop && showSettleModal,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => createSettlement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast.success(t('toast.success.settlementCreated'));
      setShowSettleModal(false);
      setSelectedWorkshop(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.settlementCreateFailed')),
  });

  const completeMutation = useMutation({
    mutationFn: completeSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['pending-settlements'] });
      toast.success(t('toast.success.settlementConfirmed'));
      setCompleteId(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.settlementConfirmFailed')),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      toast.success(t('toast.success.settlementCancelled'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.settlementCancelFailed')),
  });

  const pendingWorkshops = pendingData?.[0]?.workshops || [];
  const pendingSummary = pendingData?.[0]?.summary || {};

  const handleOpenSettle = (workshop: any) => {
    setSelectedWorkshop(workshop);
    setInvoiceCommissions({});
    setSettlementNote('');
    setShowSettleModal(true);
  };

  const handleCommissionChange = (invoiceId: number, value: string) => {
    const pct = parseFloat(value) || 0;
    setInvoiceCommissions((prev) => ({ ...prev, [invoiceId]: pct }));
  };

  const applyDefaultToAll = () => {
    if (!workshopInvoices) return;
    const defaultPct = 10;
    const commissions: Record<number, number> = {};
    workshopInvoices.forEach((inv) => {
      commissions[inv.id] = defaultPct;
    });
    setInvoiceCommissions(commissions);
    toast.success(t('toast.success.commissionAppliedAll', { pct: defaultPct }));
  };

  const handleCreateSettlement = () => {
    if (!selectedWorkshop) return;
    const formattedCommissions: Record<string, number> = {};
    Object.entries(invoiceCommissions).forEach(([k, v]) => {
      formattedCommissions[k] = v;
    });
    createMutation.mutate({
      workshopId: selectedWorkshop.workshopId,
      invoiceCommissions: formattedCommissions,
      notes: settlementNote || undefined,
    });
  };

  const totalCommission = workshopInvoices?.reduce((sum, inv) => {
    const pct = invoiceCommissions[inv.id] ?? 10;
    return sum + (inv.grandTotal * pct / 100);
  }, 0) || 0;

  const totalGross = workshopInvoices?.reduce((sum, inv) => sum + inv.grandTotal, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.settlements.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('pages.settlements.subtitle')}</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {t('pages.settlements.tabs.pending')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {t('pages.settlements.tabs.history')}
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {pendingSummary.totalPending != null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-sm text-gray-500">{t('pages.settlements.summary.totalPending')}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(pendingSummary.totalPending)}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">{t('pages.settlements.summary.pendingWorkshops')}</p>
                <p className="text-xl font-bold text-gray-900">{pendingSummary.totalWorkshops || 0}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-gray-500">{t('pages.settlements.summary.averageCommission')}</p>
                <p className="text-xl font-bold text-amber-600">10%</p>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            {loadingPending ? (
              <CardSkeleton count={3} />
            ) : pendingWorkshops.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                <p>{t('pages.settlements.allSettled')}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.table.workshop')}</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.table.invoiceCount')}</th>
                    <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.table.total')}</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingWorkshops.map((w: any) => (
                    <tr key={w.workshopId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{w.workshopName}</td>
                      <td className="py-3 px-4 text-gray-600">{w.invoiceCount}</td>
                      <td className="py-3 px-4 text-gray-900 font-bold">{formatCurrency(w.totalGross)}</td>
                      <td className="py-3 px-4 text-left">
                        <Button size="sm" icon={<Wallet className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenSettle(w)}>
                          {t('pages.settlements.settle')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="card overflow-hidden">
          {loadingHistory ? (
            <CardSkeleton count={5} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.id')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.workshop')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.invoices')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.total')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.commission')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.net')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('pages.settlements.historyTable.status')}</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(settlementsData?.data || []).map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{s.settlementNumber}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{s.workshopName}</td>
                    <td className="py-3 px-4 text-gray-600">{s.invoiceCount}</td>
                    <td className="py-3 px-4 text-gray-900">{formatCurrency(s.totalGrossAmount)}</td>
                    <td className="py-3 px-4 text-amber-600">{formatCurrency(s.totalCommission)}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(s.totalNetAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        s.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {s.status === 'SETTLED' ? t('pages.settlements.status.settled') : s.status === 'PENDING' ? t('pages.settlements.status.pending') : t('pages.settlements.status.cancelled')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex gap-1">
                        {s.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setCompleteId(s.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title={t('pages.settlements.confirmSettlement')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => cancelMutation.mutate(s.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              title={t('pages.settlements.cancel')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(settlementsData?.data || []).length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">{t('pages.settlements.historyTable.noData')}</td></tr>
                )}
              </tbody>
            </table>
          )}

          {settlementsData?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {t('pages.settlements.historyTable.pageInfo', { current: settlementsData.meta.currentPage, last: Math.max(1, settlementsData.meta.lastPage) })}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  {t('pages.settlements.previous')}
                </Button>
                <Button size="sm" variant="secondary"
                  disabled={page >= settlementsData.meta.lastPage}
                  onClick={() => setPage((p) => p + 1)}>
                  {t('pages.settlements.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        title={t('pages.settlements.settleModal.title', { workshopName: selectedWorkshop?.workshopName || '' })}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSettleModal(false)}>{t('pages.settlements.cancel')}</Button>
            <Button
              onClick={handleCreateSettlement}
              isLoading={createMutation.isPending}
              icon={<CheckCircle className="w-4 h-4" />}
            >
              {t('pages.settlements.confirmSettlement')}
            </Button>
          </>
        }
      >
        {loadingInvoices ? (
          <CardSkeleton count={3} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t('pages.settlements.settleModal.selectCommission')}</p>
              <Button size="sm" variant="outline" onClick={applyDefaultToAll}>
                <Percent className="w-3.5 h-3.5 ml-1" />
                {t('pages.settlements.settleModal.applyDefault', { pct: 10 })}
              </Button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right py-2 px-3 text-gray-500">{t('pages.settlements.settleModal.invoiceNumber')}</th>
                  <th className="text-right py-2 px-3 text-gray-500">{t('pages.settlements.settleModal.total')}</th>
                  <th className="text-right py-2 px-3 text-gray-500">{t('pages.settlements.settleModal.commissionPercent')}</th>
                  <th className="text-right py-2 px-3 text-gray-500">{t('pages.settlements.settleModal.commissionValue')}</th>
                  <th className="text-right py-2 px-3 text-gray-500">{t('pages.settlements.settleModal.net')}</th>
                </tr>
              </thead>
              <tbody>
                {(workshopInvoices || []).map((inv) => {
                  const pct = invoiceCommissions[inv.id] ?? 10;
                  const commissionAmt = inv.grandTotal * pct / 100;
                  const net = inv.grandTotal - commissionAmt;
                  return (
                    <tr key={inv.id} className="border-b border-gray-50">
                      <td className="py-2 px-3 font-mono text-xs text-gray-600">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-gray-900 font-medium">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={pct}
                          onChange={(e) => handleCommissionChange(inv.id, e.target.value)}
                          className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                      </td>
                      <td className="py-2 px-3 text-amber-600 font-medium">{formatCurrency(commissionAmt)}</td>
                      <td className="py-2 px-3 text-emerald-600 font-bold">{formatCurrency(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td className="py-3 px-3 text-gray-900">{t('pages.settlements.settleModal.totalLabel')}</td>
                  <td className="py-3 px-3 text-gray-900">{formatCurrency(totalGross)}</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-amber-600">{formatCurrency(totalCommission)}</td>
                  <td className="py-3 px-3 text-emerald-600">{formatCurrency(totalGross - totalCommission)}</td>
                </tr>
              </tfoot>
            </table>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{t('pages.settlements.settleModal.notes')}</label>
              <textarea
                value={settlementNote}
                onChange={(e) => setSettlementNote(e.target.value)}
                className="input-field"
                rows={2}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={completeId !== null}
        onClose={() => setCompleteId(null)}
        onConfirm={() => completeId && completeMutation.mutate(completeId)}
        title={t('pages.settlements.confirmDialog.title')}
        message={t('pages.settlements.confirmDialog.message')}
        isLoading={completeMutation.isPending}
      />
    </div>
  );
}
