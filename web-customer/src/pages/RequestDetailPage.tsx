import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { requestsApi } from '../api/requests.api';
import { invoicesApi } from '../api/invoices.api';
import type { Request, Quote, Invoice } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ArrowLeft, MapPin, Calendar, CheckCircle, XCircle, CreditCard, Star, Receipt, MessageCircle } from 'lucide-react';
import { SERVICE_CATEGORIES } from '../constants/serviceCategories';
import { useRequestWebSocket } from '../hooks/useRequestWebSocket';

const statusSteps = [
  'pending', 'quoted', 'accepted', 'in_progress', 'inspection_report', 'customer_approved', 'awaiting_payment', 'completed', 'cancelled',
];

export function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      requestsApi.getById(id),
      requestsApi.getQuotes(id).catch(() => ({ data: [] })),
      invoicesApi.getByRequest(id).then((res: any) => {
        const data = res?.data;
        setInvoice(data?.id && typeof data.grandTotal === 'number' ? data : null);
      }).catch(() => setInvoice(null)),
    ]).then(([requestResponse, quotesResponse]) => {
      const loadedRequest = (requestResponse as any).data || requestResponse;
      const loadedQuotes = (quotesResponse as any)?.data || quotesResponse || [];
      setRequest({ ...loadedRequest, quotes: Array.isArray(loadedQuotes) && loadedQuotes.length > 0 ? loadedQuotes : (loadedRequest.quotes || []) });
    }).catch(() => {
      toast.error(t('toast.error.loadRequest'));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleWebSocketEvent = useCallback((type: string, payload: any) => {
    load();
  }, [id]);

  useRequestWebSocket(id ? Number(id) : undefined, handleWebSocketEvent);

  const handleAcceptQuote = async (quoteId: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await requestsApi.acceptQuote(id, quoteId);
      toast.success(t('toast.success.acceptQuote'));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.acceptQuote'));
    } finally { setActionLoading(false); }
  };

  const handleApproveReport = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await requestsApi.approveReport(id);
      toast.success(t('toast.success.approveReport'));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.approveReport'));
    } finally { setActionLoading(false); }
  };

  const handleRejectReport = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await requestsApi.rejectReport(id);
      toast.success(t('toast.success.rejectReport'));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.rejectReport'));
    } finally { setActionLoading(false); }
  };

  const handleApproveInvoice = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoicesApi.approve(id);
      toast.success(t('toast.success.approveInvoice'));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.approveInvoice'));
    } finally { setActionLoading(false); }
  };

  const handleRejectInvoice = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoicesApi.reject(id);
      toast.success(t('toast.success.rejectInvoice'));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.rejectInvoice'));
    } finally { setActionLoading(false); }
  };

  const handleCancelRequest = async () => {
    if (!id) return;
    toast((tToast) => (
      <div className="text-center space-y-3">
        <p className="text-surface-200">{t('pages.requestDetail.cancelConfirm')}</p>
        <p className="text-xs text-surface-400">{t('pages.requestDetail.cancelWarning')}</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => toast.dismiss(tToast.id)} className="px-4 py-2 rounded-xl bg-surface-700 text-surface-200 text-sm hover:bg-surface-600 transition-colors">{t('common.back')}</button>
          <button onClick={async () => {
            toast.dismiss(tToast.id);
            setActionLoading(true);
            try {
              await requestsApi.cancel(id);
              toast.success(t('toast.success.cancelRequest'));
              load();
            } catch (err: any) {
              toast.error(err.response?.data?.message || t('toast.error.cancelRequest'));
            } finally { setActionLoading(false); }
          }} className="px-4 py-2 rounded-xl bg-danger-500 text-white text-sm hover:bg-danger-400 transition-colors">{t('pages.requestDetail.confirmCancel')}</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  if (loading) return <LoadingSpinner />;
  if (!request) return <div className="p-4 text-center text-surface-400">{t('pages.requestDetail.notFound')}</div>;

  const currentStep = statusSteps.indexOf(request.status);
  const quotes = request.quotes || [];
  const acceptedQuote = quotes.find((quote) => quote.status === 'accepted');
  const assignedWorkshop = request as Request & { workshopId?: string | number; workshopName?: string };
  const hasAssignedWorkshop = ['accepted', 'in_progress', 'inspection_report', 'customer_approved', 'awaiting_payment', 'completed', 'paid'].includes(request.status);
  const selectedWorkshopQuote = acceptedQuote || (hasAssignedWorkshop && (assignedWorkshop.workshopId || assignedWorkshop.workshopName || invoice?.workshopId) ? {
    id: `assigned-${request.id}`,
    requestId: request.id,
    workshopId: String(assignedWorkshop.workshopId || invoice?.workshopId || ''),
    workshopName: assignedWorkshop.workshopName || invoice?.workshopName || 'الورشة المختارة',
    price: invoice?.grandTotal || 0,
    status: 'accepted',
    createdAt: request.createdAt,
  } as Quote : null);
  const visibleQuotes = selectedWorkshopQuote ? [selectedWorkshopQuote] : quotes;
  const report = request.inspectionReport;

  const allServiceNames = (request.serviceTypeIds || [])
    .map(id => {
      for (const cat of SERVICE_CATEGORIES) {
        const found = cat.services.find(s => s.id === id);
        if (found) return found.name;
      }
      return null;
    })
    .filter(Boolean) as string[];

  return (
    <div className="space-y-4 animate-fade-in">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .anim-in { animation: fade-in 0.3s ease-out both; }
      `}</style>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="p-2 hover:bg-surface-800 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">{allServiceNames.length > 0 ? allServiceNames[0] : (request.serviceTypeName || t('constants.maintenanceRequest'))}</h2>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="flex justify-between gap-1 overflow-x-auto py-2">
          {statusSteps.map((s, i) => {
            const labels: Record<string, string> = {
              pending: t('constants.status.pending'), quoted: t('constants.status.quoted'), accepted: t('constants.status.accepted'),
              in_progress: t('constants.status.inProgress'), inspection_report: t('constants.status.inspection'), customer_approved: t('constants.status.customerApproved'), awaiting_payment: 'بانتظار دفع الفاتورة', completed: t('constants.status.completed'), cancelled: t('constants.status.cancelled'),
            };
            const isActive = i <= currentStep;
            return (
              <div key={s} className="flex flex-col items-center min-w-0 flex-1">
                <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-accent-500' : 'bg-surface-600'} ${currentStep === i ? 'ring-2 ring-accent-500/50' : ''}`} />
                <span className={`text-[10px] mt-1 whitespace-nowrap ${isActive ? 'text-accent-400' : 'text-surface-500'}`}>{labels[s]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Request Info */}
      <div className="card space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{allServiceNames.length > 0 ? allServiceNames[0] : (request.serviceTypeName || t('constants.maintenanceRequest'))}</h3>
            {allServiceNames.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {allServiceNames.map((name, i) => (
                  <span key={i} className="text-xs bg-accent-500/20 text-accent-300 px-2 py-0.5 rounded-full">{name}</span>
                ))}
              </div>
            )}
          </div>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-sm text-surface-400">{request.description}</p>
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <MapPin className="h-4 w-4" /> <span>{request.locationAddress || request.city}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-400">
          <Calendar className="h-4 w-4" /> <span>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
        </div>
      </div>

      {/* Quotes */}
      {visibleQuotes.length > 0 && (
        <div id="quotes-section" className="space-y-2">
          <h3 className="font-semibold">{selectedWorkshopQuote ? 'الورشة المختارة' : t('pages.requestDetail.quotes')}</h3>
          {visibleQuotes.map((quote: Quote) => (
            <div key={quote.id} className="card flex items-center justify-between">
              <div>
                <h4 className="font-medium">{quote.workshopName}</h4>
                <p className="text-sm text-surface-400">{quote.price.toLocaleString()} {t('constants.currency')} · {quote.estimatedDays} {t('constants.days')}</p>
                {quote.notes && <p className="text-xs text-surface-500 mt-1">{quote.notes}</p>}
              </div>
              {quote.status === 'pending' && request.status === 'quoted' && (
                <button onClick={() => handleAcceptQuote(quote.id)} disabled={actionLoading} className="btn-primary text-sm py-2 px-4">
                  {t('pages.requestDetail.accept')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sub Orders (multi-workshop split) */}
      {request.subOrders && request.subOrders.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">{t('pages.requestDetail.subOrders')}</h3>
          {request.subOrders.map((so: any) => (
            <div key={so.id} className="card border border-accent-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{so.workshopName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    so.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                    so.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                    so.status === 'COMPLETED' ? 'bg-success-500/20 text-success-400' :
                    'bg-surface-600 text-surface-300'
                  }`}>{so.status === 'ACCEPTED' ? t('constants.status.accepted') : so.status === 'PENDING' ? t('constants.status.pending') : so.status === 'COMPLETED' ? t('constants.status.completed') : so.status}</span>
                </div>
                <span className="font-bold">{so.totalPrice?.toLocaleString()} {t('constants.currency')}</span>
              </div>
              <div className="space-y-1">
                {so.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm bg-black/20 rounded-lg px-3 py-1.5">
                    <span>{item.serviceTypeName}</span>
                    <span className="text-surface-400">{item.itemPrice?.toLocaleString()} {t('constants.currency')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspection Report */}
      {report && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t('pages.requestDetail.inspectionReport')}</h3>
            <button onClick={() => navigate(`/inspection-report/${request.id}`)} className="text-accent-400 text-sm hover:underline">
              {t('pages.requestDetail.viewFullReport')}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-surface-400">{t('pages.requestDetail.overallCondition')}:</span>
            <span className={`font-medium ${
              report.overallCondition === 'excellent' || report.overallCondition === 'good'
                ? 'text-success-400' : report.overallCondition === 'fair'
                ? 'text-accent-400' : 'text-danger-400'
            }`}>{report.overallCondition === 'excellent' ? t('constants.condition.excellent') : report.overallCondition === 'good' ? t('constants.condition.good') : report.overallCondition === 'fair' ? t('constants.condition.fair') : report.overallCondition === 'poor' ? t('constants.condition.poor') : report.overallCondition || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-surface-400">{t('pages.requestDetail.grandTotal')}:</span>
            <span className="font-bold text-accent-400">{report.grandTotal.toLocaleString()} {t('constants.currency')}</span>
          </div>
          {report.status === 'pending_approval' && (
            <div className="flex gap-3">
              <button onClick={handleRejectReport} disabled={actionLoading} className="btn-danger flex-1 flex items-center justify-center gap-2">
                <XCircle className="h-4 w-4" /> {t('pages.requestDetail.reject')}
              </button>
              <button onClick={handleApproveReport} disabled={actionLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> {t('pages.requestDetail.approve')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoice */}
      {invoice && (
        <div className="card space-y-3 anim-in">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="h-5 w-5 text-accent-400" />
            <h3 className="font-semibold">{t('pages.requestDetail.invoiceFor')} {invoice.workshopName}</h3>
          </div>
          <div className="space-y-2">
            {invoice.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div><span>{item.name}</span><span className="text-surface-500 mr-2">×{item.quantity}</span></div>
                <span>{item.total.toLocaleString()} {t('constants.currency')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-600 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-surface-400">
              <span>{t('pages.requestDetail.subtotal')}</span>
              <span>{invoice.totalAmount.toLocaleString()} {t('constants.currency')}</span>
            </div>
            <div className="flex justify-between text-surface-400">
              <span>{t('pages.requestDetail.tax')}</span>
              <span>{invoice.taxAmount?.toLocaleString() || (invoice.grandTotal && invoice.totalAmount ? (invoice.grandTotal - invoice.totalAmount).toLocaleString() : '-')} {t('constants.currency')}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-1">
              <span>{t('pages.requestDetail.total')}</span>
              <span className="text-accent-400">{invoice.grandTotal.toLocaleString()} {t('constants.currency')}</span>
            </div>
          </div>

          {invoice.status === 'pending_approval' && (
            <div className="flex gap-3 pt-2">
              <button onClick={handleRejectInvoice} disabled={actionLoading} className="btn-danger flex-1 flex items-center justify-center gap-2 py-3">
                <XCircle className="h-4 w-4" /> {t('pages.requestDetail.rejectInvoice')}
              </button>
              <button onClick={handleApproveInvoice} disabled={actionLoading} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                <CheckCircle className="h-4 w-4" /> {t('pages.requestDetail.approveInvoice')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Workshop contact */}
      {selectedWorkshopQuote?.workshopId && (
        <button onClick={() => navigate(`/orders/${request.id}/chat?workshopId=${selectedWorkshopQuote.workshopId}&workshopName=${encodeURIComponent(selectedWorkshopQuote.workshopName)}`)} className="card flex w-full items-center justify-between border border-accent-200 text-right transition hover:border-accent-400 hover:bg-accent-50/40 dark:border-accent-500/20 dark:hover:bg-accent-500/10">
          <span><span className="block font-black text-surface-900 dark:text-white">تواصل مع الورشة</span><span className="mt-1 block text-xs text-surface-500">{selectedWorkshopQuote.workshopName}</span></span>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500 text-white"><MessageCircle size={21} /></span>
        </button>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {invoice?.status === 'approved' && (
          <button onClick={() => navigate(`/payment/${request.id}`)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg">
            <CreditCard className="h-5 w-5" /> {t('pages.requestDetail.pay')} {invoice?.grandTotal?.toLocaleString() || ''} {t('constants.currency')}
          </button>
        )}
        {(request.status === 'paid' || invoice?.status === 'paid') && selectedWorkshopQuote && (
          <button onClick={() => navigate(`/rating/${request.id}/${selectedWorkshopQuote.workshopId}`)}
            className="btn-secondary w-full flex items-center justify-center gap-2">
            <Star className="h-5 w-5" /> {t('pages.requestDetail.rateService')}
          </button>
        )}
        {['pending', 'quoted'].includes(request.status) && (
          <button onClick={handleCancelRequest}
            disabled={actionLoading}
            className="btn-danger w-full flex items-center justify-center gap-2">
            <XCircle className="h-5 w-5" /> {t('pages.requestDetail.cancelRequest')}
          </button>
        )}
      </div>
    </div>
  );
}
