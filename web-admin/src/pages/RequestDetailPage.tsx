import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Phone, MapPin, Car, FileText, MessageCircle,
  User, Building2, Calendar, CheckCircle2, Circle, Clock,
  Wrench, Shield, Quote, FileSpreadsheet, CreditCard,
  Send, Paperclip, Check, X, Star, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getRequest } from '../api/requests.api';
import { getInspectionReport, approveInspectionReport, rejectInspectionReport } from '../api/inspection.api';
import StatusBadge from '../components/StatusBadge';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { CardSkeleton } from '../components/Skeleton';
import { formatDate, formatDateTime, formatCurrency, formatRelativeTime } from '../utils/formatters';
import { REQUEST_STATUSES } from '../utils/constants';
import Modal from '../components/Modal';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const TABS = ['quotes', 'inspection', 'invoice', 'chat'] as const;
const TAB_ICONS: Record<string, React.ReactNode> = {
  quotes: <Quote className="w-4 h-4" />,
  inspection: <FileSpreadsheet className="w-4 h-4" />,
  invoice: <CreditCard className="w-4 h-4" />,
  chat: <MessageCircle className="w-4 h-4" />,
};

export default function RequestDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('quotes');
  const tabLabels: Record<string, string> = {
    quotes: t('pages.requests.detail.tabs.quotes'),
    inspection: t('pages.requests.detail.tabs.inspection'),
    invoice: t('pages.requests.detail.tabs.invoice'),
    chat: t('pages.requests.detail.tabs.chat'),
  };
  const [chatMessage, setChatMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequest(Number(id)),
    enabled: !!id,
  });

  const { data: inspectionReport, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection-report', id],
    queryFn: () => getInspectionReport(Number(id)),
    enabled: !!id && activeTab === 'inspection',
  });

  const approveInspectionMutation = useMutation({
    mutationFn: (reportId: number) => approveInspectionReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-report'] });
      toast.success(t('toast.success.inspectionApproved'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.inspectionApproveFailed')),
  });

  const rejectInspectionMutation = useMutation({
    mutationFn: (reportId: number) => rejectInspectionReport(reportId, rejectReason || t('pages.requests.detail.rejectInspection.defaultReason')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-report'] });
      toast.success(t('toast.success.inspectionRejected'));
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.inspectionRejectFailed')),
  });

  if (isLoading) return <CardSkeleton count={3} />;
  if (!request) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <FileText className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-500 font-medium">{t('pages.requests.detail.notFound')}</p>
      <Button variant="secondary" onClick={() => navigate('/requests')}>{t('pages.requests.detail.backToRequests')}</Button>
    </div>
  );

  const statusIdx = REQUEST_STATUSES.findIndex((s) => s.value === request.status);
  const activeTabIndex = TABS.indexOf(activeTab as typeof TABS[number]);
  const currentTab = activeTab;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/requests')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>{t('pages.requests.detail.backToRequests')}</span>
      </button>

      <div className="card p-0 overflow-hidden">
        <div className="gradient-primary p-6 lg:p-8 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">{t('pages.requests.detail.requestNumber')}{request.id}</h1>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-white/60">{formatDateTime(request.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                {t('common.print')}
              </Button>
              <Button size="sm">
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
          {[
            { icon: User, label: t('pages.requests.detail.customer'), value: request.customerName, sub: request.customerPhone },
            { icon: Car, label: t('pages.requests.detail.car'), value: `${request.carMake} ${request.carModel}`, sub: `${request.carYear} - ${request.carPlate}` },
            { icon: Building2, label: t('pages.requests.detail.serviceAndWorkshop'), value: request.serviceType, sub: request.workshopName },
          ].map((item) => (
            <div key={item.label} className="bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                  <p className="font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-6">{t('pages.requests.detail.requestStatus')}</h3>
        <div className="relative">
          <div className="absolute top-5 right-[23px] bottom-5 w-0.5 bg-gray-100 hidden md:block" />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-0 overflow-x-auto">
            {REQUEST_STATUSES.map((s, idx) => {
              const isCompleted = idx <= statusIdx;
              const isCurrent = s.value === request.status;
              return (
                <React.Fragment key={s.value}>
                  <div className="flex items-center gap-3 md:flex-col md:items-center md:min-w-[120px] relative">
                    <div className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 relative z-10',
                      isCurrent
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
                        : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-300'
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <div className="md:text-center">
                      <p className={clsx(
                        'text-sm font-medium',
                        isCurrent ? 'text-amber-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                      )}>
                        {t(`constants.statusLabels.${s.value}`)}
                      </p>
                      {isCurrent && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{t('pages.requests.detail.currentStatus')}</p>
                      )}
                    </div>
                  </div>
                  {idx < REQUEST_STATUSES.length - 1 && (
                    <div className={clsx(
                      'hidden md:block flex-1 h-0.5 min-w-[40px]',
                      idx < statusIdx ? 'bg-emerald-400' : 'bg-gray-100'
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {request.description && (
        <div className="card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{t('pages.requests.detail.problemDescription')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{request.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap',
                  activeTab === tab
                    ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                {TAB_ICONS[tab]}
                <span>{tabLabels[tab]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {[1, 2, 3].map((q) => (
                <div key={q} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <Avatar name={`${t('common.workshop')} ${q}`} size="md" />
                    <div>
                      <p className="font-bold text-gray-900">{t('pages.requests.detail.quotes.demoWorkshopName')}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{t('pages.requests.detail.quotes.demoQuoteDesc')}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={q === 1 ? 'success' : q === 2 ? 'warning' : 'gray'}>
                          {q === 1 ? t('pages.requests.detail.quotes.accepted') : q === 2 ? t('pages.requests.detail.quotes.underReview') : t('pages.requests.detail.quotes.rejected')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(1500 + q * 200)}</p>
                    {q === 1 ? (
                      <Badge variant="success">{t('pages.requests.detail.quotes.accepted')}</Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />}>{t('pages.requests.detail.quotes.accept')}</Button>
                        <Button variant="secondary" size="sm" icon={<X className="w-3.5 h-3.5" />}>{t('constants.statusLabels.rejected')}</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inspection' && (
            <div className="space-y-6">
              {inspectionLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : inspectionReport ? (
                <>
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
                    inspectionReport.status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                    inspectionReport.status === 'rejected' ? 'bg-red-50 border-red-100' :
                    'bg-blue-50 border-blue-100'
                  }`}>
                    <Shield className={`w-5 h-5 ${
                      inspectionReport.status === 'approved' ? 'text-emerald-500' :
                      inspectionReport.status === 'rejected' ? 'text-red-500' :
                      'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        {t('pages.requests.detail.inspection.heading')} {formatDate(inspectionReport.createdAt)}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${
                        inspectionReport.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        inspectionReport.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {inspectionReport.status === 'approved' ? t('pages.requests.detail.inspection.approved') :
                         inspectionReport.status === 'rejected' ? t('pages.requests.detail.inspection.rejected') : t('pages.requests.detail.inspection.pendingApproval')}
                      </span>
                    </div>
                  </div>

                  {inspectionReport.rejectionComment && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                      <p className="text-xs font-semibold text-red-700 mb-1">{t('pages.requests.detail.inspection.rejectionReason')}</p>
                      <p className="text-sm text-red-600">{inspectionReport.rejectionComment}</p>
                    </div>
                  )}

                  {inspectionReport.notes && (
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-1">{t('pages.requests.detail.inspection.notes')}</p>
                      <p className="text-sm text-gray-700">{inspectionReport.notes}</p>
                    </div>
                  )}

                  {inspectionReport.parts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">{t('pages.requests.detail.inspection.parts')}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.partName')}</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.quantity')}</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.unitPrice')}</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.total')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {inspectionReport.parts.map((part, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{part.quantity}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(part.unitPrice)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(part.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {inspectionReport.labor.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3">{t('pages.requests.detail.inspection.labor')}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.description')}</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.hours')}</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.hourlyRate')}</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.inspection.total')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {inspectionReport.labor.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.description}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{item.hours}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.hourlyRate)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-gray-100 max-w-xs mr-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('pages.requests.detail.inspection.subtotal')}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(inspectionReport.grandTotal / (1 + inspectionReport.taxPercent / 100))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('pages.requests.detail.inspection.tax')} ({inspectionReport.taxPercent}%)</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(inspectionReport.grandTotal - inspectionReport.grandTotal / (1 + inspectionReport.taxPercent / 100))}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t">
                      <span className="font-bold text-gray-900">{t('pages.requests.detail.inspection.total')}</span>
                      <span className="font-bold text-amber-600">{formatCurrency(inspectionReport.grandTotal)}</span>
                    </div>
                  </div>

                  {inspectionReport.status === 'pending_approval' && (
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                      <Button variant="secondary" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => setShowRejectModal(true)}>
                        {t('pages.requests.detail.inspection.rejectReport')}
                      </Button>
                      <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => approveInspectionMutation.mutate(inspectionReport.id)} isLoading={approveInspectionMutation.isPending}>
                        {t('pages.requests.detail.inspection.approveReport')}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <FileSpreadsheet className="w-12 h-12 text-gray-300" />
                  <p className="text-gray-500 font-medium">{t('pages.requests.detail.inspection.noReport')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center pb-6 border-b border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 gradient-accent rounded-2xl shadow-lg mb-4">
                  <Wrench className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('pages.requests.detail.invoice.companyName')}</h2>
                <p className="text-gray-500">{t('pages.requests.detail.invoice.subtitle')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t('pages.requests.detail.invoice.invoiceNumber')}</p>
                  <p className="font-semibold text-gray-900">INV-{request.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('pages.requests.detail.invoice.date')}</p>
                  <p className="font-semibold text-gray-900">{formatDate(request.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('pages.requests.detail.invoice.customer')}</p>
                  <p className="font-semibold text-gray-900">{request.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('pages.requests.detail.invoice.workshop')}</p>
                  <p className="font-semibold text-gray-900">{request.workshopName}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.invoice.description')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.invoice.quantity')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.invoice.price')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">{t('pages.requests.detail.invoice.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { name: t('pages.requests.detail.invoice.demoItem1'), qty: 1, price: 500 },
                      { name: t('pages.requests.detail.invoice.demoItem2'), qty: 4, price: 45 },
                      { name: t('pages.requests.detail.invoice.demoItem3'), qty: 1, price: 80 },
                    ].map((item) => (
                      <tr key={item.name}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(item.qty * item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pages.requests.detail.invoice.subtotal')}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(760)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('pages.requests.detail.invoice.tax')}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(114)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t">
                  <span className="font-bold text-gray-900">{t('pages.requests.detail.invoice.total')}</span>
                  <span className="font-bold text-amber-600">{formatCurrency(874)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" size="sm">{t('common.print')}</Button>
                <Button variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />}>{t('pages.requests.detail.invoice.confirmPayment')}</Button>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                {[
                  { sender: t('pages.requests.detail.chat.demoCustomerName'), role: t('pages.requests.detail.chat.customer'), msg: t('pages.requests.detail.chat.demoMsg1'), time: t('pages.requests.detail.chat.demoTime1'), isMe: false },
                  { sender: t('pages.requests.detail.chat.you'), role: t('pages.requests.detail.chat.admin'), msg: t('pages.requests.detail.chat.demoMsg2'), time: t('pages.requests.detail.chat.demoTime2'), isMe: true },
                  { sender: t('pages.requests.detail.chat.demoCustomerName'), role: t('pages.requests.detail.chat.customer'), msg: t('pages.requests.detail.chat.demoMsg3'), time: t('pages.requests.detail.chat.demoTime3'), isMe: false },
                ].map((msg, idx) => (
                  <div key={idx} className={clsx('flex', msg.isMe ? 'justify-start' : 'justify-end')}>
                    <div className={clsx(
                      'max-w-[80%] lg:max-w-[60%] rounded-2xl p-4',
                      msg.isMe
                        ? 'bg-amber-500 text-white rounded-br-none'
                        : 'bg-gray-50 text-gray-900 rounded-bl-none'
                    )}>
                      {!msg.isMe && (
                        <p className="text-xs font-semibold text-amber-600 mb-1">{msg.sender}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.msg}</p>
                      <p className={clsx('text-[10px] mt-1', msg.isMe ? 'text-white/60' : 'text-gray-400')}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={t('pages.requests.detail.chat.inputPlaceholder')}
                  className="input-field flex-1"
                />
                <Button size="md" icon={<Send className="w-4 h-4" />} disabled={!chatMessage.trim()}>
                  {t('pages.requests.detail.chat.send')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
        title={t('pages.requests.detail.rejectInspection.title')}
        size="sm"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1">{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => inspectionReport && rejectInspectionMutation.mutate(inspectionReport.id)} isLoading={rejectInspectionMutation.isPending} className="flex-1">{t('common.confirm')}</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center mb-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-red-100">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 mb-3">{t('pages.requests.detail.rejectInspection.message')}</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('pages.requests.detail.rejectInspection.reasonPlaceholder')}
            className="input-field w-full text-sm"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
