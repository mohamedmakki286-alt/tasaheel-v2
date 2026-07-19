import { useState } from 'react';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { updateRequestStatus } from '../api/requests.api';
import { STATUS_TRANSITIONS } from '../utils/constants';
import type { RequestStatus } from '../types';

interface StatusUpdateModalProps {
  requestId: string;
  currentStatus: RequestStatus;
  onClose: () => void;
}

export default function StatusUpdateModal({ requestId, currentStatus, onClose }: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  const mutation = useMutation({
    mutationFn: () => updateRequestStatus(requestId, { status: selectedStatus as RequestStatus, notes }),
    onSuccess: () => {
      toast.success(t('toast.success.statusUpdated'));
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.statusUpdateFailed')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      toast.error(t('toast.error.selectNewStatus'));
      return;
    }
    mutation.mutate();
  };

  if (allowedTransitions.length === 0) {
    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-amber-600" />
          </div>
          <p className="text-surface-600 font-semibold mb-2">{t('components.statusUpdateModal.cannotChange')}</p>
          <p className="text-sm text-surface-400 mb-5">{t('components.statusUpdateModal.finalState')}</p>
          <button onClick={onClose} className="btn-primary">{t('components.statusUpdateModal.close')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <ArrowLeftRight size={18} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-surface-900">{t('components.statusUpdateModal.title')}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1.5 rounded-lg hover:bg-surface-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="label">{t('components.statusUpdateModal.currentStatus')}</label>
            <div className="input-field bg-surface-100 text-surface-600 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              {t('constants.requestStatuses.' + currentStatus, currentStatus)}
            </div>
          </div>

          <div>
            <label className="label">{t('components.statusUpdateModal.newStatus')}</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field appearance-none"
                required
              >
                <option value="">{t('components.statusUpdateModal.selectStatus')}</option>
                {allowedTransitions.map((status) => (
                  <option key={status} value={status}>
                    {t('constants.requestStatuses.' + status, status)}
                  </option>
                ))}
              </select>
              <ArrowLeftRight size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="label">{t('components.statusUpdateModal.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder={t('components.statusUpdateModal.notesPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('components.statusUpdateModal.updating')}</>
              ) : (
                t('components.statusUpdateModal.update')
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">{t('components.statusUpdateModal.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
