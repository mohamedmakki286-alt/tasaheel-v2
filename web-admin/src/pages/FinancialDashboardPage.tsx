import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign, TrendingUp, TrendingDown, Building2, Clock,
  Wallet, ArrowUpRight, ArrowDownRight, Receipt, PiggyBank,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { getDashboard } from '../api/financial.api';
import { CardSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/formatters';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function FinancialDashboardPage() {
  const { t } = useTranslation();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) return <CardSkeleton count={6} />;

  const summary = dashboard?.summary;
  const monthlyRevenue = dashboard?.monthlyRevenue || [];
  const workshopPerformance = dashboard?.workshopPerformance || [];
  const recentTransactions = dashboard?.recentTransactions || [];

  const maxGross = Math.max(...monthlyRevenue.map((m) => m.gross), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المالية</h1>
          <p className="text-sm text-gray-500 mt-1">ملخص التحصيلات وعمولة المنصة ومستحقات الورش.</p>
        </div>
        <div className="flex flex-wrap gap-2"><Link to="/settlements" className="btn-primary text-sm px-4 py-2 rounded-xl">مستحقات وتحويلات الورش</Link><Link to="/payments" className="btn-secondary text-sm px-4 py-2 rounded-xl">سجل التحصيلات</Link></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title={t('pages.financial.summary.totalRevenue')}
          value={summary?.totalRevenue || 0}
          change={summary?.revenueChange}
          icon={<DollarSign className="w-5 h-5" />}
          color="from-emerald-500 to-green-600"
        />
        <SummaryCard
          title={t('pages.financial.summary.totalCommission')}
          value={summary?.totalCommission || 0}
          change={summary?.commissionChange}
          icon={<PiggyBank className="w-5 h-5" />}
          color="from-amber-500 to-orange-600"
        />
        <SummaryCard
          title={t('pages.financial.summary.netToWorkshops')}
          value={summary?.totalNetToWorkshops || 0}
          icon={<Building2 className="w-5 h-5" />}
          color="from-blue-500 to-indigo-600"
        />
        <SummaryCard
          title={t('pages.financial.summary.pendingSettlement')}
          value={summary?.totalPendingSettlement || 0}
          change={summary?.pendingChange}
          icon={<Clock className="w-5 h-5" />}
          color="from-rose-500 to-pink-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-bold text-gray-900 mb-4">{t('pages.financial.monthlyRevenue')}</h3>
          <div className="space-y-3">
            {monthlyRevenue.map((m) => {
              const pct = maxGross > 0 ? (m.gross / maxGross) * 100 : 0;
              return (
                <div key={m.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">
                      {new Date(m.month + '-01').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}
                    </span>
                    <span className="text-gray-900 font-bold">{formatCurrency(m.gross)}</span>
                  </div>
                  <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all rounded-r-full"
                      style={{ width: `${Math.max(pct * 0.7, 2)}%` }}
                      title={`${t('pages.financial.table.net')}: ${formatCurrency(m.net)}`}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${Math.max(pct * 0.15, 1)}%` }}
                      title={`${t('pages.financial.table.commission')}: ${formatCurrency(m.commission)}`}
                    />
                    <div
                      className="h-full bg-gray-300 transition-all rounded-l-full"
                      style={{ width: `${Math.max(pct * 0.15, 1)}%` }}
                      title={`${t('pages.financial.table.tax')}: ${formatCurrency(m.tax)}`}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {t('pages.financial.table.net')} {formatCurrency(m.net)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {t('pages.financial.table.commission')} {formatCurrency(m.commission)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> {t('pages.financial.table.tax')} {formatCurrency(m.tax)}
                    </span>
                  </div>
                </div>
              );
            })}
            {monthlyRevenue.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">{t('pages.financial.noRevenueData')}</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">{t('pages.financial.recentTransactions')}</h3>
          <div className="space-y-3">
            {recentTransactions.slice(0, 6).map((tx, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                  tx.type === 'SETTLEMENT' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                )}>
                  {tx.type === 'SETTLEMENT' ? <Wallet className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('ar-SA') : ''}</p>
                </div>
                <span className={clsx(
                  'text-sm font-bold',
                  tx.type === 'SETTLEMENT' ? 'text-blue-600' : 'text-emerald-600'
                )}>
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">{t('pages.financial.noRecentTransactions')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-gray-900 mb-4">{t('pages.financial.workshopPerformance')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.workshop')}</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.invoices')}</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.total')}</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.commission')}</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.rate')}</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.net')}</th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">{t('pages.financial.table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {workshopPerformance.map((w) => (
                <tr key={w.workshopId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-900">{w.workshopName}</td>
                  <td className="py-3 px-3 text-gray-600">{w.invoiceCount}</td>
                  <td className="py-3 px-3 text-gray-900 font-medium">{formatCurrency(w.totalGross)}</td>
                  <td className="py-3 px-3 text-amber-600 font-medium">{formatCurrency(w.totalCommission)}</td>
                  <td className="py-3 px-3 text-gray-600">{w.averageCommissionRate}%</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">{formatCurrency(w.totalNet)}</td>
                  <td className="py-3 px-3">
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      w.settlementStatus === 'settled'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    )}>
                      {w.settlementStatus === 'settled' ? t('pages.financial.table.settled') : t('pages.financial.table.notSettled')}
                    </span>
                  </td>
                </tr>
              ))}
              {workshopPerformance.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">{t('pages.financial.noPerformanceData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title, value, change, icon, color
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}) {
  const { t } = useTranslation();
  const isPositive = change != null && change >= 0;
  const isNegative = change != null && change < 0;

  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
          {change != null && (
            <div className={clsx(
              'flex items-center gap-1 text-xs font-medium',
              isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400'
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
              <span>{isPositive ? '+' : ''}{change}% {t('pages.financial.vsLastMonth')}</span>
            </div>
          )}
        </div>
        <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg shrink-0', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
