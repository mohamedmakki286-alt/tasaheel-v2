import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Users,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getStats } from '../api/stats.api';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { exportToCSV } from '../utils/export';
import { exportDataToPDF } from '../utils/exportPdf';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-sm">
        <p className="text-gray-500 mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('ar-SA') : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!stats) return;
    const _statement = t('common.name');
    const _value = t('common.total');
    const _revenue = t('pages.reports.workshopTable.revenue');
    const _requests = t('pages.reports.charts.requestCount');
    const _date = t('common.date');
    const _workshop = t('pages.reports.workshopTable.workshop');
    if (format === 'csv') {
      const revenueData = (stats.monthlyRevenue || []).map((r: any) => ({ [_date]: r.month, [_revenue]: r.revenue }));
      const requestsData = (stats.requestsPerDay || []).map((r: any) => ({ [_date]: r.date, [_requests]: r.count }));
      const workshopsData = (stats.topWorkshops || []).map((w: any) => ({ [_workshop]: w.name, [_requests]: w.requestsCount, [_revenue]: w.revenue }));
      const summaryData = [
        { [_statement]: t('pages.reports.summary.totalRequests'), [_value]: stats.totalRequests },
        { [_statement]: t('pages.reports.summary.monthlyRevenue'), [_value]: stats.revenueThisMonth },
        { [_statement]: t('pages.reports.summary.activeWorkshops'), [_value]: stats.totalWorkshops },
        { [_statement]: t('pages.reports.summary.customers'), [_value]: stats.totalCustomers },
      ];
      exportToCSV(summaryData, t('pages.reports.title'));
      exportToCSV(revenueData, t('pages.reports.charts.monthlyRevenue'));
      exportToCSV(requestsData, t('pages.reports.charts.dailyRequests'));
      exportToCSV(workshopsData, t('pages.reports.charts.topWorkshops'));
      toast.success(t('toast.success.reportsExported'));
    } else {
      const summaryData = [
        { [_statement]: t('pages.reports.summary.totalRequests'), [_value]: stats.totalRequests },
        { [_statement]: t('pages.reports.summary.monthlyRevenue'), [_value]: stats.revenueThisMonth },
        { [_statement]: t('pages.reports.summary.activeWorkshops'), [_value]: stats.totalWorkshops },
        { [_statement]: t('pages.reports.summary.customers'), [_value]: stats.totalCustomers },
      ];
      const revenueData = (stats.monthlyRevenue || []).map((r: any) => ({ [_date]: r.month, [_revenue]: r.revenue }));
      const requestsData = (stats.requestsPerDay || []).map((r: any) => ({ [_date]: r.date, [_requests]: r.count }));
      const workshopsData = (stats.topWorkshops || []).map((w: any) => ({ [_workshop]: w.name, [_requests]: w.requestsCount, [_revenue]: w.revenue }));
      exportDataToPDF(summaryData, t('pages.reports.title'), t('pages.reports.title'));
      exportDataToPDF(revenueData, t('pages.reports.charts.monthlyRevenue'), t('pages.reports.charts.monthlyRevenue'));
      exportDataToPDF(requestsData, t('pages.reports.charts.dailyRequests'), t('pages.reports.charts.dailyRequests'));
      exportDataToPDF(workshopsData, t('pages.reports.charts.topWorkshops'), t('pages.reports.charts.topWorkshops'));
      toast.success(t('toast.success.reportsExported'));
    }
  };

  if (isLoading) return <CardSkeleton count={4} />;
  if (!stats) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg font-medium">{t('pages.reports.noData')}</p>
      <p className="text-sm mt-1">{t('pages.reports.noDataSubtitle')}</p>
    </div>
  );

  const summaryCards = [
    { label: t('pages.reports.summary.totalRequests'), value: stats.totalRequests, icon: ClipboardList, color: 'from-blue-500 to-indigo-500' },
    { label: t('pages.reports.summary.monthlyRevenue'), value: formatCurrency(stats.revenueThisMonth), icon: DollarSign, color: 'from-emerald-500 to-green-500' },
    { label: t('pages.reports.summary.activeWorkshops'), value: stats.totalWorkshops, icon: Wrench, color: 'from-amber-500 to-orange-500' },
    { label: t('pages.reports.summary.customers'), value: stats.totalCustomers, icon: Users, color: 'from-purple-500 to-violet-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">{t('pages.reports.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">{t('pages.reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="select-field text-sm py-2 w-auto dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100"
          >
            <option value="daily">{t('pages.reports.periods.daily')}</option>
            <option value="weekly">{t('pages.reports.periods.weekly')}</option>
            <option value="monthly">{t('pages.reports.periods.monthly')}</option>
          </select>
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => handleExport('csv')}>
            CSV
          </Button>
          <Button variant="secondary" size="sm" icon={<FileText className="w-4 h-4" />} onClick={() => handleExport('pdf')}>
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
        {summaryCards.map((card) => (
          <div key={card.label} className="card relative overflow-hidden group dark:bg-surface-900 dark:border-surface-800">
            <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-gray-500 dark:text-surface-400 font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-surface-100 mt-0.5">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card lg:col-span-2 dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-surface-100 mb-4">{t('pages.reports.charts.monthlyRevenue')}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={stats.monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name={t('pages.reports.charts.revenue')}
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-surface-100 mb-4">{t('pages.reports.charts.dailyRequests')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.requestsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                name={t('pages.reports.charts.requestCount')}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card dark:bg-surface-900 dark:border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-surface-100">{t('pages.reports.charts.topWorkshops')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.topWorkshops}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="requestsCount" name={t('pages.reports.charts.requestCount')} fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="revenue" name={t('pages.reports.charts.revenue')} fill="#f97316" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card dark:bg-surface-900 dark:border-surface-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-surface-100">{t('pages.reports.workshopTable.title')}</h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => stats?.topWorkshops && exportToCSV(
              stats.topWorkshops.map((w: any) => ({ [t('pages.reports.workshopTable.workshop')]: w.name, [t('pages.reports.workshopTable.requests')]: w.requestsCount, [t('pages.reports.workshopTable.revenue')]: w.revenue })),
              t('pages.reports.charts.topWorkshops')
            )}
          >
            {t('common.export')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-surface-800">
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-surface-400 uppercase">{t('pages.reports.workshopTable.id')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-surface-400 uppercase">{t('pages.reports.workshopTable.workshop')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-surface-400 uppercase">{t('pages.reports.workshopTable.requests')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-surface-400 uppercase">{t('pages.reports.workshopTable.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-surface-800">
              {(stats.topWorkshops || []).map((w: any, idx: number) => (
                <tr key={w.id} className="hover:bg-gray-50/80 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-surface-400">{idx + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-surface-100">{w.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-surface-300">{w.requestsCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(w.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}