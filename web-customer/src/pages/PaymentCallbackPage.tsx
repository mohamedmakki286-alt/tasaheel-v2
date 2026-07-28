import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { paymentsApi } from '../api/payments.api';

type CallbackState = 'checking' | 'paid' | 'failed';

export function PaymentCallbackPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState<CallbackState>('checking');
  const [message, setMessage] = useState('جارٍ التحقق من عملية الدفع...');
  const stored = sessionStorage.getItem('tasaheel_pending_payment');
  const pending = stored ? JSON.parse(stored) : null;
  const requestId = params.get('requestId') || pending?.requestId;

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!pending?.localPaymentId) {
        setState('failed');
        setMessage('تعذر العثور على مرجع عملية الدفع.');
        return;
      }
      try {
        const response: any = await paymentsApi.verify(String(pending.localPaymentId));
        const payment = response.data || response;
        if (cancelled) return;
        if (payment.status === 'completed') {
          sessionStorage.removeItem('tasaheel_pending_payment');
          setState('paid');
          setMessage('تم تأكيد الدفع بنجاح.');
        } else if (['failed', 'refunded'].includes(payment.status)) {
          setState('failed');
          setMessage('لم تكتمل عملية الدفع. يمكنك المحاولة مرة أخرى.');
        } else {
          setState('failed');
          setMessage('العملية ما زالت قيد المعالجة. راجع الطلب بعد قليل.');
        }
      } catch (error: any) {
        if (!cancelled) {
          setState('failed');
          setMessage(error.response?.data?.message || 'تعذر التحقق من عملية الدفع.');
        }
      }
    };
    verify();
    return () => { cancelled = true; };
  }, []);

  const Icon = state === 'checking' ? Loader2 : state === 'paid' ? CheckCircle2 : XCircle;
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="card space-y-5 p-8">
        <Icon className={`mx-auto h-16 w-16 ${state === 'checking' ? 'animate-spin text-accent-500' : state === 'paid' ? 'text-emerald-500' : 'text-red-500'}`} />
        <h1 className="text-xl font-black">{state === 'paid' ? 'تم الدفع' : state === 'checking' ? 'التحقق من الدفع' : 'لم يكتمل الدفع'}</h1>
        <p className="text-sm text-surface-500">{message}</p>
        <Link to={requestId ? `/orders/${requestId}` : '/orders'} className="btn-primary inline-flex w-full justify-center py-3">
          عرض الطلب
        </Link>
      </div>
    </div>
  );
}
