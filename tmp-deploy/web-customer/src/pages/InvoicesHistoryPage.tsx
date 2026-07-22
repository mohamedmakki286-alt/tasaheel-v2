import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { invoicesApi } from '../api/invoices.api';
import { FileText, CheckCircle2, Clock, XCircle, Eye, WalletCards } from 'lucide-react';

export default function InvoicesHistoryPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const { data: res, isLoading } = useQuery({
    queryKey: ['customer-invoices', page],
    queryFn: () => invoicesApi.getAll(page),
    refetchInterval: 15000,
  });

  const invoicesData = res?.data?.data || res?.data;
  const invoices = invoicesData?.content || [];
  const totalPages = Math.ceil((invoicesData?.totalElements || 0) / 20);
  const visibleInvoices = invoices.filter((invoice: any) => filter === 'all'
    || (filter === 'paid' ? invoice.status === 'paid' : invoice.status !== 'paid'));
  const pageTotal = invoices.reduce((sum: number, invoice: any) => sum + (invoice.grandTotal || 0), 0);

  const statusMeta: Record<string, { label: string; color: string }> = {
    pending_approval: { label: t('pages.invoicesHistory.status.pendingApproval'), color: 'text-amber-400 bg-amber-500/10' },
    approved: { label: t('pages.invoicesHistory.status.approved'), color: 'text-blue-400 bg-blue-500/10' },
    paid: { label: t('pages.invoicesHistory.status.paid'), color: 'text-emerald-400 bg-emerald-500/10' },
    rejected: { label: t('pages.invoicesHistory.status.rejected'), color: 'text-red-400 bg-red-500/10' },
    cancelled: { label: t('pages.invoicesHistory.status.cancelled'), color: 'text-surface-500 bg-surface-800' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t('pages.invoicesHistory.title')}</h1>
        <p className="text-surface-400 text-sm mt-1">{t('pages.invoicesHistory.subtitle')}</p>
      </div>

      {invoices.length > 0 && <>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4"><p className="text-xs text-surface-500">عدد الفواتير</p><p className="mt-1 text-2xl font-black text-surface-900 dark:text-white">{invoicesData?.totalElements || invoices.length}</p></div>
          <div className="card p-4"><p className="flex items-center gap-1 text-xs text-surface-500"><WalletCards size={13}/> قيمة الصفحة</p><p className="mt-1 text-xl font-black text-accent-600 dark:text-accent-400">{pageTotal.toLocaleString('ar-SA')} ر.س</p></div>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-800">
          {([['all','الكل'],['pending','بانتظار الإجراء'],['paid','المدفوعة']] as const).map(([key,label]) => <button key={key} onClick={()=>setFilter(key)} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${filter===key?'bg-accent-500 text-white':'text-surface-600 dark:text-surface-300'}`}>{label}</button>)}
        </div>
      </>}

      {isLoading ? (
        <div className="text-center py-12 text-surface-400">{t('pages.invoicesHistory.loading')}</div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-surface-500">
          <FileText size={48} className="mb-4 opacity-40" />
          <p className="font-medium">{t('pages.invoicesHistory.emptyTitle')}</p>
          <p className="text-sm mt-1">{t('pages.invoicesHistory.emptyDescription')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800/80 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700 text-surface-500 text-xs">
                  <th className="text-right py-3 px-4 font-medium">{t('pages.invoicesHistory.invoiceNumber')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('pages.invoicesHistory.workshop')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('pages.invoicesHistory.date')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('pages.invoicesHistory.amount')}</th>
                  <th className="text-right py-3 px-4 font-medium">{t('pages.invoicesHistory.status')}</th>
                  <th className="text-center py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-surface-900 dark:text-surface-200 font-mono text-xs">
                      {inv.invoiceNumber || `#${inv.id}`}
                    </td>
                    <td className="py-3 px-4 text-surface-700 dark:text-surface-300">{inv.workshopName || t('pages.invoicesHistory.workshop')}</td>
                    <td className="py-3 px-4 text-surface-400">
                      {new Date(inv.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-4 font-bold text-surface-900 dark:text-surface-100">
                      {inv.grandTotal?.toLocaleString()} {t('constants.currency')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusMeta[inv.status]?.color || 'text-surface-400 bg-surface-800'}`}>
                        {inv.status === 'paid' && <CheckCircle2 size={10} />}
                        {inv.status === 'pending_approval' && <Clock size={10} />}
                        {inv.status === 'rejected' && <XCircle size={10} />}
                        {statusMeta[inv.status]?.label || inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/orders/${inv.requestId}`}
                        className="inline-flex items-center gap-1 text-accent-400 hover:text-accent-300 text-xs font-medium"
                      >
                        <Eye size={12} />
                        {t('pages.invoicesHistory.viewRequest')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-surface-800">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-lg border border-surface-700 text-surface-300 disabled:opacity-40 hover:bg-surface-800 transition-colors"
              >
                {t('pages.invoicesHistory.previous')}
              </button>
              <span className="text-sm text-surface-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-surface-700 text-surface-300 disabled:opacity-40 hover:bg-surface-800 transition-colors"
              >
                {t('pages.invoicesHistory.next')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
