import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  getFinancialDashboard, getFinancialInvoices,
  getFinancialSettlements,
  getFinancialSettlementReport, getFinancialIncomeStatement,
} from '../api/finance.api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportSettlementReportPdf, exportIncomeStatementPdf } from '../utils/exportPdf';
import {
  DollarSign, FileText, CheckCircle2, Clock,
  Percent, Wallet, Banknote, Download, Receipt,
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending_approval: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10',
  approved: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-500/10',
  paid: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10',
  rejected: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10',
  cancelled: 'text-surface-500 bg-surface-100 dark:text-surface-400 dark:bg-surface-800',
};

const FILTERS = ['all', 'pending_approval', 'approved', 'paid', 'rejected'] as const;

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const [settlementFrom, setSettlementFrom] = useState('');
  const [settlementTo, setSettlementTo] = useState('');
  const [incomeFrom, setIncomeFrom] = useState('');
  const [incomeTo, setIncomeTo] = useState('');
  const [generating, setGenerating] = useState<'settlement' | 'income' | null>(null);

  const { data: dashboard } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: getFinancialDashboard,
    refetchInterval: 30000,
  });

  const { data: invoicesPage } = useQuery({
    queryKey: ['financial-invoices', page, filter],
    queryFn: () => getFinancialInvoices(page, 20, filter === 'all' ? undefined : filter),
  });

  const { data: settlementsPage } = useQuery({
    queryKey: ['financial-settlements'],
    queryFn: () => getFinancialSettlements(0, 10),
  });

  const invoices = invoicesPage?.content || [];
  const totalElements = invoicesPage?.totalElements || 0;
  const totalPages = Math.ceil(totalElements / 20);
  const settlements = settlementsPage?.content || [];

  const handleSettlementReport = async () => {
    setGenerating('settlement');
    try {
      const reports = await getFinancialSettlementReport(settlementFrom || undefined, settlementTo || undefined);
      if (reports.length > 0) {
        exportSettlementReportPdf(reports[0], `settlement-report-${settlementFrom || 'all'}-${settlementTo || 'all'}`);
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleIncomeStatement = async () => {
    setGenerating('income');
    try {
      const lines = await getFinancialIncomeStatement(incomeFrom || undefined, incomeTo || undefined);
      const title = `كشف الدخل ${incomeFrom ? `من ${incomeFrom}` : ''} ${incomeTo ? `إلى ${incomeTo}` : ''}`;
      exportIncomeStatementPdf(lines, title, `income-statement-${incomeFrom || 'all'}-${incomeTo || 'all'}`);
    } finally {
      setGenerating(null);
    }
  };

  const summaryCards = dashboard
    ? [
        { label: t('invoicesPage.summary.totalRevenue'), value: formatCurrency(dashboard.totalRevenue), icon: DollarSign, color: 'text-emerald-500' },
        { label: t('invoicesPage.summary.totalPending'), value: formatCurrency(dashboard.totalPending), icon: Clock, color: 'text-amber-500' },
        { label: t('invoicesPage.summary.totalCommission'), value: formatCurrency(dashboard.totalCommission), icon: Percent, color: 'text-red-500' },
        { label: t('invoicesPage.summary.totalNet'), value: formatCurrency(dashboard.totalNet), icon: Wallet, color: 'text-blue-500' },
        { label: t('invoicesPage.summary.totalSettled'), value: formatCurrency(dashboard.totalSettled), icon: CheckCircle2, color: 'text-purple-500' },
        { label: t('invoicesPage.summary.pendingSettlement'), value: formatCurrency(dashboard.pendingSettlement), icon: Banknote, color: 'text-orange-500' },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">{t('invoicesPage.financial.title')}</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">{t('invoicesPage.financial.subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-4">
            <card.icon size={20} className={`${card.color} mb-2`} />
            <p className="text-lg font-bold text-surface-900 dark:text-surface-100 truncate">{card.value}</p>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1 truncate">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Reports Section */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
        <h3 className="font-bold text-surface-900 dark:text-surface-100 mb-4">{t('invoicesPage.reports.title')}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Settlement Report */}
          <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm mb-3">
              <Receipt size={18} />
              {t('invoicesPage.reports.settlementReport')}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input type="date" value={settlementFrom} onChange={(e) => setSettlementFrom(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" />
              <span className="text-surface-400 text-xs">{t('invoicesPage.reports.to')}</span>
              <input type="date" value={settlementTo} onChange={(e) => setSettlementTo(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" />
            </div>
            <button onClick={handleSettlementReport} disabled={generating === 'settlement'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors">
              <Download size={16} />
              {generating === 'settlement' ? t('common.loading') : t('invoicesPage.reports.exportPdf')}
            </button>
          </div>

          {/* Income Statement */}
          <div className="border border-surface-200 dark:border-surface-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm mb-3">
              <FileText size={18} />
              {t('invoicesPage.reports.incomeStatement')}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input type="date" value={incomeFrom} onChange={(e) => setIncomeFrom(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" />
              <span className="text-surface-400 text-xs">{t('invoicesPage.reports.to')}</span>
              <input type="date" value={incomeTo} onChange={(e) => setIncomeTo(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100" />
            </div>
            <button onClick={handleIncomeStatement} disabled={generating === 'income'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors">
              <Download size={16} />
              {generating === 'income' ? t('common.loading') : t('invoicesPage.reports.exportPdf')}
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-5 border-b border-surface-100 dark:border-surface-800">
          <h3 className="font-bold text-surface-900 dark:text-surface-100">{t('invoicesPage.invoices.title')}</h3>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
              }`}>
              {t('invoicesPage.filter.' + f)}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-800 text-surface-500 dark:text-surface-400 text-xs">
                <th className="text-right py-3 px-4 font-medium">{t('invoicesPage.invoices.table.invoiceNo')}</th>
                <th className="text-right py-3 px-4 font-medium">{t('invoicesPage.invoices.table.date')}</th>
                <th className="text-right py-3 px-4 font-medium">{t('invoicesPage.invoices.table.customer')}</th>
                <th className="text-right py-3 px-4 font-medium">{t('invoicesPage.invoices.table.amount')}</th>
                <th className="text-right py-3 px-4 font-medium">{t('invoicesPage.invoices.table.status')}</th>
                <th className="text-center py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-surface-400">{t('invoicesPage.invoices.noData')}</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-surface-50 dark:border-surface-800/50 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-surface-800 dark:text-surface-200 font-mono text-xs">
                      {inv.invoiceNumber || `#${inv.id}`}
                    </td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-400 text-xs">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-400 text-xs">
                      {inv.customerName || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-surface-900 dark:text-surface-100 text-sm">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[inv.status] || ''}`}>
                        {t('constants.invoiceStatuses.' + inv.status, inv.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link to={`/requests/${inv.requestId}`} className="text-primary-500 hover:text-primary-600 text-xs font-medium inline-flex items-center gap-1">
                        {t('invoicesPage.invoices.viewRequest')}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-surface-100 dark:border-surface-800">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-sm rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40">
              {t('common.prev')}
            </button>
            <span className="text-sm text-surface-500">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-surface-200 dark:border-surface-700 disabled:opacity-40">
              {t('common.next')}
            </button>
          </div>
        )}
      </div>

      {/* Recent Transactions & Settlements */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-100 mb-4">{t('invoicesPage.transactions.title')}</h3>
          {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-800/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'payment' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-purple-50 text-purple-500 dark:bg-purple-500/10'
                    }`}>
                      {tx.type === 'payment' ? <DollarSign size={14} /> : <Receipt size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{tx.description}</p>
                      <p className="text-xs text-surface-500">{tx.createdAt ? formatDate(tx.createdAt) : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'payment' ? 'text-emerald-600' : 'text-purple-600'}`}>
                      {formatCurrency(tx.amount)}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      tx.status === 'completed' || tx.status === 'settled' || tx.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : tx.status === 'pending'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {tx.status === 'settled' ? t('constants.settlementStatus.SETTLED') : tx.status === 'pending' ? t('constants.settlementStatus.PENDING') : tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-6">{t('invoicesPage.transactions.noData')}</p>
          )}
        </div>

        {/* Settlement History */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
          <h3 className="font-bold text-surface-900 dark:text-surface-100 mb-4">{t('invoicesPage.settlements.title')}</h3>
          {settlements.length > 0 ? (
            <div className="space-y-3">
              {settlements.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-800/50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 font-mono">{s.settlementNumber}</p>
                    <p className="text-xs text-surface-500">{s.invoiceCount} فواتير • {s.createdAt ? formatDate(s.createdAt) : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-surface-900 dark:text-surface-100">{formatCurrency(s.totalNetAmount)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      s.status === 'SETTLED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : s.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {t('constants.settlementStatus.' + s.status, s.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-6">{t('invoicesPage.settlements.noData')}</p>
          )}
        </div>
      </div>

      {/* Counts Mini Footer */}
      {dashboard && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
          <span>{t('invoicesPage.financial.totalInvoices')}: {dashboard.invoiceCount}</span>
          <span>{t('invoicesPage.financial.paid')}: {dashboard.paidCount}</span>
          <span>{t('invoicesPage.financial.pending')}: {dashboard.pendingCount}</span>
          <span>{t('invoicesPage.financial.rejected')}: {dashboard.rejectedCount}</span>
          <span>{t('invoicesPage.financial.settled')}: {dashboard.settledCount}</span>
        </div>
      )}
    </div>
  );
}
