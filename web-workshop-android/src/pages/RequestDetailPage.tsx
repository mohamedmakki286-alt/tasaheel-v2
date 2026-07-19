import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  MapPin,
  Calendar,
  User,
  Car,
  Phone,
  PhoneCall,
  Clock,
  ClipboardList,
  FileText,
  CheckCircle2,
  XCircle,
  MessageCircle,
  FileSignature,
  FileSearch,
  Receipt,
  ChevronDown,
  Pen,
  Trash2,
  Info,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRequestDetail } from '../api/requests.api';
import { getRequestQuotes } from '../api/quotes.api';
import { getReport } from '../api/inspection.api';
import { getInvoice, deleteInvoice } from '../api/invoice.api';
import { getRoom, getMessages } from '../api/chat.api';
import {
  REQUEST_STATUS_COLORS,
  QUOTE_STATUS_COLORS,
  UPDATABLE_STATUSES,
} from '../utils/constants';
import { formatDate, formatCurrency, formatPhone, formatDateTime, timeAgo } from '../utils/formatters';
import { useRequestWebSocket } from '../hooks/useRequestWebSocket';
import { useCallStore } from '../stores/callStore';
import QuoteForm from '../components/QuoteForm';
import InspectionReportForm from '../components/InspectionReportForm';
import InvoiceForm from '../components/InvoiceForm';
import StatusUpdateModal from '../components/StatusUpdateModal';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';

type DetailTab = 'quotes' | 'inspection' | 'invoice' | 'chat';

export default function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const timelineEvents = [
    { status: 'pending', icon: ClipboardList, label: t('pages.requests.detail.steps.created') },
    { status: 'quoted', icon: FileText, label: t('pages.requests.detail.steps.quoted') },
    { status: 'accepted', icon: CheckCircle2, label: t('pages.requests.detail.steps.accepted') },
    { status: 'in_progress', icon: Clock, label: t('pages.requests.detail.steps.inProgress') },
    { status: 'awaiting_payment', icon: Receipt, label: t('constants.requestStatuses.awaiting_payment') },
    { status: 'completed', icon: CheckCircle2, label: t('pages.requests.detail.steps.completed') },
  ];
  const [activeTab, setActiveTab] = useState<DetailTab>('chat');
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const handleEvent = useCallback((eventType: string, payload: any) => {
    queryClient.invalidateQueries({ queryKey: ['request-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['request-quotes', id] });
    queryClient.invalidateQueries({ queryKey: ['inspection-report', id] });
    queryClient.invalidateQueries({ queryKey: ['invoice', id] });
  }, [id, queryClient]);

  useRequestWebSocket(id, handleEvent);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['request-detail', id],
    queryFn: () => getRequestDetail(id!),
    enabled: !!id,
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['request-quotes', id],
    queryFn: () => getRequestQuotes(id!),
    enabled: !!id,
  });

  const { data: report } = useQuery({
    queryKey: ['inspection-report', id],
    queryFn: () => getReport(id!),
    enabled: !!id && !!request?.hasReport,
  });

  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!).catch(() => null),
    enabled: !!id,
  });

  const getDetailTabs = () => {
    const tabs: { id: DetailTab; label: string; icon: any }[] = [];
    if (request?.status === 'pending' || request?.status === 'quoted') {
      tabs.push({ id: 'quotes', label: t('pages.requests.detail.tabs.quotes'), icon: FileSignature });
    }
    if (request?.status === 'accepted' || request?.status === 'in_progress' || request?.hasReport) {
      tabs.push({ id: 'inspection', label: t('pages.requests.detail.tabs.inspection'), icon: FileSearch });
    }
    if (request?.status === 'awaiting_payment' || request?.status === 'completed' || (invoice && (invoice.status === 'rejected' || invoice.status === 'pending_approval' || invoice.status === 'approved' || invoice.status === 'paid'))) {
      tabs.push({ id: 'invoice', label: t('pages.requests.detail.tabs.invoice'), icon: Receipt });
    }
    tabs.push({ id: 'chat', label: t('pages.requests.detail.tabs.chat'), icon: MessageCircle });
    return tabs;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
        <Skeleton variant="text" width="40%" height={32} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton variant="card" height={200} />
            <Skeleton variant="card" height={300} />
          </div>
          <div className="space-y-6">
            <Skeleton variant="card" height={200} />
            <Skeleton variant="card" height={200} />
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
          <XCircle size={40} className="text-surface-400" />
        </div>
        <p className="text-surface-500 dark:text-surface-400 font-semibold">{t('pages.requests.detail.notFound')}</p>
        <Link to="/requests" className="text-primary-600 dark:text-primary-400 mt-3 inline-block font-semibold hover:underline">
          {t('pages.requests.detail.backToRequests')}
        </Link>
      </div>
    );
  }

  const currentStatusIndex = timelineEvents.findIndex((e) => e.status === request.status);
  const canUpdate = UPDATABLE_STATUSES.includes(request.status);
  const detailTabs = getDetailTabs();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 animate-fade-in">
        <Link to="/requests" className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
          <ArrowRight size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t('pages.requests.detail.requestDetails')}</h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">{t('pages.requests.detail.serviceRequest')} {request.service}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${REQUEST_STATUS_COLORS[request.status] || 'bg-surface-100 text-surface-600'}`}>
          {t('constants.requestStatuses.' + request.status, request.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.requests.detail.customerVehicle')}</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <Avatar name={request.customer?.name} size="md" />
                    <div>
                      <p className="text-xs text-surface-400">{t('pages.requests.detail.customer')}</p>
                      <p className="font-semibold text-surface-800 dark:text-surface-200">{request.customer?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center">
                      <Phone size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-surface-400">{t('pages.requests.detail.phone')}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-surface-800 dark:text-surface-200" dir="ltr">{formatPhone(request.customer?.phone)}</span>
                        <button
                          onClick={() => {
                            if (request.customer?.id) {
                              useCallStore.setState({ peerId: Number(request.customer.id), peerName: request.customer.name || '', peerRole: 'customer', status: 'idle' });
                              // Trigger VoIP call via the global call signaling
                              document.dispatchEvent(new CustomEvent('voip-call', { detail: { calleeId: request.customer.id, calleeName: request.customer.name || '' } }));
                            }
                          }}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="مكالمة صوتية"
                        >
                          <PhoneCall size={14} />
                        </button>
                        <a href={`tel:${request.customer?.phone}`} className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                          <Phone size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                      <Car size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">{t('pages.requests.detail.vehicle')}</p>
                      <p className="font-semibold text-surface-800 dark:text-surface-200">{request.car?.make} {request.car?.model} ({request.car?.year})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                      <MapPin size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-surface-400">{t('pages.requests.detail.location')}</p>
                      <p className="font-semibold text-surface-800 dark:text-surface-200">{request.location}</p>
                      <p className="text-xs text-surface-400">{request.city}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.requests.detail.serviceDescription')}</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-primary-50 text-primary-700">
                  {request.service}
                </span>
                <span className="text-xs text-surface-400 flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(request.createdAt)}
                </span>
              </div>
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{request.description}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <h2 className="font-bold text-surface-900 dark:text-surface-100">{t('pages.requests.detail.requestStatus')}</h2>
              <span className="text-xs text-surface-400">{timeAgo(request.updatedAt || request.createdAt)}</span>
            </div>
            <div className="p-5">
              <div className="relative pr-8">
                {timelineEvents.map((event, idx) => {
                  const isCompleted = idx <= currentStatusIndex;
                  const isCurrent = idx === currentStatusIndex;
                  return (
                    <div key={event.status} className="relative pb-6 last:pb-0">
                      {idx < timelineEvents.length - 1 && (
                        <div className={`absolute right-[11px] top-5 w-0.5 h-full -translate-x-1/2 ${
                          idx < currentStatusIndex ? 'bg-primary-500' : 'bg-surface-200'
                        }`} />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-primary-500 text-white shadow-md' : 'bg-surface-200 text-surface-400'
                        } ${isCurrent ? 'ring-2 ring-primary-300 ring-offset-2' : ''}`}>
                          <event.icon size={12} />
                        </div>
                        <div className="pt-0.5">
                          <p className={`text-sm font-semibold ${isCompleted ? 'text-surface-800' : 'text-surface-400'}`}>
                            {event.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-surface-100 dark:border-surface-800">
                {!request.hasQuote && request.status === 'pending' && (
                  <button onClick={() => setShowQuoteForm(true)} className="btn-primary">
                    <FileSignature size={18} />
                    {t('pages.requests.submitQuote')}
                  </button>
                )}
                {canUpdate && (
                  <>
                    <button onClick={() => setShowStatusModal(true)} className="btn-secondary">
                      <Clock size={18} />
                      {t('pages.requests.updateStatus')}
                    </button>
                    <button onClick={() => setShowInspectionForm(true)} className="btn-accent">
                      <FileSearch size={18} />
                      {t('pages.requests.inspectionReport')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="border-b border-surface-100 dark:border-surface-800">
              <div className="flex overflow-x-auto scrollbar-hide">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-500'
                        : 'border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {activeTab === 'quotes' && (
                <div className="space-y-4">
                  {quotes.length === 0 && (
                    <p className="text-center text-surface-400 py-8">{t('pages.requests.detail.noQuotes')}</p>
                  )}
                  {quotes.map((quote) => (
                    <div key={quote.id} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-surface-800 dark:text-surface-200">{formatCurrency(quote.price)}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${QUOTE_STATUS_COLORS[quote.status]}`}>
                          {t('constants.quoteStatuses.' + quote.status, quote.status)}
                        </span>
                      </div>
                      {quote.notes && <p className="text-sm text-surface-500 mb-2">{quote.notes}</p>}
                      <p className="text-xs text-surface-400">{formatDateTime(quote.createdAt)}</p>
                    </div>
                  ))}
                  {(request.status === 'pending') && (
                    <button onClick={() => setShowQuoteForm(true)} className="btn-primary w-full">
                      {t('pages.requests.detail.addQuote')}
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'inspection' && (
                <div>
                  {report ? (
                    <div className="space-y-4">
                      {report.notes && (
                        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
                          <p className="text-sm text-surface-600">{report.notes}</p>
                        </div>
                      )}
                      {report.parts.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-surface-700 mb-2">{t('pages.requests.detail.inspection.parts')}</p>
                          <div className="space-y-2">
                            {report.parts.map((p, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                <span className="text-sm text-surface-600">{p.name} x{p.quantity}</span>
                                <span className="text-sm font-semibold text-surface-800">{formatCurrency(p.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {report.labor.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-surface-700 mb-2">{t('pages.requests.detail.inspection.labor')}</p>
                          <div className="space-y-2">
                            {report.labor.map((l, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                                <span className="text-sm text-surface-600">{l.description} ({l.hours}h)</span>
                                <span className="text-sm font-semibold text-surface-800">{formatCurrency(l.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-primary-50 border border-primary-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">{t('pages.requests.detail.inspection.tax')} ({report.taxPercent}%)</span>
                          <span className="font-semibold">{formatCurrency(report.grandTotal - report.parts.reduce((s: number, p: any) => s + p.total, 0) - report.labor.reduce((s: number, l: any) => s + l.total, 0))}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-primary-200">
                          <span>{t('pages.requests.detail.inspection.total')}</span>
                          <span className="text-primary-600 dark:text-primary-400">{formatCurrency(report.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-surface-400 py-8">{t('pages.requests.detail.inspection.notReady')}</p>
                  )}
                </div>
              )}

              {activeTab === 'invoice' && (
                <div>
                  {invoice ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">{t('pages.requests.detail.invoice.subtotal')}</span>
                          <span className="font-semibold">{formatCurrency(invoice.partsTotal + invoice.laborTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-surface-500">{t('pages.requests.detail.invoice.tax')} ({invoice.taxPercent}%)</span>
                          <span className="font-semibold">{formatCurrency(invoice.taxAmount ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-surface-200">
                          <span>{t('pages.requests.detail.invoice.total')}</span>
                          <span className="text-primary-600 dark:text-primary-400">{formatCurrency(invoice.grandTotal)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-surface-400">{formatDateTime(invoice.createdAt)}</p>
                      {(invoice.status === 'pending_approval' || invoice.status === 'rejected') && (
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setShowInvoiceForm(true)} className="btn-primary flex-1">
                            <Pen size={16} /> {t('pages.requests.detail.invoice.editInvoice')}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(t('pages.requests.detail.invoice.deleteConfirm'))) {
                                try {
                                  await deleteInvoice(request.id);
                                  toast.success(t('toast.success.invoiceDeleted'));
                                  queryClient.invalidateQueries({ queryKey: ['invoice', id] });
                                  queryClient.invalidateQueries({ queryKey: ['requests'] });
                                } catch {
                                  toast.error(t('toast.error.invoiceDeleteFailed'));
                                }
                              }
                            }}
                            className="btn-danger"
                          >
                            <Trash2 size={16} /> {t('pages.requests.detail.invoice.deleteInvoice')}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (request.status === 'completed' || invoice === null) ? (
                    <div className="text-center py-8">
                      <Receipt size={40} className="text-surface-300 mx-auto mb-3" />
                      <p className="text-surface-500 mb-4">{t('pages.requests.detail.invoice.notCreated')}</p>
                      <button onClick={() => setShowInvoiceForm(true)} className="btn-primary">
                        {t('pages.requests.detail.invoice.createInvoice')}
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-surface-400 py-8">{t('pages.requests.detail.invoice.notAvailable')}</p>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <button onClick={() => navigate(`/requests/${request.id}/chat?customerName=${encodeURIComponent(request.customerName || 'العميل')}`)} className="flex w-full items-center justify-between rounded-2xl border border-primary-200 bg-primary-50/40 p-5 text-right transition hover:border-primary-400 dark:border-primary-500/20 dark:bg-primary-500/5">
                  <span><span className="block font-black">تواصل مع العميل</span><span className="mt-1 block text-xs text-surface-500">{request.customerName || 'العميل'}</span></span><MessageCircle className="text-primary-600" size={24}/>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
            <div className="p-4 border-b border-surface-100 dark:border-surface-800">
              <h3 className="font-bold text-surface-800 dark:text-surface-200">{t('pages.requests.detail.location')}</h3>
            </div>
            <div className="p-4">
              <div className="bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700 h-36 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={36} className="text-surface-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-surface-600 dark:text-surface-300">{request.location}</p>
                  <p className="text-xs text-surface-400">{request.city}</p>
                </div>
              </div>
            </div>
          </div>

          {quotes.length > 0 && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="p-4 border-b border-surface-100 dark:border-surface-800">
                <h3 className="font-bold text-surface-800 dark:text-surface-200">{t('pages.requests.detail.tabs.quotes')}</h3>
              </div>
              <div className="p-4 space-y-3">
                {quotes.map((quote) => (
                  <div key={quote.id} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-surface-800 dark:text-surface-200">{formatCurrency(quote.price)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${QUOTE_STATUS_COLORS[quote.status]}`}>
                        {t('constants.quoteStatuses.' + quote.status, quote.status)}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400">{formatDateTime(quote.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="p-4 border-b border-surface-100 dark:border-surface-800">
                <h3 className="font-bold text-surface-800 dark:text-surface-200">{t('pages.requests.detail.tabs.invoice')}</h3>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-400">{t('pages.requests.detail.invoice.subtotal')}</span>
                  <span>{formatCurrency(invoice.partsTotal + invoice.laborTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-400">{t('pages.requests.detail.invoice.tax')} ({invoice.taxPercent}%)</span>
                  <span>{formatCurrency(invoice.taxAmount ?? 0)}</span>
                </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-surface-200 dark:border-surface-700">
                  <span>{t('pages.requests.detail.invoice.total')}</span>
                  <span className="text-primary-600">{formatCurrency(invoice.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {report && (
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="p-4 border-b border-surface-100 dark:border-surface-800">
                <h3 className="font-bold text-surface-800 dark:text-surface-200">{t('pages.requests.detail.tabs.inspection')}</h3>
              </div>
              <div className="p-4 text-sm">
                {report.notes && <p className="text-surface-600 mb-3">{report.notes}</p>}
                {report.parts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-surface-500 mb-1">{t('pages.requests.detail.inspection.parts')}</p>
                    {report.parts.map((p, i) => (
                      <div key={i} className="flex justify-between text-xs text-surface-600 py-1">
                        <span>{p.name} x{p.quantity}</span>
                        <span>{formatCurrency(p.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {report.labor.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-surface-500 mb-1">{t('pages.requests.detail.inspection.labor')}</p>
                    {report.labor.map((l, i) => (
                      <div key={i} className="flex justify-between text-xs text-surface-600 py-1">
                        <span>{l.description} ({l.hours}h)</span>
                        <span>{formatCurrency(l.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-surface-200 mt-2">
                  <span>{t('pages.requests.detail.inspection.total')}</span>
                  <span className="text-primary-600">{formatCurrency(report.grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQuoteForm && (
        <QuoteForm requestId={request.id} onClose={() => setShowQuoteForm(false)} serviceTypes={request.serviceTypes} />
      )}
      {showInspectionForm && (
        <InspectionReportForm requestId={request.id} onClose={() => setShowInspectionForm(false)} />
      )}
      {showInvoiceForm && (
        <InvoiceForm
          requestId={request.id}
          defaultItems={
            invoice
              ? invoice.items.map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice }))
              : [
                  ...(report?.parts || []).map((p: any) => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice })),
                  ...(report?.labor || []).map((l: any) => ({ name: l.description, quantity: Math.ceil(l.hours), unitPrice: l.hourlyRate })),
                ]
          }
          defaultTaxPercent={invoice ? (invoice.taxPercent || 15) : (report?.taxPercent || 15)}
          onClose={() => setShowInvoiceForm(false)}
        />
      )}
      {showStatusModal && (
        <StatusUpdateModal
          requestId={request.id}
          currentStatus={request.status}
          onClose={() => setShowStatusModal(false)}
        />
      )}
    </div>
  );
}


