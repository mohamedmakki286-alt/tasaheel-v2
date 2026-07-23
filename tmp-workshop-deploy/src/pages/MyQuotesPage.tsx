import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileSignature, RefreshCw, DollarSign, TrendingUp, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { getMyQuotes } from '../api/quotes.api';
import { QUOTE_STATUS_COLORS } from '../utils/constants';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

type QuoteFilter = 'all' | 'pending' | 'accepted' | 'rejected';

export default function MyQuotesPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<QuoteFilter>('all');
  const navigate = useNavigate();

  const { data: quotes = [], isFetching } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: getMyQuotes,
    refetchInterval: 15000,
  });

  const accepted = quotes.filter((q) => q.status === 'accepted').length;
  const rejected = quotes.filter((q) => q.status === 'rejected').length;
  const pending = quotes.filter((q) => q.status === 'pending').length;

  const filteredQuotes = filter === 'all' ? quotes : quotes.filter((q) => q.status === filter);

  const filters: { key: QuoteFilter; label: string; icon: any; count: number }[] = [
    { key: 'all', label: t('pages.myQuotes.tabs.all'), icon: FileSignature, count: quotes.length },
    { key: 'pending', label: t('pages.myQuotes.tabs.pending'), icon: Clock, count: pending },
    { key: 'accepted', label: t('pages.myQuotes.tabs.accepted'), icon: CheckCircle2, count: accepted },
    { key: 'rejected', label: t('pages.myQuotes.tabs.rejected'), icon: XCircle, count: rejected },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-white">{t('pages.myQuotes.title')}</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">{t('pages.myQuotes.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-xl">
          <RefreshCw size={14} className="animate-spin-slow" />
          <span>{t('pages.myQuotes.autoRefresh')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card animate-slide-up animate-stagger-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">{t('pages.myQuotes.tabs.pending')}</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up animate-stagger-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">{t('pages.myQuotes.tabs.accepted')}</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{accepted}</p>
            </div>
          </div>
        </div>
        <div className="stat-card animate-slide-up animate-stagger-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-surface-400 dark:text-surface-500 font-medium">{t('pages.myQuotes.tabs.rejected')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejected}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              filter === f.key
                ? 'bg-accent-500 text-white shadow-lg'
                : 'bg-white dark:bg-surface-800 text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
            }`}
          >
            <f.icon size={16} />
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === f.key ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isFetching && filteredQuotes.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5">
                <Skeleton variant="text" count={3} />
              </div>
            ))}
          </div>
        )}

        {!isFetching && filteredQuotes.length === 0 && (
          <EmptyState
            icon={FileSignature}
            title={filter === 'all' ? t('pages.myQuotes.empty') : t('pages.myQuotes.emptyFiltered', { status: filters.find(f => f.key === filter)?.label || '' })}
            description={t('pages.myQuotes.emptyDesc')}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuotes.map((quote, idx) => (
            <div
              key={quote.id}
              className="card p-5 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => navigate(`/requests/${quote.requestId}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center">
                    <DollarSign size={18} className="text-accent-500" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-surface-900 dark:text-white">{formatCurrency(quote.price)}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${QUOTE_STATUS_COLORS[quote.status]}`}>
                  {t('constants.quoteStatuses.' + quote.status, quote.status)}
                </span>
              </div>
              {quote.notes && (
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-3 line-clamp-2">{quote.notes}</p>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-700">
                <span className="text-xs text-surface-400 dark:text-surface-500">{t('pages.myQuotes.requestNo')} {quote.requestId.slice(0, 8)}...</span>
                <span className="text-xs text-surface-400 dark:text-surface-500">{formatDateTime(quote.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
