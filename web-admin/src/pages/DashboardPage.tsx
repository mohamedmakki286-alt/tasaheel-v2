import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Wrench,
  Truck,
  ClipboardList,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { getStats } from '../api/stats.api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatCurrency, formatRelativeTime } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-sm">
        <p className="text-gray-500 mb-1">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  if (isLoading) return <CardSkeleton count={5} />;
  if (!stats) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-lg font-medium">{t('pages.dashboard.noData')}</p>
      <p className="text-sm mt-1">{t('pages.dashboard.noDataSubtitle')}</p>
    </div>
  );

  const recentActivity = (stats.recentRequests || []).slice(0, 5).map((req: any, idx: number) => ({
    id: req.id || idx,
    text: req.status === 'pending' ? t('pages.dashboard.requestFrom') + ' ' + req.customerName :
          req.status === 'completed' ? t('pages.dashboard.completedRequest') + ' ' + req.id :
          req.status === 'in_progress' ? t('pages.dashboard.inProgressRequest') + ' ' + req.customerName :
          t('pages.dashboard.request') + ' ' + req.customerName + ' - ' + (req.serviceType || req.serviceTypeName || ''),
    time: formatRelativeTime(req.createdAt),
    type: req.status === 'completed' ? 'completed' :
          req.status === 'in_progress' ? 'request' :
          req.status === 'cancelled' ? 'driver' : 'request',
  }));

  return (
    <div className="space-y-6">
      <div className="gradient-primary rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
              {t('pages.dashboard.welcome')}
            </h1>
            <p className="text-white/60">{t('pages.dashboard.welcomeSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<Clock className="w-4 h-4" />}
              onClick={() => navigate('/requests')}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              {t('pages.dashboard.viewRequests')}
            </Button>
            <Button
              size="sm"
              icon={<TrendingUp className="w-4 h-4" />}
              onClick={() => navigate('/reports')}
            >
              {t('pages.dashboard.reports')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-stagger">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label={t('pages.dashboard.statCards.totalCustomers')}
          value={stats.totalCustomers}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          icon={<Wrench className="w-6 h-6" />}
          label={t('pages.dashboard.statCards.totalWorkshops')}
          value={stats.totalWorkshops}
          color="accent"
          trend={{ value: 8, isUp: true }}
        />
        <StatCard
          icon={<Truck className="w-6 h-6" />}
          label={t('pages.dashboard.statCards.totalDrivers')}
          value={stats.totalDrivers}
          color="accent2"
          trend={{ value: 3, isUp: true }}
        />
        <StatCard
          icon={<ClipboardList className="w-6 h-6" />}
          label={t('pages.dashboard.statCards.totalRequests')}
          value={stats.totalRequests}
          color="blue"
          trend={{ value: 5, isUp: true }}
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label={t('pages.dashboard.statCards.revenueThisMonth')}
          value={stats.revenueThisMonth}
          color="green"
          formatValue={(v) => formatCurrency(v)}
          trend={{ value: 15, isUp: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('pages.dashboard.charts.dailyRequests')}</h3>
              <select className="select-field text-sm py-1.5 w-auto">
                <option>{t('pages.dashboard.charts.last7Days')}</option>
                <option>{t('pages.dashboard.charts.last30Days')}</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.requestsPerDay}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  dot={{ fill: '#f59e0b', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('pages.dashboard.charts.topWorkshops')}</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topWorkshops}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="requestsCount"
                  name={t('pages.dashboard.charts.requestCount')}
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="revenue"
                  name={t('pages.dashboard.charts.revenue')}
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('pages.dashboard.charts.requestStatus')}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.requestsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {(stats.requestsByStatus || []).map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {(stats.requestsByStatus || []).map((item, idx) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-gray-600">{item.status}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t('pages.dashboard.recentActivity')}</h3>
              <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">{t('pages.dashboard.viewAll')}</button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={activity.id} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    activity.type === 'request' ? 'bg-blue-50 text-blue-600' :
                    activity.type === 'workshop' ? 'bg-amber-50 text-amber-600' :
                    activity.type === 'payment' ? 'bg-emerald-50 text-emerald-600' :
                    activity.type === 'completed' ? 'bg-purple-50 text-purple-600' :
                    'bg-cyan-50 text-cyan-600'
                  }`}>
                    {activity.type === 'request' && <ClipboardList className="w-4 h-4" />}
                    {activity.type === 'workshop' && <Wrench className="w-4 h-4" />}
                    {activity.type === 'payment' && <DollarSign className="w-4 h-4" />}
                    {activity.type === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                    {activity.type === 'driver' && <Truck className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{t('pages.dashboard.latestRequests')}</h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/requests')}
          >
            {t('pages.dashboard.viewAll')}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('pages.dashboard.table.customer')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('pages.dashboard.table.service')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('pages.dashboard.table.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('pages.dashboard.table.date')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('pages.dashboard.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(stats.recentRequests || []).map((req, idx) => (
                <tr
                  key={req.id}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors duration-150 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                  onClick={() => navigate(`/requests/${req.id}`)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{req.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.customerName} size="sm" />
                      <span className="text-sm font-medium text-gray-700">{req.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{req.serviceType}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(req.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/requests/${req.id}`); }}>
                      {t('pages.dashboard.table.view')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

