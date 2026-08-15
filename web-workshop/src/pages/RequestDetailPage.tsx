import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, Building2, CalendarClock, Car, Check, CheckCircle2,
  ChevronDown, ClipboardCheck, ClipboardList, Clock3, ExternalLink, FileCheck2,
  FileSignature, Image, MapPin, MessageCircle, MoreHorizontal, Pencil, Phone, Download,
  PhoneCall, Receipt, Send, Trash2, UserRoundCog, Wrench, XCircle,
} from 'lucide-react';
import { getRequestDetail } from '../api/requests.api';
import { getRequestQuotes } from '../api/quotes.api';
import { getReport } from '../api/inspection.api';
import { deleteInvoice, getInvoice } from '../api/invoice.api';
import { assignTechnician, getTechnicians, unassignTechnician } from '../api/technicians.api';
import { REQUEST_STATUS_COLORS, UPDATABLE_STATUSES } from '../utils/constants';
import { formatCurrency, formatDateTime, formatPhone, timeAgo } from '../utils/formatters';
import { useRequestWebSocket } from '../hooks/useRequestWebSocket';
import { googleMapsDirectionsUrl, openExternalUrl } from '../utils/externalNavigation';
import QuoteForm from '../components/QuoteForm';
import InspectionReportForm from '../components/InspectionReportForm';
import InvoiceForm from '../components/InvoiceForm';
import StatusUpdateModal from '../components/StatusUpdateModal';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';

const brandedDocuments = () => import('../utils/brandedDocuments');

type WorkDocument = 'quote' | 'inspection' | 'invoice';

const statusLabelsAr: Record<string, string> = {
  pending: 'بانتظار عرض السعر',
  quoted: 'بانتظار قبول العرض',
  accepted: 'بانتظار إسناد الفني',
  inspection_report: 'بانتظار اعتماد الفحص',
  customer_approved: 'جاهز لبدء التنفيذ',
  in_progress: 'قيد التنفيذ',
  awaiting_payment: 'بانتظار دفع الفاتورة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const journeyAr = [
  { status: 'pending', label: 'إنشاء الطلب' },
  { status: 'quoted', label: 'عرض السعر' },
  { status: 'accepted', label: 'قبول العرض' },
  { status: 'inspection_report', label: 'تقرير الفحص' },
  { status: 'customer_approved', label: 'اعتماد العميل' },
  { status: 'in_progress', label: 'التنفيذ' },
  { status: 'awaiting_payment', label: 'الفاتورة والدفع' },
  { status: 'completed', label: 'الإغلاق' },
];

export default function RequestDetailPage() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language.startsWith('en');
  const tr = (arabic: string, english: string) => isEnglish ? english : arabic;
  const statusLabels: Record<string, string> = isEnglish ? {
    pending: 'Awaiting quote', quoted: 'Awaiting quote acceptance', accepted: 'Awaiting technician assignment',
    inspection_report: 'Awaiting inspection approval', customer_approved: 'Ready to start', in_progress: 'In progress',
    awaiting_payment: 'Awaiting invoice payment', completed: 'Completed', cancelled: 'Cancelled',
  } : statusLabelsAr;
  const journey = isEnglish ? [
    { status: 'pending', label: 'Request created' }, { status: 'quoted', label: 'Quote' },
    { status: 'accepted', label: 'Quote accepted' }, { status: 'inspection_report', label: 'Inspection report' },
    { status: 'customer_approved', label: 'Customer approval' }, { status: 'in_progress', label: 'Service execution' },
    { status: 'awaiting_payment', label: 'Invoice and payment' }, { status: 'completed', label: 'Closed' },
  ] : journeyAr;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openDocument, setOpenDocument] = useState<WorkDocument | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTechnicianActions, setShowTechnicianActions] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const refreshRequest = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['request-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['request-quotes', id] });
    queryClient.invalidateQueries({ queryKey: ['inspection-report', id] });
    queryClient.invalidateQueries({ queryKey: ['invoice', id] });
  }, [id, queryClient]);

  useRequestWebSocket(id, refreshRequest);

  const { data: request, isLoading } = useQuery({
    queryKey: ['request-detail', id],
    queryFn: () => getRequestDetail(id!),
    enabled: Boolean(id),
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ['request-quotes', id],
    queryFn: () => getRequestQuotes(id!),
    enabled: Boolean(id),
  });
  const { data: report } = useQuery({
    queryKey: ['inspection-report', id],
    queryFn: () => getReport(id!),
    enabled: Boolean(id && request?.hasReport),
  });
  const { data: invoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!).catch(() => null),
    enabled: Boolean(id),
  });
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: getTechnicians,
  });

  const assignMutation = useMutation({
    mutationFn: (technicianId: number) => assignTechnician(id!, technicianId),
    onSuccess: () => {
      toast.success(tr('تم إسناد الفني بنجاح', 'Technician assigned successfully'));
      setShowTechnicianActions(false);
      refreshRequest();
    },
    onError: () => toast.error(tr('فشل إسناد الفني', 'Failed to assign technician')),
  });
  const unassignMutation = useMutation({
    mutationFn: () => unassignTechnician(id!),
    onSuccess: () => {
      toast.success(tr('تم إلغاء إسناد الفني', 'Technician assignment removed'));
      setShowTechnicianActions(false);
      refreshRequest();
    },
    onError: () => toast.error(tr('فشل إلغاء الإسناد', 'Failed to remove assignment')),
  });

  const currentIndex = Math.max(journey.findIndex((item) => item.status === request?.status), 0);
  const progress = Math.max(((currentIndex + 1) / journey.length) * 100, 8);
  const latestQuote = quotes[0];
  const canUpdate = request ? UPDATABLE_STATUSES.includes(request.status) : false;
  const customerName = request?.customer?.name || request?.customerName || tr('عميل تساهيل', 'Tasaheel customer');
  const customerPhone = request?.customer?.phone || '';
  const carName = [request?.car?.make, request?.car?.model, request?.car?.year && `(${request.car.year})`].filter(Boolean).join(' ');
  const availableTechnicians = technicians.filter((technician) => technician.availabilityStatus === 'available' || technician.id === request?.technicianId);

  const documentState = useMemo(() => {
    const quoteComplete = Boolean(latestQuote);
    const reportComplete = Boolean(report || request?.hasReport);
    const invoiceComplete = Boolean(invoice);
    return {
      quote: {
        complete: quoteComplete,
        current: request?.status === 'pending' || request?.status === 'quoted',
        badge: latestQuote ? (latestQuote.status === 'accepted' ? tr('مقبول', 'Accepted') : latestQuote.status === 'rejected' ? tr('مرفوض', 'Rejected') : tr('مرسل', 'Sent')) : tr('مطلوب', 'Required'),
      },
      inspection: {
        complete: reportComplete,
        current: ['accepted', 'inspection_report', 'customer_approved'].includes(request?.status || ''),
        badge: reportComplete ? tr('جاهز', 'Ready') : ['accepted', 'inspection_report'].includes(request?.status || '') ? tr('مطلوب', 'Required') : tr('لاحقاً', 'Later'),
      },
      invoice: {
        complete: invoiceComplete,
        current: ['awaiting_payment', 'completed'].includes(request?.status || ''),
        badge: invoice ? (invoice.status === 'paid' ? tr('مدفوعة', 'Paid') : invoice.status === 'approved' ? tr('معتمدة', 'Approved') : invoice.status === 'rejected' ? tr('مرفوضة', 'Rejected') : tr('مرسلة', 'Sent')) : tr('لاحقاً', 'Later'),
      },
    };
  }, [invoice, latestQuote, report, request?.hasReport, request?.status]);

  const primaryAction = useMemo(() => {
    if (!request) return null;
    if (request.status === 'pending' && !latestQuote) return { label: tr('إرسال عرض السعر', 'Send quote'), icon: FileSignature, action: () => setShowQuoteForm(true) };
    if (request.status === 'accepted' && !request.technicianId) return { label: tr('إسناد فني', 'Assign technician'), icon: UserRoundCog, action: () => setShowTechnicianActions(true) };
    if (['accepted', 'inspection_report'].includes(request.status) && !request.hasReport) return { label: tr('إنشاء تقرير الفحص', 'Create inspection report'), icon: ClipboardCheck, action: () => setShowInspectionForm(true) };
    if (canUpdate) return { label: tr('تحديث حالة الطلب', 'Update request status'), icon: Clock3, action: () => setShowStatusModal(true) };
    if (request.status === 'awaiting_payment' && !invoice) return { label: tr('إنشاء الفاتورة', 'Create invoice'), icon: Receipt, action: () => setShowInvoiceForm(true) };
    if (invoice) return { label: tr('عرض الفاتورة', 'View invoice'), icon: Receipt, action: () => setOpenDocument('invoice') };
    return null;
  }, [canUpdate, invoice, latestQuote, request]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton variant="card" height={220} />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2"><Skeleton variant="card" height={190} /><Skeleton variant="card" height={360} /></div>
          <Skeleton variant="card" height={260} />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-20 text-center">
        <XCircle size={42} className="mx-auto text-surface-300" />
        <p className="mt-4 font-bold text-surface-600">{tr('تعذر العثور على الطلب', 'Request not found')}</p>
        <Link to="/requests" className="mt-3 inline-block font-bold text-primary-600">{tr('العودة إلى الطلبات', 'Back to requests')}</Link>
      </div>
    );
  }

  const openChat = () => navigate(`/requests/${request.id}/chat?customerName=${encodeURIComponent(customerName)}`);
  const openDocumentPanel = (document: WorkDocument) => setOpenDocument((current) => current === document ? null : document);
  const media = request.media || [];

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-24 lg:pb-8">
      <section className="overflow-hidden rounded-[28px] border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link to="/requests" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-surface-500 transition hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700">
              <ArrowRight size={19} />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400" dir="ltr">{request.requestNumber || `#${request.id}`}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${REQUEST_STATUS_COLORS[request.status] || 'bg-surface-100 text-surface-600'}`}>{statusLabels[request.status] || request.status}</span>
              </div>
              <h1 className="mt-2 truncate text-xl font-black text-surface-950 dark:text-white sm:text-2xl">{request.service || tr('طلب صيانة', 'Maintenance request')}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-surface-400"><span>{customerName}</span><span>•</span><span>{carName || tr('المركبة غير محددة', 'Vehicle not specified')}</span><span>•</span><span>{timeAgo(request.createdAt)}</span></p>
            </div>
          </div>
        </div>
        <div className="border-t border-surface-100 bg-surface-50/70 px-4 py-4 dark:border-surface-800 dark:bg-surface-950/30 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-semibold text-surface-400">{tr('المرحلة الحالية', 'Current stage')}</p><p className="mt-1 text-sm font-black text-surface-900 dark:text-white">{journey[currentIndex]?.label}</p></div>
            <button onClick={() => setShowHistory((value) => !value)} className="text-xs font-bold text-primary-600 dark:text-primary-400">{showHistory ? tr('إخفاء سجل الحالات', 'Hide status history') : tr('عرض سجل الحالات', 'View status history')}</button>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700"><div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-surface-400"><span>{currentIndex + 1} {tr('من', 'of')} {journey.length}</span><span>{Math.round(progress)}%</span></div>
          {showHistory && (
            <div className="mt-4 grid gap-2 border-t border-surface-200 pt-4 dark:border-surface-700 sm:grid-cols-2 lg:grid-cols-4">
              {journey.map((item, index) => (
                <div key={item.status} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${index <= currentIndex ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-white text-surface-400 dark:bg-surface-900'}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${index <= currentIndex ? 'bg-primary-500 text-white' : 'bg-surface-200 dark:bg-surface-700'}`}>{index < currentIndex ? <Check size={11} /> : index + 1}</span>
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
        <main className="space-y-5">
          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-surface-950 dark:text-white">{tr('بيانات العميل', 'Customer details')}</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{tr('متصل', 'Online')}</span></div>
              <div className="flex items-center gap-3"><Avatar name={customerName} size="md" /><div className="min-w-0 flex-1"><p className="truncate font-black">{customerName}</p><p dir="ltr" className="mt-1 w-fit text-xs text-surface-400">{formatPhone(customerPhone)}</p></div></div>
              <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: 'minmax(0, 1fr) 44px' }}>
                <button onClick={openChat} className="btn-primary min-h-10 justify-center gap-2"><MessageCircle size={16} /> {tr('محادثة العميل', 'Chat with customer')}</button>
                {customerPhone ? <a href={`tel:${customerPhone.replace(/[^\d+]/g, '')}`} className="flex min-h-10 items-center justify-center rounded-xl border border-surface-200 bg-surface-50 text-surface-600 transition hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300" aria-label="الاتصال بالعميل"><PhoneCall size={16} /></a> : <span className="flex min-h-10 items-center justify-center rounded-xl border border-surface-200 bg-surface-50 text-surface-300 dark:border-surface-700 dark:bg-surface-800" title="رقم العميل غير متوفر"><PhoneCall size={16} /></span>}
              </div>
            </div>

            <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-surface-950 dark:text-white">{tr('بيانات المركبة', 'Vehicle details')}</h2><Car size={19} className="text-primary-500" /></div>
              <p className="font-black">{carName || tr('غير محددة', 'Not specified')}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"><p className="text-surface-400">{tr('اللوحة', 'Plate')}</p><p className="mt-1 font-bold">{request.car?.plateNumber || '—'}</p></div>
                <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"><p className="text-surface-400">{tr('الممشى', 'Mileage')}</p><p className="mt-1 font-bold">{request.car?.mileage ? `${request.car.mileage.toLocaleString()} ${tr('كم', 'km')}` : '—'}</p></div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-black text-surface-950 dark:text-white">{tr('وصف المشكلة والمرفقات', 'Issue description and attachments')}</h2><p className="mt-1 text-xs text-surface-400">{tr('المعلومات التي أرسلها العميل مع الطلب', 'Information submitted by the customer')}</p></div>{media.length ? <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">{media.length} {tr('مرفق', 'attachments')}</span> : null}</div>
            <p className="mt-4 text-sm leading-7 text-surface-600 dark:text-surface-300">{request.description || tr('لم يضف العميل وصفاً إضافياً.', 'The customer did not add further details.')}</p>
            {media.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((item) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group relative h-28 overflow-hidden rounded-2xl bg-surface-100 dark:bg-surface-800">
                    {item.type === 'image' ? <img src={item.thumbnailUrl || item.url} alt="مرفق الطلب" className="h-full w-full object-cover transition group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Image size={24} className="text-surface-400" /></div>}
                    <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white"><ExternalLink size={13} /></span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="border-b border-surface-100 p-5 dark:border-surface-800"><h2 className="font-black text-surface-950 dark:text-white">{tr('ملف العمل', 'Work file')}</h2><p className="mt-1 text-xs text-surface-400">{tr('عرض السعر، تقرير الفحص، والفاتورة في تسلسل واحد', 'Quote, inspection report, and invoice in one workflow')}</p></div>

            <DocumentRow
              icon={FileCheck2} title={tr('عرض السعر', 'Quote')}
              subtitle={latestQuote ? `${formatCurrency(latestQuote.price)} • ${formatDateTime(latestQuote.createdAt)}` : tr('لم يتم إرسال عرض سعر بعد', 'No quote has been sent yet')}
              badge={documentState.quote.badge} complete={documentState.quote.complete} current={documentState.quote.current}
              open={openDocument === 'quote'} onToggle={() => openDocumentPanel('quote')}
            >
              {latestQuote ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"><span className="text-sm text-surface-500">{tr('قيمة العرض', 'Quote amount')}</span><strong>{formatCurrency(latestQuote.price)}</strong></div>
                  {latestQuote.notes && <p className="text-sm leading-6 text-surface-500">{latestQuote.notes}</p>}
                  <button onClick={() => void brandedDocuments().then(({ exportTableDocument }) => exportTableDocument('عرض سعر', `${latestQuote.quoteNumber || 'عرض سعر'} • ${request.requestNumber || request.id} • ${latestQuote.workshopName || ''}`, ['الخدمة','قيمة العرض','المدة المقدرة','الضمان','ملاحظات'], [[request.serviceTypes?.map((service:any) => service.name).filter(Boolean).join('، ') || 'خدمة صيانة', formatCurrency(latestQuote.price), `${latestQuote.estimatedDays || '—'} يوم`, `${latestQuote.warrantyMonths || 0} شهر`, latestQuote.notes || '—']], `عرض-سعر-${latestQuote.quoteNumber || request.id}`))} className="btn-secondary w-full justify-center"><Download size={15}/> تنزيل عرض السعر PDF</button>
                  {request.status === 'pending' && <button onClick={() => setShowQuoteForm(true)} className="btn-primary w-full justify-center">{tr('إرسال عرض جديد', 'Send new quote')}</button>}
                </div>
              ) : <button onClick={() => setShowQuoteForm(true)} className="btn-primary w-full justify-center"><Send size={16} /> {tr('إنشاء وإرسال العرض', 'Create and send quote')}</button>}
            </DocumentRow>

            <DocumentRow
              icon={ClipboardCheck} title={tr('تقرير الفحص', 'Inspection report')}
              subtitle={report ? `${report.parts?.length || 0} ${tr('قطع', 'parts')} • ${report.labor?.length || 0} ${tr('أعمال', 'jobs')}` : tr('يُنشأ بعد قبول العرض وإسناد الفني', 'Created after quote acceptance and technician assignment')}
              badge={documentState.inspection.badge} complete={documentState.inspection.complete} current={documentState.inspection.current}
              open={openDocument === 'inspection'} onToggle={() => openDocumentPanel('inspection')}
            >
              {report ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"><p className="text-xs text-surface-400">{tr('البنود', 'Items')}</p><p className="mt-1 font-black">{(report.parts?.length || 0) + (report.labor?.length || 0)}</p></div><div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-800/60"><p className="text-xs text-surface-400">{tr('الإجمالي', 'Total')}</p><p className="mt-1 font-black">{formatCurrency(report.grandTotal)}</p></div></div>
                  {report.notes && <p className="text-sm leading-6 text-surface-500">{report.notes}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowInspectionForm(true)} className="btn-secondary justify-center"><Pencil size={15} /> {tr('عرض وتعديل', 'View and edit')}</button>
                    <button onClick={() => void brandedDocuments().then(({ exportInspectionDocument }) => exportInspectionDocument(report, { requestId: request.id, requestNumber: request.requestNumber, workshopName: latestQuote?.workshopName || invoice?.workshopName, customerName, vehicle: carName }))} className="btn-secondary justify-center"><Download size={15} /> PDF</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowInspectionForm(true)} disabled={!['accepted', 'inspection_report', 'customer_approved', 'in_progress'].includes(request.status)} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"><ClipboardCheck size={16} /> {tr('إنشاء تقرير الفحص', 'Create inspection report')}</button>
              )}
            </DocumentRow>

            <DocumentRow
              icon={Receipt} title={tr('الفاتورة والدفع', 'Invoice and payment')}
              subtitle={invoice ? `${tr('فاتورة', 'Invoice')} ${invoice.invoiceNumber || invoice.id} • ${formatCurrency(invoice.grandTotal)}` : tr('تُنشأ من تقرير الفحص المعتمد', 'Created from the approved inspection report')}
              badge={documentState.invoice.badge} complete={documentState.invoice.complete} current={documentState.invoice.current}
              open={openDocument === 'invoice'} onToggle={() => openDocumentPanel('invoice')}
            >
              {invoice ? (
                <div className="space-y-3">
                  <div className="space-y-2 rounded-xl bg-surface-50 p-3 text-sm dark:bg-surface-800/60"><div className="flex justify-between"><span className="text-surface-500">{tr('المجموع', 'Subtotal')}</span><strong>{formatCurrency((invoice.partsTotal || 0) + (invoice.laborTotal || 0))}</strong></div><div className="flex justify-between"><span className="text-surface-500">{tr('الضريبة', 'VAT')}</span><strong>{formatCurrency(invoice.taxAmount || 0)}</strong></div><div className="flex justify-between border-t border-surface-200 pt-2 text-base dark:border-surface-700"><span className="font-bold">{tr('الإجمالي', 'Total')}</span><strong className="text-primary-600">{formatCurrency(invoice.grandTotal)}</strong></div></div>
                  <div className="grid grid-cols-2 gap-2">
                    {(invoice.status === 'pending_approval' || invoice.status === 'rejected') && <button onClick={() => setShowInvoiceForm(true)} className="btn-primary justify-center"><Pencil size={15} /> {tr('تعديل', 'Edit')}</button>}
                    {(invoice.status === 'pending_approval' || invoice.status === 'rejected') && <button onClick={async () => { if (window.confirm(tr('هل تريد حذف الفاتورة؟', 'Delete this invoice?'))) { try { await deleteInvoice(request.id); toast.success(tr('تم حذف الفاتورة', 'Invoice deleted')); refreshRequest(); } catch { toast.error(tr('فشل حذف الفاتورة', 'Failed to delete invoice')); } } }} className="btn-secondary justify-center text-danger-500"><Trash2 size={15} /> {tr('حذف', 'Delete')}</button>}
                  </div>
                  <button onClick={() => void brandedDocuments().then(({ exportInvoiceDocument }) => exportInvoiceDocument(invoice, { requestId: request.id, requestNumber: request.requestNumber, workshopName: invoice.workshopName || latestQuote?.workshopName, customerName, vehicle: carName }))} className="btn-secondary w-full justify-center"><Download size={15} /> {tr('تنزيل الفاتورة PDF', 'Download invoice PDF')}</button>
                </div>
              ) : (
                <button onClick={() => setShowInvoiceForm(true)} disabled={!['awaiting_payment', 'completed'].includes(request.status)} title={!['awaiting_payment', 'completed'].includes(request.status) ? tr('يجب إكمال العمل واعتماد تقرير الفحص أولاً', 'Complete the work and approve the inspection report first') : undefined} className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"><Receipt size={16} /> {tr('إنشاء الفاتورة', 'Create invoice')}</button>
              )}
            </DocumentRow>
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-black text-surface-950 dark:text-white">{tr('الفني المسؤول', 'Assigned technician')}</h2><p className="mt-1 text-xs text-surface-400">{tr('الإسناد والتشغيل', 'Assignment and operations')}</p></div><button onClick={() => setShowTechnicianActions((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-surface-500 dark:border-surface-700" aria-label={tr('إدارة الفني', 'Manage technician')}><MoreHorizontal size={17} /></button></div>
            {request.technicianId ? (
              <div className="flex items-center gap-3"><Avatar name={request.technicianName} size="md" /><div className="min-w-0 flex-1"><p className="truncate font-black">{request.technicianName}</p><p className="mt-1 text-xs text-surface-400">{request.technicianSpecialty || tr('فني صيانة', 'Maintenance technician')} • {tr('مسند للطلب', 'Assigned to request')}</p></div></div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-3 dark:bg-amber-500/10"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"><UserRoundCog size={19} /></span><div><p className="text-sm font-black">{tr('لم يتم إسناد فني', 'No technician assigned')}</p><p className="mt-1 text-xs text-surface-500">{tr('اختر فنياً متاحاً لبدء العمل', 'Select an available technician to start work')}</p></div></div>
            )}
            {showTechnicianActions && (
              <div className="mt-4 space-y-2 border-t border-surface-100 pt-4 dark:border-surface-800">
                <select value="" onChange={(event) => event.target.value && assignMutation.mutate(Number(event.target.value))} className="input w-full" disabled={assignMutation.isPending}>
                  <option value="">{request.technicianId ? tr('تغيير الفني…', 'Change technician…') : tr('اختيار فني…', 'Select technician…')}</option>
                  {availableTechnicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name} — {technician.specialty}</option>)}
                </select>
                {request.technicianId && <button onClick={() => unassignMutation.mutate()} disabled={unassignMutation.isPending} className="btn-secondary w-full justify-center text-danger-500">{tr('إلغاء الإسناد', 'Unassign')}</button>}
              </div>
            )}
            {!showTechnicianActions && <button onClick={() => setShowTechnicianActions(true)} className="btn-secondary mt-4 w-full justify-center"><UserRoundCog size={16} /> {request.technicianId ? tr('تغيير الفني', 'Change technician') : tr('إسناد فني', 'Assign technician')}</button>}
          </section>

          {primaryAction && (
            <section className="rounded-3xl bg-surface-950 p-5 text-white shadow-sm dark:bg-black">
              <p className="text-xs font-bold text-white/50">{tr('الإجراء التالي', 'Next action')}</p>
              <h2 className="mt-2 text-lg font-black">{primaryAction.label}</h2>
              <p className="mt-2 text-xs leading-6 text-white/60">{tr('أكمل هذا الإجراء حتى ينتقل الطلب للمرحلة التالية.', 'Complete this action to move the request to the next stage.')}</p>
              <button onClick={primaryAction.action} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700"><primaryAction.icon size={17} /> {primaryAction.label}</button>
            </section>
          )}

          <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-surface-950 dark:text-white">{tr('الموقع والموعد', 'Location and schedule')}</h2><MapPin size={19} className="text-primary-500" /></div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Building2 size={16} className="text-surface-400" /><span>{request.location || tr('داخل الورشة', 'At the workshop')}</span></div>
              <div className="flex items-center gap-3"><CalendarClock size={16} className="text-surface-400" /><span>{formatDateTime(request.createdAt)}</span></div>
              <div className="flex items-center gap-3"><MapPin size={16} className="text-surface-400" /><span>{request.city || tr('الموقع غير محدد', 'Location not specified')}</span></div>
            </div>
            {request.locationLat != null && request.locationLng != null && request.locationLat !== 0 && request.locationLng !== 0 && <button type="button" onClick={() => void openExternalUrl(googleMapsDirectionsUrl(request.locationLat!, request.locationLng!))} className="btn-secondary mt-4 flex w-full justify-center gap-2"><MapPin size={15} /> {tr('فتح الخريطة', 'Open map')}</button>}
          </section>
        </aside>
      </div>

      {primaryAction && (
        <div className="fixed inset-x-3 bottom-[76px] z-30 lg:hidden">
          <button onClick={primaryAction.action} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 font-bold text-white shadow-xl shadow-primary-600/20"><primaryAction.icon size={18} /> {primaryAction.label}</button>
        </div>
      )}

      {showQuoteForm && <QuoteForm requestId={request.id} onClose={() => setShowQuoteForm(false)} serviceTypes={request.serviceTypes} />}
      {showInspectionForm && <InspectionReportForm requestId={request.id} request={request} existingReport={report} onClose={() => setShowInspectionForm(false)} />}
      {showInvoiceForm && (
        <InvoiceForm
          requestId={request.id}
          defaultItems={invoice ? invoice.items.map((item: any) => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice })) : [
            ...(report?.parts || []).map((part: any) => ({ name: part.name, quantity: part.quantity, unitPrice: part.unitPrice, category: 'part' as const })),
            ...(report?.labor || []).map((labor: any) => ({ name: labor.description, quantity: Math.ceil(labor.hours), unitPrice: labor.hourlyRate, category: 'labor' as const })),
          ]}
          defaultTaxPercent={invoice ? (invoice.taxPercent || 15) : (report?.taxPercent || 15)}
          onClose={() => setShowInvoiceForm(false)}
        />
      )}
      {showStatusModal && <StatusUpdateModal requestId={request.id} currentStatus={request.status} onClose={() => setShowStatusModal(false)} />}
    </div>
  );
}

function DocumentRow({
  icon: Icon, title, subtitle, badge, complete, current, open, onToggle, children,
}: {
  icon: typeof ClipboardList;
  title: string;
  subtitle: string;
  badge: string;
  complete: boolean;
  current: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-surface-100 last:border-b-0 dark:border-surface-800">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-right transition hover:bg-surface-50 dark:hover:bg-surface-800/40 sm:p-5" aria-expanded={open}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${complete ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' : current ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-surface-100 text-surface-400 dark:bg-surface-800'}`}>{complete ? <CheckCircle2 size={19} /> : <Icon size={19} />}</span>
        <span className="min-w-0 flex-1"><strong className="block text-sm text-surface-900 dark:text-white">{title}</strong><span className="mt-1 block truncate text-xs text-surface-400">{subtitle}</span></span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${complete ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : current ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>{badge}</span>
        <ChevronDown size={17} className={`shrink-0 text-surface-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-5 sm:pr-[76px] sm:pl-5">{children}</div>}
    </div>
  );
}
