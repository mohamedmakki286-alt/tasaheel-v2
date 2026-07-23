import { useState } from 'react';
import { X, DollarSign, FileText, Send, Info, Package } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { submitQuote } from '../api/quotes.api';
import NumberInput from './NumberInput';

interface ServiceTypeOption {
  id: number;
  name: string;
}

interface QuoteFormProps {
  requestId: string;
  onClose: () => void;
  serviceTypes?: ServiceTypeOption[];
}

export default function QuoteForm({ requestId, onClose, serviceTypes }: QuoteFormProps) {
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: () => submitQuote(requestId, { price: Number(price), notes, serviceTypeId }),
    onSuccess: () => {
      toast.success(t('toast.success.quoteSent'));
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
    },
    onError: () => {
      toast.error(t('toast.error.quoteSendFailed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) {
      toast.error(t('toast.error.enterPrice'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center">
              <DollarSign size={18} className="text-accent-600" />
            </div>
            <h2 className="text-lg font-bold text-surface-900">{t('components.quoteForm.title')}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1.5 rounded-lg hover:bg-surface-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="p-4 rounded-2xl bg-accent-50 border border-accent-200 flex items-start gap-3">
            <Info size={18} className="text-accent-600 shrink-0 mt-0.5" />
            <p className="text-sm text-accent-700">{t('components.quoteForm.description')}</p>
          </div>

          {serviceTypes && serviceTypes.length > 0 && (
            <div>
              <label className="label">{t('components.quoteForm.service')}</label>
              <div className="relative">
                <Package size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <select
                  value={serviceTypeId ?? ''}
                  onChange={(e) => setServiceTypeId(e.target.value ? Number(e.target.value) : null)}
                  className="input-field pr-10"
                >
                  <option value="">{t('components.quoteForm.packagePrice')}</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="label">{t('components.quoteForm.price')}</label>
            <NumberInput
              value={price === '' ? 0 : Number(price)}
              onChange={(v) => setPrice(String(v))}
              step={0.5}
              precision={2}
              placeholder={t('components.quoteForm.pricePlaceholder')}
              suffix={t('common.sar')}
            />
          </div>

          <div>
            <label className="label">{t('components.quoteForm.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[120px] resize-none"
              placeholder={t('components.quoteForm.notesPlaceholder')}
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('components.quoteForm.sending')}</>
              ) : (
                <><Send size={18} /> {t('components.quoteForm.send')}</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">
              {t('components.quoteForm.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
