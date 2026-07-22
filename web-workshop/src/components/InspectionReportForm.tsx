import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Wrench, Cog, Save, Send, Clock, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { submitReport, updateReport } from '../api/inspection.api';
import { formatCurrency } from '../utils/formatters';
import type { InspectionPart, InspectionLabor, InspectionReport } from '../types';
import NumberInput, { toNumStr } from './NumberInput';

interface InspectionReportFormProps {
  requestId: string;
  request?: any;
  existingReport?: InspectionReport | null;
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 'urgent' as const, label: 'عاجل', icon: AlertCircle, color: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'important' as const, label: 'مهم', icon: AlertTriangle, color: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'deferrable' as const, label: 'يمكن تأجيله', icon: Info, color: 'border-gray-300 bg-gray-50 text-gray-600' },
];

export default function InspectionReportForm({ requestId, request, existingReport, onClose }: InspectionReportFormProps) {
  const [notes, setNotes] = useState(existingReport?.notes || '');
  const [priority, setPriority] = useState<'urgent' | 'important' | 'deferrable'>(existingReport?.priority || 'important');
  const [parts, setParts] = useState<InspectionPart[]>(existingReport?.parts || []);
  const [labor, setLabor] = useState<InspectionLabor[]>(existingReport?.labor || []);
  const [isDraft, setIsDraft] = useState(existingReport?.status === 'draft');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const isEditing = !!existingReport?.id;

  useEffect(() => {
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, []);

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

  const addLabor = () => setLabor([...labor, { description: '', minutes: 30, hourlyRate: 0, total: 0 }]);

  const updateLabor = (index: number, field: keyof InspectionLabor, value: string | number) => {
    setLabor(labor.map((l, i) => {
      if (i !== index) return l;
      const newLabor = { ...l, [field]: value };
      if (field === 'minutes' || field === 'hourlyRate') {
        const hours = (field === 'minutes' ? Number(value) : Number(newLabor.minutes)) / 60;
        const rate = field === 'hourlyRate' ? Number(value) : Number(newLabor.hourlyRate);
        newLabor.total = hours * rate;
      }
      return newLabor;
    }));
  };

  const removeLabor = (index: number) => setLabor(labor.filter((_, i) => i !== index));

  const partsTotal = parts.reduce((sum, p) => sum + (Number(p.quantity) * Number(p.unitPrice)), 0);
  const laborTotal = labor.reduce((sum, l) => {
    const hours = Number(l.minutes) / 60;
    return sum + (hours * Number(l.hourlyRate));
  }, 0);
  const grandTotal = partsTotal + laborTotal;

  const buildPayload = useCallback((status: 'draft' | 'pending_approval') => ({
    notes,
    parts: parts.map(p => ({ name: p.name, quantity: Number(p.quantity), unitPrice: Number(p.unitPrice) })),
    labor: labor.map(l => ({ description: l.description, minutes: Number(l.minutes), hourlyRate: Number(l.hourlyRate) })),
    priority,
    status,
  }), [notes, parts, labor, priority]);

  const mutation = useMutation({
    mutationFn: async (status: 'draft' | 'pending_approval') => {
      const payload = buildPayload(status);
      if (isEditing) {
        return updateReport(existingReport!.id, payload);
      }
      return submitReport(requestId, payload);
    },
    onSuccess: (_, status) => {
      toast.success(status === 'draft' ? 'تم حفظ المسودة' : 'تم إرسال التقرير بنجاح');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['inspection-report', requestId] });
      onClose();
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ'),
  });

  const handleSubmit = (status: 'draft' | 'pending_approval') => {
    if (status === 'pending_approval' && parts.length === 0 && labor.length === 0) {
      toast.error('أضف قطعة غيار أو عمل صيانة واحد على الأقل');
      return;
    }
    mutation.mutate(status);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">تقرير الفحص</h1>
            <Wrench size={20} className="text-[#E31B23]" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDraft && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">مسودة</span>
          )}
        </div>
      </header>

      {/* Request Info Bar */}
      {request && (
        <div className="flex items-center gap-4 px-4 md:px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 shrink-0 overflow-x-auto">
          <span className="flex items-center gap-1 whitespace-nowrap">📋 الطلب #{request.id}</span>
          {request.carMake && <span className="flex items-center gap-1 whitespace-nowrap">🚗 {request.carMake} {request.carModel} {request.carYear}</span>}
          {request.carPlateNumber && <span className="whitespace-nowrap">ن ج {request.carPlateNumber}</span>}
          <span className="whitespace-nowrap">فحص شامل</span>
        </div>
      )}

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">

          {/* Summary + Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-xs">📝</span>
                ملخص الفحص
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E31B23]/20 focus:border-[#E31B23] resize-none transition-all"
                placeholder="اكتب نتائج الفحص والأعطال المكتشفة..."
              />
            </div>

            {/* Priority */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2">أولوية العطل</h3>
              <div className="flex flex-col gap-2">
                {PRIORITY_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        isSelected
                          ? `${opt.color} border-current`
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{opt.label}</span>
                      {isSelected && <span className="mr-auto w-2 h-2 rounded-full bg-current" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-purple-50 flex items-center justify-center">
                  <Cog size={14} className="text-purple-600" />
                </span>
                قطع الغيار
              </h3>
              <button type="button" onClick={addPart} className="flex items-center gap-1 text-sm font-medium text-[#E31B23] hover:text-[#c9161e] transition-colors">
                <Plus size={16} /> إضافة قطعة
              </button>
            </div>
            {parts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">لم تُضف أي قطع غيار بعد</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parts.map((part, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">اسم القطعة</span>
                    <button type="button" onClick={() => removePart(index)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={part.name}
                    onChange={(e) => updatePart(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31B23]/20 focus:border-[#E31B23]"
                    placeholder="اسم القطعة"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-gray-400 mb-1 block">الكمية</label>
                      <NumberInput
                        value={toNumStr(part.quantity)}
                        onValueChange={(v) => updatePart(index, 'quantity', Number(v) || 0)}
                        mode="integer"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-400 mb-1 block">سعر الوحدة التقديري</label>
                      <NumberInput
                        value={toNumStr(part.unitPrice)}
                        onValueChange={(v) => updatePart(index, 'unitPrice', Number(v) || 0)}
                        mode="decimal"
                        decimalScale={2}
                        suffix="ر.س"
                      />
                    </div>
                  </div>
                  <div className="text-left text-sm font-bold text-[#E31B23]">
                    الإجمالي: {formatCurrency(Number(part.quantity) * Number(part.unitPrice))} ر.س
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Labor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-orange-50 flex items-center justify-center">
                  <Wrench size={14} className="text-orange-600" />
                </span>
                أعمال الصيانة
              </h3>
              <button type="button" onClick={addLabor} className="flex items-center gap-1 text-sm font-medium text-[#E31B23] hover:text-[#c9161e] transition-colors">
                <Plus size={16} /> إضافة عمل
              </button>
            </div>
            {labor.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">لم تُضف أي أعمال صيانة بعد</p>
            )}
            <div className="space-y-4">
              {labor.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">وصف العمل</span>
                    <button type="button" onClick={() => removeLabor(index)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLabor(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31B23]/20 focus:border-[#E31B23]"
                    placeholder="وصف العمل"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-gray-400 mb-1 block flex items-center gap-1">
                        <Clock size={11} /> المدة المتوقعة
                      </label>
                      <NumberInput
                        value={toNumStr(item.minutes)}
                        onValueChange={(v) => updateLabor(index, 'minutes', Number(v) || 0)}
                        mode="integer"
                        min={1}
                        suffix="دقيقة"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-400 mb-1 block">أجرة العمل التقديرية</label>
                      <NumberInput
                        value={toNumStr(item.hourlyRate)}
                        onValueChange={(v) => updateLabor(index, 'hourlyRate', Number(v) || 0)}
                        mode="decimal"
                        decimalScale={2}
                        suffix="ر.س"
                      />
                    </div>
                  </div>
                  <div className="text-left text-sm font-bold text-[#E31B23]">
                    الإجمالي: {formatCurrency((Number(item.minutes) / 60) * Number(item.hourlyRate))} ر.س
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Totals */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">الملخص التقديري</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-400">إجمالي قطع الغيار</span>
                  <span className="mr-2 font-bold text-gray-800">{formatCurrency(partsTotal)} ر.س</span>
                </div>
                <div>
                  <span className="text-gray-400">إجمالي الأعمال</span>
                  <span className="mr-2 font-bold text-gray-800">{formatCurrency(laborTotal)} ر.س</span>
                </div>
              </div>
              <div className="text-left">
                <span className="text-gray-400 text-sm">الإجمالي التقديري</span>
                <div className="text-2xl font-bold text-[#E31B23]">{formatCurrency(grandTotal)} ر.س</div>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 rounded-xl">
              <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-600">الأسعار تقديرية وتخضع لمراجعة واعتماد الورشة قبل إرسالها للعميل.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer — Fixed */}
      <footer className="flex items-center justify-between px-4 md:px-6 py-3 border-t border-gray-100 bg-white shrink-0">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          إلغاء
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            حفظ كمسودة
          </button>
          <button
            onClick={() => handleSubmit('pending_approval')}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E31B23] text-white text-sm font-bold hover:bg-[#c9161e] transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            إرسال للمراجعة
          </button>
        </div>
      </footer>
    </div>
  );
}
