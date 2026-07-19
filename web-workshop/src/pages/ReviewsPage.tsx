import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star, User, RefreshCw, Filter, ThumbsUp, MessageCircle } from 'lucide-react';
import { getMyReviews } from '../api/reviews.api';
import { useAuthStore } from '../stores/authStore';
import { formatDate, timeAgo } from '../utils/formatters';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import type { ReviewRating } from '../types';

function StarRating({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'}
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const workshop = useAuthStore((s) => s.workshop);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const { data: reviews = [], isFetching } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => getMyReviews(workshop?.id),
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { ratingDistribution[r.rating - 1]++; });

  const filteredReviews = ratingFilter
    ? reviews.filter((r) => r.rating === ratingFilter)
    : reviews;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">{t('pages.reviews.title')}</h1>
          <p className="text-surface-500 text-sm mt-1">{t('pages.reviews.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400 bg-surface-100 px-3 py-1.5 rounded-xl">
          <RefreshCw size={14} className="animate-spin-slow" />
          <span>{t('pages.reviews.autoRefresh')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 text-center sticky top-24">
            <p className="text-6xl font-bold text-surface-900 dark:text-surface-100 mb-2">{averageRating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-1 mb-2">
              <StarRating rating={Math.round(averageRating)} size={24} />
            </div>
            <p className="text-sm text-surface-400">{reviews.length} {t('pages.reviews.rating')}</p>

            <div className="mt-6 space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingDistribution[star - 1];
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                    className={`flex items-center gap-2 text-sm w-full p-2 rounded-xl transition-all duration-200 ${
                      ratingFilter === star ? 'bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                  >
                    <span className="text-surface-500 w-3 text-left font-medium">{star}</span>
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                      />
                    </div>
                    <span className="text-surface-400 w-5 text-left text-xs font-medium">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isFetching && reviews.length === 0 && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton variant="circular" width={44} height={44} />
                    <div className="flex-1">
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="20%" />
                    </div>
                  </div>
                  <Skeleton variant="text" count={2} />
                </div>
              ))}
            </div>
          )}

          {!isFetching && filteredReviews.length === 0 && (
            <EmptyState
              icon={Star}
              title={ratingFilter ? t('pages.reviews.emptyFiltered', { rating: ratingFilter }) : t('pages.reviews.empty')}
              description={t('pages.reviews.emptyDesc')}
            />
          )}

          {filteredReviews.map((review, idx) => (
            <div
              key={review.id}
              className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 hover:shadow-md transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={review.customer?.name} size="lg" />
                  <div>
                    <p className="font-semibold text-surface-800 dark:text-surface-200">{review.customer?.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-xs text-surface-400">{timeAgo(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-full">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              {review.comment && (
                <div className="mr-12 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                  <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">{review.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
