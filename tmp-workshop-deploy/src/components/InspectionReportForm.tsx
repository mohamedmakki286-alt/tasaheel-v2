import { useState } from 'react';
import { X, Plus, Trash2, Calculator, Wrench, Cog, Save } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { submitReport } from '../api/inspection.api';
import { formatCurrency } from '../utils/formatters';
import type { InspectionPart, InspectionLabor } from '../types';
import NumberInput from './NumberInput';

interface InspectionReportFormProps {
  requestId: string;
  onClose: () => void;
}

export default function InspectionReportForm({ requestId, onClose }: InspectionReportFormProps) {
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<InspectionPart[]>([]);
  const [labor, setLabor] = useState<InspectionLabor[]>([]);
  const [taxPercent, setTaxPercent] = useState('15');
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const addPart = () => setParts([...parts, { name: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const updatePart = (index: number, field: keyof InspectionPart, value: string | number) => {
    setParts(parts.map((p, i) => {
      if (i !== index) return p;
      const newPart = { ...p, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newPart.total = Number(newPart.quantity) * Number(newPart.unitPrice);
      }
      return newPart;
    }));
  };

  const removePart = (index: number) => setParts(parts.filter((_, i) => i !== index));

  const addLabor = () => setLabor([...labor, { description: '', hours: 1, hourlyRate: 0, total: 0 }]);

  const updateLabor = (index: number, field: keyof InspectionLabor, value: string | number) => {
    setLabor(labor.map((l, i) => {
      if (i !== index) return l;
      const newLabor = { ...l, [field]: value };
      if (field === 'hours' || field === 'hourlyRate') {
        newLabor.total = Number(newLabor.hours) * Number(newLabor.hourlyRate);
      }
      return newLabor;
    }));
  };

  const removeLabor = (index: number) => setLabor(labor.filter((_, i) => i !== index));

  const partsTotal = parts.reduce((sum, p) => sum + p.total, 0);
  const laborTotal = labor.reduce((sum, l) => sum + l.total, 0);
  const taxAmount = ((partsTotal + laborTotal) * Number(taxPercent || 0)) / 100;
  const grandTotal = partsTotal + laborTotal + taxAmount;

  const mutation = useMutation({
    mutationFn: () =>
      submitReport(requestId, {
        notes,
        parts: parts.map((p) => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice })),
        labor: labor.map((l) => ({ description: l.description, hours: l.hours, hourlyRate: l.hourlyRate })),
        taxPercent: Number(taxPercent),
      }),
    onSuccess: () => {
      toast.success(t('toast.success.inspectionSent'));
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.inspectionSendFailed')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parts.length === 0 && labor.length === 0) {
      toast.error(t('toast.error.addPartOrLabor'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <Wrench size={18} className="text-primary-600" />
            </div>
            <h2 className="text-lg font-bold text-surface-900">{t('components.inspectionReportForm.title')}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1.5 rounded-lg hover:bg-surface-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div>
            <label className="label">{t('components.inspectionReportForm.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[80px] resize-none"
              placeholder={t('components.inspectionReportForm.notesPlaceholder')}
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cog size={18} className="text-surface-500" />
                <h3 className="font-bold text-surface-800">{t('components.inspectionReportForm.parts')}</h3>
              </div>
              <button type="button" onClick={addPart} className="btn-ghost text-primary-600 hover:text-primary-700">
                <Plus size={16} /> {t('components.inspectionReportForm.addPart')}
              </button>
            </div>
            {parts.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-6 bg-surface-50 rounded-xl">{t('components.inspectionReportForm.noParts')}</p>
            )}
            <div className="space-y-2">
              {parts.map((part, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200 animate-slide-up">
                  <input
                    type="text"
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    className="input-field flex-1 text-sm py-2"
                    placeholder={t('components.inspectionReportForm.partName')}
                  />
                  <NumberInput
                    value={part.quantity}
                    onChange={(v) => updatePart(index, 'quantity', Math.max(1, v))}
                    min={1}
                    step={1}
                    precision={0}
                  />
                  <NumberInput
                    value={part.unitPrice}
                    onChange={(v) => updatePart(index, 'unitPrice', v)}
                    step={0.5}
                    precision={2}
                  />
                  <span className="text-sm font-bold text-primary-600 w-20 text-left">{formatCurrency(part.total)}</span>
                  <button type="button" onClick={() => removePart(index)} className="text-danger-500 hover:text-danger-600 p-1.5 rounded-lg hover:bg-danger-50 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-surface-500" />
                <h3 className="font-bold text-surface-800">{t('components.inspectionReportForm.labor')}</h3>
              </div>
              <button type="button" onClick={addLabor} className="btn-ghost text-primary-600 hover:text-primary-700">
                <Plus size={16} /> {t('components.inspectionReportForm.addLabor')}
              </button>
            </div>
            {labor.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-6 bg-surface-50 rounded-xl">{t('components.inspectionReportForm.noLabor')}</p>
            )}
            <div className="space-y-2">
              {labor.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200 animate-slide-up">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLabor(index, 'description', e.target.value)}
                    className="input-field flex-1 text-sm py-2"
                    placeholder={t('components.inspectionReportForm.workDescription')}
                  />
                  <NumberInput
                    value={item.hours}
                    onChange={(v) => updateLabor(index, 'hours', Math.max(0.5, v))}
                    min={0.5}
                    step={0.5}
                    precision={1}
                  />
                  <NumberInput
                    value={item.hourlyRate}
                    onChange={(v) => updateLabor(index, 'hourlyRate', v)}
                    step={0.5}
                    precision={2}
                  />
                  <span className="text-sm font-bold text-primary-600 w-20 text-left">{formatCurrency(item.total)}</span>
                  <button type="button" onClick={() => removeLabor(index)} className="text-danger-500 hover:text-danger-600 p-1.5 rounded-lg hover:bg-danger-50 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('components.inspectionReportForm.taxPercent')}</label>
              <div className="relative">
                <Calculator size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <NumberInput
                value={taxPercent === '' ? 0 : Number(taxPercent)}
                onChange={(v) => setTaxPercent(String(v))}
                min={0}
                max={100}
                step={0.5}
                precision={1}
                suffix="%"
              />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 border border-surface-200 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">{t('components.inspectionReportForm.partsTotal')}</span>
              <span className="font-bold text-surface-800">{formatCurrency(partsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">{t('components.inspectionReportForm.laborTotal')}</span>
              <span className="font-bold text-surface-800">{formatCurrency(laborTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">{t('components.inspectionReportForm.tax')} ({taxPercent}%)</span>
              <span className="font-bold text-surface-800">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-surface-300 pt-2.5 flex justify-between text-lg">
              <span className="font-bold text-surface-900">{t('components.inspectionReportForm.grandTotal')}</span>
              <span className="font-bold text-primary-600 text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('components.inspectionReportForm.saving')}</>
              ) : (
                <><Save size={18} /> {t('components.inspectionReportForm.save')}</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">{t('components.inspectionReportForm.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
