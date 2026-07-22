import { useState } from 'react';
import { X, Receipt, Plus, Trash2, Send, Building2, User } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createInvoice } from '../api/invoice.api';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/authStore';
import type { InvoiceItemPayload } from '../types';
import NumberInput from './NumberInput';

interface InvoiceFormProps {
  requestId: string;
  defaultItems?: InvoiceItemPayload[];
  defaultTaxPercent?: number;
  onClose: () => void;
}

export default function InvoiceForm({
  requestId,
  defaultItems,
  defaultTaxPercent = 15,
  onClose,
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItemPayload[]>(
    defaultItems && defaultItems.length > 0
      ? defaultItems
      : [{ name: '', quantity: 1, unitPrice: 0 }]
  );
  const [taxPercent, setTaxPercent] = useState(defaultTaxPercent.toString());
  const workshop = useAuthStore((s) => s.workshop);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const tPct = Number(taxPercent) || 0;
  const itemsTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = (itemsTotal * tPct) / 100;
  const grandTotal = itemsTotal + taxAmount;

  const updateItem = (index: number, field: keyof InvoiceItemPayload, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'name' ? value : Number(value) || 0 };
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: () =>
      createInvoice(requestId, {
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        taxPercent: tPct,
      }),
    onSuccess: () => {
      toast.success(t('toast.success.invoiceCreated'));
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      onClose();
    },
    onError: () => toast.error(t('toast.error.invoiceCreateFailed')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || items.every((i) => !i.name)) {
      toast.error(t('toast.error.addItemRequired'));
      return;
    }
    if (grandTotal <= 0) {
      toast.error(t('toast.error.totalMustBePositive'));
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Receipt size={18} className="text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-surface-900">{t('components.invoiceForm.title')}</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 p-1.5 rounded-lg hover:bg-surface-100 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-surface-400" />
              <span className="text-sm font-bold text-surface-700">{workshop?.name || t('components.invoiceForm.workshop')}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-surface-400" />
              <span className="text-sm text-surface-600">{workshop?.phone}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-surface-700">{t('components.invoiceForm.invoiceData')}</label>
              <button type="button" onClick={addItem} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium">
                <Plus size={16} /> {t('components.invoiceForm.addItem')}
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    placeholder={t('components.invoiceForm.itemName')}
                    className="input-field flex-1 text-sm"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-surface-500">{t('components.invoiceForm.quantity')}</label>
                    <NumberInput
                      value={item.quantity}
                      onChange={(v) => updateItem(index, 'quantity', String(Math.max(1, v)))}
                      min={1}
                      step={1}
                      precision={0}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-surface-500">{t('components.invoiceForm.unitPrice')}</label>
                    <NumberInput
                      value={item.unitPrice}
                      onChange={(v) => updateItem(index, 'unitPrice', String(v))}
                      step={0.5}
                      precision={2}
                      suffix={t('common.sar')}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-surface-500">{t('components.invoiceForm.total')}</label>
                    <div className="h-10 flex items-center px-3 rounded-xl bg-surface-100 text-surface-700 text-sm font-semibold">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label">{t('components.invoiceForm.taxPercent')}</label>
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

          <div className="p-4 rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 border border-surface-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">{t('components.invoiceForm.itemsTotal')}</span>
              <span className="font-semibold text-surface-800">{formatCurrency(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">{t('components.invoiceForm.taxValue')}</span>
              <span className="font-semibold text-surface-800">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-surface-300">
              <span className="text-surface-900">{t('components.invoiceForm.finalTotal')}</span>
              <span className="text-emerald-600 text-xl">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('components.invoiceForm.sending')}</>
              ) : (
                <><Send size={18} /> {t('components.invoiceForm.send')}</>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-6">{t('components.invoiceForm.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
