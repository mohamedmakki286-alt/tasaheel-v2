import { useTranslation } from 'react-i18next';
import { Sparkles, Star, MapPin, CheckCircle2, CheckCircle, Trophy } from 'lucide-react';
import type { Workshop } from '../types';

interface Props {
  workshops: (Workshop & { distanceKm: number | null })[];
  selectedWorkshopId: number | null;
  onWorkshopSelect: (id: number) => void;
}

function scoreWorkshop(w: Workshop & { distanceKm: number | null }, maxDist: number, maxJobs: number, maxReviews: number): number {
  const ratingScore = (w.rating / 5) * 0.4;
  const distScore = maxDist > 0 && w.distanceKm !== null ? (1 - w.distanceKm / maxDist) * 0.3 : 0.15;
  const jobsScore = maxJobs > 0 && w.completedJobs ? (w.completedJobs / maxJobs) * 0.2 : 0;
  const reviewScore = maxReviews > 0 && w.reviewCount ? (w.reviewCount / maxReviews) * 0.1 : 0;
  return ratingScore + distScore + jobsScore + reviewScore;
}

export default function SmartWorkshopSuggestion({ workshops, selectedWorkshopId, onWorkshopSelect }: Props) {
  const { t } = useTranslation();
  if (workshops.length === 0) return null;

  const maxDist = Math.max(...workshops.map(w => w.distanceKm ?? 0));
  const maxJobs = Math.max(...workshops.map(w => w.completedJobs ?? 0));
  const maxReviews = Math.max(...workshops.map(w => w.reviewCount ?? 0));

  const scored = workshops.map(w => ({ ...w, score: scoreWorkshop(w, maxDist, maxJobs, maxReviews) }));
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, Math.min(3, scored.length));

  return (
    <div className="space-y-3">
      <hr className="border-surface-700/50 my-4" />

      <h3 className="font-bold text-sm flex items-center gap-2 text-surface-300">
        <Sparkles size={16} className="text-accent-400" />
        {t('components.smartWorkshop.title')}
      </h3>

      <div className="space-y-2">
        {top.map((w, i) => {
          const isSelected = selectedWorkshopId === w.id;
          const badges: Record<number, { icon: string; text: string; desc: string }> = {
            0: { icon: '🏆', text: t('components.smartWorkshop.bestSuggestion'), desc: '' },
            1: { icon: '💡', text: t('components.smartWorkshop.excellentAlternative'), desc: '' },
            2: { icon: '⭐', text: t('components.smartWorkshop.extraOption'), desc: '' },
          };
          const badge = badges[i];

          const reasons: string[] = [];
          if (i === 0) {
            if (w.distanceKm !== null && w.distanceKm <= (maxDist > 0 ? maxDist * 0.3 : 5)) reasons.push(t('components.smartWorkshop.nearest'));
            if (w.rating >= 4.5) reasons.push(t('components.smartWorkshop.topRated'));
            if (w.completedJobs && maxJobs > 0 && w.completedJobs >= maxJobs) reasons.push(t('components.smartWorkshop.mostRequested'));
            if (!reasons.length) reasons.push(t('components.smartWorkshop.bestForYou'));
          }

          return (
            <button
              key={w.id}
              onClick={() => onWorkshopSelect(w.id)}
              className={`card w-full text-right transition-all ${isSelected ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500' : 'border-surface-700/50 hover:bg-surface-700/80'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg ${i === 0 ? 'bg-accent-500/20' : 'bg-surface-700/50'}`}>
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{w.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${i === 0 ? 'bg-accent-500/20 text-accent-300' : 'bg-surface-700 text-surface-400'}`}>
                      {badge.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm">{w.rating.toFixed(1)}</span>
                    {w.reviewCount ? <span className="text-xs text-surface-400">({w.reviewCount})</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-surface-400">
                    {w.distanceKm !== null && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {w.distanceKm < 1 ? `${Math.round(w.distanceKm * 1000)} ${t('common.m')}` : `${w.distanceKm} ${t('common.km')}`}
                      </span>
                    )}
                    {w.completedJobs ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {w.completedJobs} {t('common.request')}
                      </span>
                    ) : null}
                  </div>
                  {reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {reasons.map((r, ri) => (
                        <span key={ri} className="text-[10px] bg-accent-500/10 text-accent-400 px-2 py-0.5 rounded-full">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {isSelected && <CheckCircle className="h-5 w-5 text-accent-400 shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-surface-500 text-center">
        {t('components.smartWorkshop.footnote')}
      </p>
    </div>
  );
}
