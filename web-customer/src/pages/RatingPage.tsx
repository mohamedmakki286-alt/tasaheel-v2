import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { reviewsApi } from '../api/reviews.api';
import { StarRating } from '../components/StarRating';
import { ArrowLeft, Send } from 'lucide-react';

export function RatingPage() {
  const { t } = useTranslation();
  const { requestId, workshopId } = useParams<{ requestId: string; workshopId: string }>();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error(t('toast.error.selectRating')); return; }
    if (!requestId || !workshopId) return;
    setSaving(true);
    try {
      await reviewsApi.create({ requestId, workshopId, rating, comment });
      toast.success(t('toast.success.submitRating'));
      navigate(`/orders/${requestId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.submitRating'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/orders/${requestId}`)} className="p-2 hover:bg-surface-800 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">{t('pages.rating.title')}</h2>
      </div>

      <div className="card text-center py-8 space-y-4">
        <h3 className="text-lg">{t('pages.rating.howWasExperience')}</h3>
        <div className="flex justify-center">
          <StarRating rating={rating} onChange={setRating} size="lg" />
        </div>
        <p className="text-sm text-surface-400">
          {rating === 0 ? t('pages.rating.selectStars') :
           rating === 1 ? t('pages.rating.terrible') :
           rating === 2 ? t('pages.rating.bad') :
           rating === 3 ? t('pages.rating.average') :
           rating === 4 ? t('pages.rating.good') :
           t('pages.rating.excellent')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('pages.rating.commentLabel')}</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('pages.rating.commentPlaceholder')}
          rows={4}
          className="input-field resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving || rating === 0}
        className="btn-primary w-full flex items-center justify-center gap-2 py-4"
      >
        {saving ? (
          <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <><Send className="h-5 w-5" /> {t('pages.rating.submit')}</>
        )}
      </button>
    </div>
  );
}
