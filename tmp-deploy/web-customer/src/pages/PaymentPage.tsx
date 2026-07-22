import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, CreditCard, Wallet, ShieldCheck } from 'lucide-react';
import { invoicesApi } from '../api/invoices.api';
import { paymentsApi } from '../api/payments.api';
import type { Invoice } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function PaymentPage() {
  const { t } = useTranslation();
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    invoicesApi.getByRequest(requestId).then((res: any) => setInvoice(res.data || res))
      .catch(() => toast.error(t('toast.error.noInvoice'))).finally(() => setLoading(false));
  }, [requestId, t]);

  const handlePay = async () => {
    if (!invoice || !requestId) return;
    setPaying(true);
    try {
      await paymentsApi.initiate({
        requestId,
        amount: invoice.grandTotal,
        method: 'moyasar',
      });
      toast.success('تم تأكيد الدفع بنجاح');
      navigate(`/orders/${requestId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'تعذر إكمال الدفع');
    } finally { setPaying(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!invoice) return <div className="p-4 text-center text-surface-400">{t('pages.payment.noInvoice')}</div>;

  return <div className="space-y-4 animate-fade-in">
    <div className="flex items-center gap-3"><button onClick={() => navigate(`/orders/${requestId}`)} className="p-2 hover:bg-surface-800 rounded-lg"><ArrowLeft className="h-5 w-5" /></button><h2 className="text-xl font-bold">دفع الفاتورة</h2></div>
    <div className="card">
      <div className="flex items-center gap-2 mb-3"><CreditCard className="h-6 w-6 text-accent-400"/><h3 className="font-semibold">تفاصيل الفاتورة</h3></div>
      <div className="space-y-3">{invoice.items?.map((item, i) => <div key={i} className="flex justify-between text-sm"><span>{item.name} <span className="text-surface-500">× {item.quantity}</span></span><span>{item.total.toLocaleString()} {t('constants.currency')}</span></div>)}</div>
      <div className="border-t border-surface-600 mt-3 pt-3 space-y-1 text-sm">
        <div className="flex justify-between text-surface-400"><span>المجموع</span><span>{invoice.totalAmount.toLocaleString()} {t('constants.currency')}</span></div>
        <div className="flex justify-between text-surface-400"><span>الضريبة</span><span>{invoice.taxAmount?.toLocaleString() || invoice.tax?.toLocaleString() || '-'} {t('constants.currency')}</span></div>
        <div className="flex justify-between font-bold text-lg"><span>الإجمالي</span><span className="text-accent-400">{invoice.grandTotal.toLocaleString()} {t('constants.currency')}</span></div>
      </div>
    </div>
    <div className="card border-emerald-400/30 bg-emerald-400/10 flex items-start gap-3"><ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0"/><div><h3 className="font-bold">الدفع الآمن</h3><p className="text-sm text-surface-500 mt-1">يتم الدفع عبر بوابة الدفع الآمنة. جميع المعاملات مشفرة ومؤمنة.</p></div></div>
    <button onClick={handlePay} disabled={paying || invoice.status !== 'approved'} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50">
      {paying ? <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <><Wallet className="h-5 w-5"/> تأكيد الدفع — {invoice.grandTotal.toLocaleString()} {t('constants.currency')}</>}
    </button>
    {invoice.status !== 'approved' && <p className="text-center text-sm text-amber-500">يجب اعتماد الفاتورة أولاً قبل الدفع.</p>}
  </div>;
}
