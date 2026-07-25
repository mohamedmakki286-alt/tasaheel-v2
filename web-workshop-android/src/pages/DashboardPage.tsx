import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Banknote, CalendarCheck2, Car, CheckCircle2, ChevronLeft,
  ClipboardList, Clock3, FileText, MessageCircle, Receipt, Sparkles,
  Star, UserRoundCheck, WalletCards, Wrench,
} from 'lucide-react';
import { getMyRequests, getNewRequests } from '../api/requests.api';
import { getMyQuotes } from '../api/quotes.api';
import { getMyReviews } from '../api/reviews.api';
import { getFinancialStats } from '../api/finance.api';
import { useAuthStore } from '../stores/authStore';
import { formatCurrency, parseApiDate, timeAgo } from '../utils/formatters';
import Avatar from '../components/Avatar';
import Skeleton from '../components/Skeleton';

const statusLabel: Record<string, string> = {
  pending: 'بانتظار العرض',
  quoted: 'تم إرسال العرض',
  accepted: 'مقبول',
  assigned: 'تم إسناد الفني',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  quoted: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  accepted: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  assigned: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  in_progress: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const workshop = useAuthStore((state) => state.workshop);

  const { data: newRequests = [], isLoading: loadingNew } = useQuery({
    queryKey: ['new-requests'],
    queryFn: getNewRequests,
  });
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: getMyRequests,
  });
  const { data: quotes = [] } = useQuery({
    queryKey: ['my-quotes'],
    queryFn: getMyQuotes,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', workshop?.id],
    queryFn: () => getMyReviews(workshop?.id),
    enabled: Boolean(workshop?.id),
  });
  const { data: finance } = useQuery({
    queryKey: ['financial-stats'],
    queryFn: getFinancialStats,
  });

  const recentRequests = useMemo(() => Array.from(
    new Map([...newRequests, ...requests].map((request) => [request.id, request])).values()
  ).sort((a, b) => parseApiDate(b.createdAt).getTime() - parseApiDate(a.createdAt).getTime()).slice(0, 5), [newRequests, requests]);

  const activeRequests = requests.filter((request) => !['completed', 'cancelled'].includes(request.status)).length;
  const awaitingAssignment = requests.filter((request) => request.status === 'accepted' && !request.technicianId).length;
  const pendingQuotes = quotes.filter((quote) => quote.status === 'pending').length;
  const completedThisMonth = workshop?.completedJobs || requests.filter((request) => request.status === 'completed').length;
  const attentionTotal = newRequests.length + awaitingAssignment + pendingQuotes;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير';

  const customerName = (request: any) => request.customer?.name || request.customerName || 'عميل تساهيل';
  const serviceName = (request: any) => request.service || request.serviceTypeName || 'خدمة صيانة';
  const carName = (request: any) => {
    const make = request.car?.make || request.carMake;
    const model = request.car?.model || request.carModel;
    return [make, model].filter(Boolean).join(' ') || 'المركبة غير محددة';
  };

  return (
    <div className="space-y-5 pb-8 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-primary-100 bg-white p-5 shadow-sm dark:border-primary-900/40 dark:bg-surface-900 sm:p-7">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-primary-50 via-primary-50/40 to-transparent dark:from-primary-950/30" />
        <div className="absolute -left-12 -top-20 h-48 w-48 rounded-full bg-primary-100/60 blur-3xl dark:bg-primary-900/20" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
              <Sparkles size={16} /> {greeting}
            </p>
            <h1 className="text-2xl font-black text-surface-950 dark:text-white sm:text-3xl">{workshop?.name || 'ورشتك'}</h1>
            <p className="mt-2 text-sm text-surface-500">كل ما يحتاج قرارك اليوم، في مكان واحد.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> الورشة متصلة
            </span>
            <button onClick={() => navigate('/requests')} className="btn-primary min-h-11 gap-2 px-5">
              إدارة الطلبات <ArrowLeft size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'طلبات جديدة', value: newRequests.length, note: 'تحتاج عرض سعر', icon: ClipboardList, color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300', path: '/requests' },
          { label: 'قيد التنفيذ', value: activeRequests, note: 'طلبات نشطة', icon: Wrench, color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-300', path: '/requests' },
          { label: 'مكتمل', value: completedThisMonth, note: 'إجمالي المنجز', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300', path: '/requests' },
          { label: 'تقييم العملاء', value: Number(workshop?.rating || 0).toFixed(1), note: `${reviews.length} تقييم`, icon: Star, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300', path: '/reviews' },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} className="group rounded-2xl border border-surface-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md dark:border-surface-800 dark:bg-surface-900 dark:hover:border-primary-900 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${item.color}`}><item.icon size={21} /></span>
              <ChevronLeft size={17} className="mt-1 text-surface-300 transition group-hover:-translate-x-1 group-hover:text-primary-500" />
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              <div><p className="text-xs font-semibold text-surface-500 sm:text-sm">{item.label}</p><p className="mt-0.5 text-[11px] text-surface-400">{item.note}</p></div>
              <strong className="text-2xl font-black text-surface-950 dark:text-white sm:text-3xl">{item.value}</strong>
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <div className="flex items-center justify-between border-b border-surface-100 px-4 py-4 dark:border-surface-800 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 font-black text-surface-950 dark:text-white"><Clock3 size={19} className="text-primary-500" /> أحدث الطلبات</h2>
              <p className="mt-1 text-xs text-surface-400">مرتبة حسب وقت وصول الطلب الفعلي</p>
            </div>
            <button onClick={() => navigate('/requests')} className="text-sm font-bold text-primary-600 hover:text-primary-700">عرض الكل</button>
          </div>
          <div className="p-2 sm:p-3">
            {loadingNew || loadingRequests ? (
              <div className="space-y-2 p-2">{[1, 2, 3].map((item) => <Skeleton key={item} variant="card" height={82} />)}</div>
            ) : recentRequests.length === 0 ? (
              <div className="py-16 text-center"><ClipboardList className="mx-auto text-surface-300" size={36} /><p className="mt-3 font-bold">لا توجد طلبات حالياً</p></div>
            ) : recentRequests.map((request) => (
              <button key={request.id} onClick={() => navigate(`/requests/${request.id}`)} className="group flex w-full items-center gap-3 rounded-2xl p-3 text-right transition hover:bg-surface-50 dark:hover:bg-surface-800/70 sm:p-4">
                <Avatar name={customerName(request)} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold text-surface-900 dark:text-white">{customerName(request)}</p>
                    <span className="text-xs font-semibold text-surface-400">#{request.id}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-surface-500"><Wrench size={12} /> {serviceName(request)} <span>•</span> <Car size={12} /> {carName(request)}</p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="mb-1.5 text-[11px] text-surface-400">{timeAgo(request.createdAt)}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[request.status] || statusStyle.pending}`}>{statusLabel[request.status] || 'قيد المراجعة'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-surface-200 bg-surface-950 p-5 text-white shadow-sm dark:border-surface-800 dark:bg-black sm:p-6">
          <div className="flex items-start justify-between">
            <div><p className="text-xs font-bold text-white/50">قائمة العمل الآن</p><h2 className="mt-1 text-xl font-black">تحتاج انتباهك</h2></div>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-primary-600 px-2 text-lg font-black">{attentionTotal}</span>
          </div>
          <div className="mt-5 space-y-2">
            {[
              { title: 'تسعير طلبات جديدة', count: newRequests.length, icon: FileText, path: '/requests' },
              { title: 'متابعة عروض العملاء', count: pendingQuotes, icon: MessageCircle, path: '/quotes' },
              { title: 'إسناد فني للطلبات', count: awaitingAssignment, icon: UserRoundCheck, path: '/requests' },
            ].map((item) => (
              <button key={item.title} onClick={() => navigate(item.path)} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 text-right transition hover:bg-white/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-primary-300"><item.icon size={18} /></span>
                <span className="flex-1 text-sm font-bold">{item.title}</span>
                <strong className="text-lg">{item.count}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="flex items-center gap-2 font-black text-surface-950 dark:text-white"><WalletCards size={19} className="text-primary-500" /> الملخص المالي</h2><p className="mt-1 text-xs text-surface-400">نظرة سريعة على الفواتير والتحصيل</p></div>
            <button onClick={() => navigate('/invoices')} className="rounded-xl border border-surface-200 px-3 py-2 text-xs font-bold dark:border-surface-700">التفاصيل</button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'الإيرادات', value: formatCurrency(finance?.totalRevenue || 0), icon: Banknote },
              { label: 'الفواتير', value: finance?.totalInvoices || 0, icon: Receipt },
              { label: 'المدفوعة', value: finance?.paidCount || 0, icon: CalendarCheck2 },
              { label: 'قيد التحصيل', value: formatCurrency(finance?.pendingAmount || 0), icon: Clock3 },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-surface-50 p-3.5 dark:bg-surface-800/60">
                <item.icon size={18} className="mb-3 text-primary-500" />
                <p className="text-[11px] font-semibold text-surface-400">{item.label}</p>
                <p className="mt-1 text-base font-black text-surface-900 dark:text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900 sm:p-6">
          <div className="flex items-center justify-between">
            <div><h2 className="font-black text-surface-950 dark:text-white">جودة الخدمة</h2><p className="mt-1 text-xs text-surface-400">رضا العملاء عن الورشة</p></div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10"><Star size={22} fill="currentColor" /></span>
          </div>
          <div className="mt-5 flex items-end gap-2"><strong className="text-4xl font-black">{Number(workshop?.rating || 0).toFixed(1)}</strong><span className="pb-1 text-sm text-surface-400">من 5</span></div>
          <div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} className={star <= Math.round(Number(workshop?.rating || 0)) ? 'fill-amber-400 text-amber-400' : 'text-surface-200 dark:text-surface-700'} />)}</div>
          <button onClick={() => navigate('/reviews')} className="mt-5 flex w-full items-center justify-between rounded-xl bg-surface-50 px-3 py-3 text-sm font-bold dark:bg-surface-800"><span>{reviews.length} تقييم عميل</span><ChevronLeft size={17} /></button>
        </div>
      </section>
    </div>
  );
}
