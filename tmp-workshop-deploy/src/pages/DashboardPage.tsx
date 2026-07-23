import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Star,
  ArrowLeft,
  Wrench,
  User,
  Calendar,
  TrendingUp,
  MapPin,
  Phone,
  Car,
  MessageCircle,
  AlertCircle,
  Sparkles,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { getNewRequests } from '../api/requests.api';
import { getMyQuotes } from '../api/quotes.api';
import { getMyReviews } from '../api/reviews.api';
import { getFinancialStats } from '../api/finance.api';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, timeAgo, formatDate } from '../utils/formatters';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function AnimatedValue({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [display, setDisplay] = useState('0');
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    if (typeof value === 'string' && isNaN(parseFloat(value))) { setDisplay(value); return; }
    let current = 0;
    const step = Math.max(1, Math.floor(num / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= num) { setDisplay(String(num)); clearInterval(timer); }
      else setDisplay(String(current));
    }, 25);
    return () => clearInterval(timer);
  }, [num, value]);

  return <>{display}{suffix}</>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const workshop = useAuthStore((s) => s.workshop);
  const { t } = useTranslation();
  const h = new Date().getHours();
  const greeting = h < 12 ? t('pages.dashboard.greetingMorning') : h < 18 ? t('pages.dashboard.greetingAfternoon') : t('pages.dashboard.greetingEvening');

  const { data: newRequests = [], isLoading: loadingNew } = useQuery({
    queryKey: ['new-requests'],
    queryFn: getNewRequests,
  });

  const { data: myQuotes = [], isLoading: loadingQuotes } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: getMyQuotes,
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['my-reviews', workshop?.id],
    queryFn: () => getMyReviews(workshop?.id),
    enabled: !!workshop?.id,
  });

  const { data: financialStats } = useQuery({
    queryKey: ['financial-stats'],
    queryFn: getFinancialStats,
  });

  const activeRequests = myQuotes.filter((q) => q.status === 'accepted').length;
  const completedCount = workshop?.completedJobs || 0;
  const avgRating = workshop?.rating || 0;
  const reviewsCount = reviews.length;

  const recentRequests = [...newRequests, ...myQuotes.filter((q: { status: string }) => q.status === 'accepted' || q.status === 'pending')]
    .slice(0, 5);

  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { ratingDistribution[r.rating - 1]++; });

  const stats = [
    {
      label: t('pages.dashboard.stats.newRequests'),
      value: newRequests.length,
      icon: ClipboardList,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500',
      onClick: () => navigate('/requests'),
    },
    {
      label: t('pages.dashboard.stats.activeRequests'),
      value: activeRequests,
      icon: Clock,
      gradient: 'from-accent-500 to-accent-600',
      iconBg: 'bg-accent-500',
      onClick: () => navigate('/requests'),
    },
    {
      label: t('pages.dashboard.stats.completedThisMonth'),
      value: completedCount,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500',
    },
    {
      label: t('pages.dashboard.stats.averageRating'),
      value: avgRating.toFixed(1),
      icon: Star,
      gradient: 'from-yellow-400 to-yellow-500',
      iconBg: 'bg-yellow-500',
      suffix: ` (${reviewsCount})`,
    },
  ];

  if (workshop && workshop.isApproved === false) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-6 animate-pulse-slow">
          <Clock size={48} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">{t('pages.dashboard.pendingApproval')}</h2>
        <p className="text-surface-500 text-center max-w-md mb-6">
          {t('pages.dashboard.pendingApprovalDesc')}
        </p>
        {workshop.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 max-w-md w-full mb-6">
            <p className="text-sm font-semibold text-red-700 mb-1">{t('pages.dashboard.rejectionReason')}</p>
            <p className="text-sm text-red-600">{workshop.rejectionReason}</p>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 max-w-md w-full space-y-4">
          <h3 className="font-bold text-surface-800">{t('pages.dashboard.documents')}</h3>
          {workshop.commercialRegistration && (
            <div>
              <p className="text-xs text-surface-400 mb-1">{t('pages.dashboard.commercialRecord')}</p>
              <img src={workshop.commercialRegistration} alt={t('pages.dashboard.commercialRecord')} className="w-full h-24 object-cover rounded-xl border border-surface-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          {workshop.municipalityLicense && (
            <div>
              <p className="text-xs text-surface-400 mb-1">{t('pages.dashboard.municipalityLicense')}</p>
              <img src={workshop.municipalityLicense} alt={t('pages.dashboard.municipalityLicense')} className="w-full h-24 object-cover rounded-xl border border-surface-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .anim-up { animation: fade-up 0.5s ease-out both; }
        .anim-in { animation: fade-in 0.4s ease-out both; }
        .anim-scale { animation: scale-in 0.4s ease-out both; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.1s; } .d3 { animation-delay: 0.15s; } .d4 { animation-delay: 0.2s; }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .request-item {
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .request-item:hover {
          background: #f8fafc;
          transform: translateX(-4px);
        }
      `}</style>

      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500/5 via-primary-600/5 to-primary-700/5 border border-primary-200/50 dark:border-primary-800/30 p-6 lg:p-8">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="anim-up">
            <p className="text-primary-600 dark:text-primary-400 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">
              {workshop?.name || t('pages.dashboard.welcome')}
            </h1>
            <p className="text-surface-500 text-sm mt-1">{t('pages.dashboard.welcomeSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3 anim-up d1">
            <div className="flex items-center gap-2 text-sm text-surface-400 bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span>{t('pages.dashboard.activeStatus')}</span>
            </div>
            <button onClick={() => navigate('/requests')} className="btn-primary flex items-center gap-2">
              <ArrowLeft size={18} />
              {t('pages.dashboard.viewRequests')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className="stat-card bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 cursor-pointer anim-scale"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-500 font-medium mb-1">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                    <AnimatedValue value={stat.value} />
                  </p>
                  {stat.suffix && <span className="text-xs text-surface-400">{stat.suffix}</span>}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${stat.iconBg}`}
                style={{ background: `linear-gradient(135deg, ${stat.gradient.replace('from-', '').split(' to')[0]}, ${stat.gradient.split('to-')[1]})` }}>
                <stat.icon size={22} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial Stats */}
      {financialStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/invoices')}
            className="stat-card bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 cursor-pointer anim-scale d1"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium mb-1">{t('pages.dashboard.stats.totalRevenue')}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  <AnimatedValue value={financialStats.totalRevenue} suffix={` ${t('common.sar')}`} />
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <DollarSign size={22} className="text-white" />
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate('/invoices')}
            className="stat-card bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 cursor-pointer anim-scale d2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium mb-1">{t('pages.dashboard.stats.totalInvoices')}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  <AnimatedValue value={financialStats.totalInvoices} />
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                <Receipt size={22} className="text-white" />
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate('/invoices')}
            className="stat-card bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 cursor-pointer anim-scale d3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium mb-1">{t('pages.dashboard.stats.paidInvoices')}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  <AnimatedValue value={financialStats.paidCount} />
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                <CheckCircle2 size={22} className="text-white" />
              </div>
            </div>
          </div>
          <div
            onClick={() => navigate('/invoices')}
            className="stat-card bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 cursor-pointer anim-scale d4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 font-medium mb-1">{t('pages.dashboard.stats.pendingAmount')}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                  <AnimatedValue value={financialStats.pendingAmount} suffix={` ${t('common.sar')}`} />
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <Clock size={22} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Requests */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden anim-scale d2">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-primary-500" />
                <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.dashboard.recentRequests')}</h2>
              </div>
              {recentRequests.length > 0 && (
                <button onClick={() => navigate('/requests')} className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                  {t('pages.dashboard.viewAll')}
                </button>
              )}
            </div>
            <div className="p-5">
              {loadingNew && loadingQuotes ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" height={80} />)}
                </div>
              ) : recentRequests.length === 0 ? (
                <EmptyState icon={ClipboardList} title={t('pages.dashboard.noRequests')} description={t('pages.dashboard.noRequestsDesc')} />
              ) : (
                <div className="space-y-2">
                  {(recentRequests as any[]).map((req: any, idx: number) => (
                    <div
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className="request-item flex items-center gap-3 p-3 rounded-xl cursor-pointer anim-up"
                      style={{ animationDelay: `${idx * 0.06}s` }}
                    >
                      <Avatar name={req.customerName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{req.customerName || t('pages.dashboard.customer')}</p>
                        <p className="text-xs text-surface-400 truncate">
                          {req.serviceTypeName || t('pages.dashboard.submitQuote')} • {req.carMake ? `${req.carMake} ${req.carModel || ''}` : '-'}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-surface-400">{timeAgo(req.createdAt)}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {req.status === 'pending' ? t('common.new') : req.status === 'accepted' ? t('constants.requestStatuses.accepted') : t('constants.quoteStatuses.pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workshop Info */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden anim-scale d3">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-primary-500" />
                <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.dashboard.workshopInfo')}</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Wrench, label: t('pages.dashboard.name'), value: workshop?.name, color: 'text-primary-600' },
                  { icon: Phone, label: t('pages.dashboard.phone'), value: workshop?.phone, color: 'text-primary-600' },
                  { icon: MapPin, label: t('pages.dashboard.city'), value: workshop?.city, color: 'text-primary-600' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 anim-up" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center">
                      <item.icon size={16} className={item.color + ' dark:text-primary-400'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-surface-400">{item.label}</p>
                      <p className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/profile')} className="btn-secondary w-full mt-4">
                {t('pages.dashboard.editProfile')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Reviews */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden anim-scale d2">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-yellow-500" />
                <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.dashboard.reviews')}</h2>
              </div>
            </div>
            <div className="p-5">
              {loadingReviews ? (
                <Skeleton variant="card" height={200} />
              ) : reviews.length === 0 ? (
                <EmptyState icon={Star} title={t('pages.dashboard.noReviews')} description={t('pages.dashboard.noReviewsDesc')} />
              ) : (
                <div className="text-center mb-4">
                  <p className="text-5xl font-bold text-surface-900 dark:text-surface-100">
                    <AnimatedValue value={avgRating} />
                  </p>
                  <div className="flex items-center justify-center gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={18} className={star <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'} strokeWidth={0} />
                    ))}
                  </div>
                  <p className="text-xs text-surface-400 mt-1">{reviewsCount} {t('pages.dashboard.rating')}</p>
                </div>
              )}
              <div className="space-y-2 mt-4">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star - 1];
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="text-surface-500 w-3 text-left font-medium">{star}</span>
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                      </div>
                      <span className="text-surface-400 w-5 text-left text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden anim-scale d3">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary-500" />
                <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.dashboard.quickActions')}</h2>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <button onClick={() => navigate('/requests')} className="btn-primary w-full justify-start">
                <ClipboardList size={18} />
                {t('pages.dashboard.viewNewRequests')}
                {newRequests.length > 0 && <span className="mr-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">{newRequests.length}</span>}
              </button>
              <button onClick={() => navigate('/profile')} className="btn-secondary w-full justify-start">
                <User size={18} />
                {t('pages.dashboard.editProfile')}
              </button>
              <button onClick={() => navigate('/quotes')} className="btn-secondary w-full justify-start">
                <TrendingUp size={18} />
                {t('pages.dashboard.myQuotes')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
